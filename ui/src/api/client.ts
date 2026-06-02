import { getApiAccessToken } from "@/api/session";

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

function buildApiUrl(path: string) {
  if (!apiBaseUrl) {
    return path;
  }

  const normalizedBaseUrl = apiBaseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}

export async function apiRequest<T>(
  path: string,
  { auth = true, headers, json, ...init }: ApiRequestOptions = {},
): Promise<T> {
  const requestHeaders = new Headers(headers);

  if (json !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const token = getApiAccessToken();

  if (auth && token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(buildApiUrl(path), {
      ...init,
      headers: requestHeaders,
      body: json === undefined ? undefined : JSON.stringify(json),
    });
  } catch (error) {
    throw new ApiError(
      0,
      error instanceof Error ? error.message : "Unable to reach the API.",
    );
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
