import { API_BASE_URL, API_V1_PREFIX } from "@/lib/constants";
import type { ApiErrorResponse } from "@/types";

export class ApiClientError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorResponse;
    return body.detail ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${API_V1_PREFIX}${path}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const detail = await parseError(response);
    throw new ApiClientError(detail, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function apiUpload<T>(
  path: string,
  formData: FormData
): Promise<T> {
  const url = `${API_BASE_URL}${API_V1_PREFIX}${path}`;

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const detail = await parseError(response);
    throw new ApiClientError(detail, response.status);
  }

  return response.json() as Promise<T>;
}
