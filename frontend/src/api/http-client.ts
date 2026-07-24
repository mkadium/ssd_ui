const RAW_API_BASE_URL = import.meta.env.VITE_SSD_API_BASE_URL;
const API_BASE_URL = resolveApiBaseUrl(RAW_API_BASE_URL);
const ACCESS_TOKEN_KEY = "ssd_access_token";
const REFRESH_TOKEN_KEY = "ssd_refresh_token";
const CURRENT_USER_KEY = "ssd_current_user";
const LAST_ACTIVITY_KEY = "ssd_last_activity_at";
const AUTH_EXPIRED_EVENT = "ssd-auth-expired";

export type ApiResult<T> = {
  data: T;
  requestId?: string;
};

export async function apiGet<T>(path: string): Promise<ApiResult<T>> {
  const response = await requestWithRefresh(path, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message || `API request failed: ${response.status}`);
  }

  return {
    data: (await response.json()) as T,
    requestId: response.headers.get("x-request-id") ?? undefined,
  };
}

export async function apiPost<T, TBody extends object>(path: string, body: TBody): Promise<ApiResult<T>> {
  return apiSend<T, TBody>("POST", path, body);
}

export async function apiPatch<T, TBody extends object>(path: string, body: TBody): Promise<ApiResult<T>> {
  return apiSend<T, TBody>("PATCH", path, body);
}

export async function apiPut<T, TBody extends object>(path: string, body: TBody): Promise<ApiResult<T>> {
  return apiSend<T, TBody>("PUT", path, body);
}

export async function apiDelete<T, TBody extends object = Record<string, never>>(path: string, body?: TBody): Promise<ApiResult<T>> {
  const response = await requestWithRefresh(path, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message || `API request failed: ${response.status}`);
  }

  return {
    data: (await response.json()) as T,
    requestId: response.headers.get("x-request-id") ?? undefined,
  };
}

async function apiSend<T, TBody extends object>(
  method: "POST" | "PATCH" | "PUT",
  path: string,
  body: TBody,
): Promise<ApiResult<T>> {
  const response = await requestWithRefresh(path, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message || `API request failed: ${response.status}`);
  }

  return {
    data: (await response.json()) as T,
    requestId: response.headers.get("x-request-id") ?? undefined,
  };
}

function getAuthHeader(): Record<string, string> {
  const token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getStoredAccessToken(): string {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY) ?? "";
}

export function buildApiUrl(path: string): string {
  return apiUrl(path);
}

async function requestWithRefresh(path: string, init: RequestInit): Promise<Response> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      ...getAuthHeader(),
    },
  });

  if (response.status !== 401 || path === "/auth/login" || path === "/auth/refresh") {
    return response;
  }

  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    clearStoredAuth();
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    return response;
  }

  return fetch(apiUrl(path), {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      ...getAuthHeader(),
    },
  });
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    return false;
  }

  const response = await fetch(apiUrl("/auth/refresh"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    return false;
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) {
    return false;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, payload.access_token);
  return true;
}

function clearStoredAuth(): void {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(CURRENT_USER_KEY);
  window.localStorage.removeItem(LAST_ACTIVITY_KEY);
}

function resolveApiBaseUrl(configuredUrl: string | undefined): string {
  const trimmedUrl = configuredUrl?.trim();
  if (trimmedUrl) {
    if (trimmedUrl.startsWith("/") && window.location.protocol === "file:") {
      return "http://localhost:8100";
    }
    if (trimmedUrl.startsWith("/") && (window.location.protocol === "http:" || window.location.protocol === "https:")) {
      return `${window.location.origin}${trimmedUrl.replace(/\/$/, "")}`;
    }
    return trimmedUrl.replace(/\/$/, "");
  }

  if (window.location.protocol === "http:" || window.location.protocol === "https:") {
    return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://localhost:8100"
      : `${window.location.origin}/api`;
  }

  return "http://localhost:8100";
}

function apiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function readErrorMessage(response: Response): Promise<string | undefined> {
  try {
    const payload = (await response.json()) as { detail?: string | { msg?: string }[] };
    if (typeof payload.detail === "string") {
      return payload.detail;
    }
    if (Array.isArray(payload.detail)) {
      return payload.detail.map((item) => item.msg).filter(Boolean).join(", ");
    }
  } catch {
    return undefined;
  }
  return undefined;
}
