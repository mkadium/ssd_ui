import { getApiAccessToken } from "@/api/session";
import { useAuthStore } from "@/stores/useAuthStore";
import type { RefreshResponse } from "@/types/auth";

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  auth?: boolean;
  json?: unknown;
};

export class ApiError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(status: number, detail: unknown) {
    super(`API request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "";
let refreshPromise: Promise<boolean> | null = null;

function buildApiUrl(path: string) {
  if (!apiBaseUrl) {
    return path;
  }

  const normalizedBaseUrl = apiBaseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}

async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = useAuthStore.getState().refreshToken;

    if (!refreshToken) {
      useAuthStore.getState().clearAuth();
      return false;
    }

    try {
      const response = await fetch(buildApiUrl("/auth/refresh"), {
        method: "POST",
        headers: new Headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        useAuthStore.getState().clearAuth();
        return false;
      }

      const data = (await response.json()) as RefreshResponse;
      useAuthStore.getState().setAccessToken(data.access_token);

      return true;
    } catch {
      useAuthStore.getState().clearAuth();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function buildRequestHeaders(headers: HeadersInit | undefined, auth: boolean) {
  const requestHeaders = new Headers(headers);
  const token = getApiAccessToken();

  if (auth && token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  return requestHeaders;
}

export async function apiRequest<T>(
  path: string,
  { auth = true, headers, json, ...init }: ApiRequestOptions = {},
): Promise<T> {
  const body = json === undefined ? undefined : JSON.stringify(json);
  const requestUrl = buildApiUrl(path);

  let response: Response;

  try {
    const requestHeaders = buildRequestHeaders(headers, auth);

    if (json !== undefined && !requestHeaders.has("Content-Type")) {
      requestHeaders.set("Content-Type", "application/json");
    }

    response = await fetch(requestUrl, {
      ...init,
      headers: requestHeaders,
      body,
    });
  } catch (error) {
    throw new ApiError(
      0,
      error instanceof Error ? error.message : "Unable to reach the API.",
    );
  }

  if (auth && response.status === 401 && path !== "/auth/refresh") {
    const didRefresh = await refreshAccessToken();

    if (didRefresh) {
      const retryHeaders = buildRequestHeaders(headers, auth);

      if (json !== undefined && !retryHeaders.has("Content-Type")) {
        retryHeaders.set("Content-Type", "application/json");
      }

      try {
        response = await fetch(requestUrl, {
          ...init,
          headers: retryHeaders,
          body,
        });
      } catch (error) {
        throw new ApiError(
          0,
          error instanceof Error ? error.message : "Unable to reach the API.",
        );
      }
    }
  }

  if (!response.ok) {
    let detail: unknown;

    try {
      detail = await response.json();
    } catch {
      detail = await response.text();
    }

    throw new ApiError(response.status, detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
