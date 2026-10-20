/**
 * Thin wrapper around the shared axios client for Amble endpoints (rules
 * 9, 14, 34, 36, 40, 41, 67). Adds explicit timeouts, bounded retries on
 * idempotent verbs, and a domain error type so callers can react without
 * poking at low-level HTTP status codes.
 */
import type { AxiosError, AxiosRequestConfig } from "axios";
import api from "@/lib/api";
import {
  API_RETRY_BASE_MS,
  API_RETRY_COUNT,
  API_TIMEOUT_MS,
} from "../data/constants";

export type AmbleApiErrorCode =
  | "timeout"
  | "network"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation"
  | "server"
  | "unknown";

export class AmbleApiError extends Error {
  readonly code: AmbleApiErrorCode;
  readonly entityId?: string;
  constructor(code: AmbleApiErrorCode, message: string, entityId?: string) {
    super(message);
    this.name = "AmbleApiError";
    this.code = code;
    this.entityId = entityId;
  }
}

const HTTP_STATUS_TO_CODE: Record<number, AmbleApiErrorCode> = {
  400: "validation",
  401: "unauthorized",
  403: "forbidden",
  404: "not_found",
  422: "validation",
  500: "server",
  502: "server",
  503: "server",
  504: "timeout",
};

const NON_RETRYABLE_CODES = new Set<AmbleApiErrorCode>([
  "unauthorized",
  "forbidden",
  "validation",
  "not_found",
]);

function classifyError(cause: unknown, entityId?: string): AmbleApiError {
  const err = cause as AxiosError | undefined;
  if (err?.code === "ECONNABORTED") {
    return new AmbleApiError("timeout", "Request timed out", entityId);
  }
  if (!err?.response) {
    return new AmbleApiError("network", "Network error", entityId);
  }
  const code = HTTP_STATUS_TO_CODE[err.response.status] ?? "unknown";
  return new AmbleApiError(code, `HTTP ${err.response.status}`, entityId);
}

async function backoffDelay(attempt: number): Promise<void> {
  const ms = API_RETRY_BASE_MS * 2 ** attempt;
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number,
  entityId?: string,
): Promise<T> {
  let lastCause: unknown = null;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (cause) {
      lastCause = cause;
      const classified = classifyError(cause, entityId);
      if (NON_RETRYABLE_CODES.has(classified.code)) throw classified;
      if (attempt < maxAttempts - 1) await backoffDelay(attempt);
    }
  }
  throw classifyError(lastCause, entityId);
}

const REQUEST_CONFIG: AxiosRequestConfig = { timeout: API_TIMEOUT_MS };

/** GET is idempotent — safe to retry. */
export async function ambleGet<T>(url: string, entityId?: string): Promise<T> {
  try {
    return await withRetry(
      () => api.get<T>(url, REQUEST_CONFIG).then((r) => r.data),
      API_RETRY_COUNT,
      entityId,
    );
  } catch (cause) {
    console.error("Amble GET failed", { url, entityId, cause });
    throw cause instanceof AmbleApiError ? cause : classifyError(cause, entityId);
  }
}

/** PUT is idempotent — safe to retry. */
export async function amblePut<T>(url: string, body: unknown): Promise<T> {
  try {
    return await withRetry(
      () => api.put<T>(url, body, REQUEST_CONFIG).then((r) => r.data),
      API_RETRY_COUNT,
    );
  } catch (cause) {
    console.error("Amble PUT failed", { url, cause });
    throw cause instanceof AmbleApiError ? cause : classifyError(cause);
  }
}

/** POST is NOT retried — the caller decides idempotency. */
export async function amblePost<T>(
  url: string,
  body: unknown,
  entityId?: string,
): Promise<T> {
  try {
    const response = await api.post<T>(url, body, REQUEST_CONFIG);
    return response.data;
  } catch (cause) {
    console.error("Amble POST failed", { url, entityId, cause });
    throw classifyError(cause, entityId);
  }
}
