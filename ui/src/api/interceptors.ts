import axios from "axios";

import type {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";

import { apiClient } from "@/api/client";
import { useAuthStore } from "@/stores/useAuthStore";

interface RetryAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

let initialized = false;
let isRefreshing = false;

let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, accessToken: string | null) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (accessToken) {
      promise.resolve(accessToken);
    }
  });

  failedQueue = [];
}

export function setupInterceptors() {
  if (initialized) return;

  initialized = true;

  // REQUEST INTERCEPTOR
  apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = useAuthStore.getState().accessToken;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error),
  );

  // RESPONSE INTERCEPTOR
  apiClient.interceptors.response.use(
    (response) => response,

    async (error: AxiosError) => {
      const originalRequest = error.config as RetryAxiosRequestConfig;

      if (!originalRequest) {
        return Promise.reject(error);
      }

      // Ignore non-401 errors
      if (error.response?.status !== 401) {
        return Promise.reject(error);
      }

      // Prevent refresh endpoint loop
      if (originalRequest.url?.includes("/auth/refresh")) {
        useAuthStore.getState().clearAuth();
        window.location.href = "/login";

        return Promise.reject(error);
      }

      // Already retried once
      if (originalRequest._retry) {
        return Promise.reject(error);
      }

      // Queue requests while refresh is running
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({
            resolve,
            reject,
          });
        }).then((token) => {
          originalRequest.headers ??= {};

          originalRequest.headers.Authorization = `Bearer ${token}`;

          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;

        if (!refreshToken) {
          throw new Error("No refresh token found");
        }

        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {
            refresh_token: refreshToken,
          },
        );

        const newAccessToken = data.access_token;

        useAuthStore.getState().setAccessToken(newAccessToken);

        processQueue(null, newAccessToken);

        originalRequest.headers ??= {};

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        useAuthStore.getState().clearAuth();

        window.location.href = "/login";

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    },
  );
}
