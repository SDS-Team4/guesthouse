import type { ApiEnvelope } from './types';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_ENDPOINT = '/api/v1/auth/csrf-token';
const CSRF_HEADER = 'X-CSRF-Token';

let csrfToken: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;

export async function apiRequest<T>(input: string, init?: RequestInit): Promise<T> {
  return apiRequestInternal<T>(input, init, true);
}

async function apiRequestInternal<T>(input: string, init: RequestInit | undefined, allowRetry: boolean): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase();
  if (!SAFE_METHODS.has(method)) {
    await ensureCsrfToken();
  }

  const response = await fetch(input, buildRequestInit(init, method));
  syncCsrfTokenFromResponse(response);

  let envelope: ApiEnvelope<T> | null = null;

  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    envelope = null;
  }

  if ((!response.ok || !envelope?.success) && allowRetry && shouldRetryWithFreshCsrf(response.status, envelope?.error?.code)) {
    csrfToken = null;
    await ensureCsrfToken();
    return apiRequestInternal<T>(input, init, false);
  }

  if (!response.ok || !envelope?.success) {
    const errorMessage = envelope?.error?.message ?? 'Request failed.';
    const errorCode = envelope?.error?.code ?? 'UNKNOWN';
    const error = new Error(errorMessage) as Error & { status?: number; code?: string };
    error.status = response.status;
    error.code = errorCode;
    throw error;
  }

  return envelope.data;
}

function buildRequestInit(init: RequestInit | undefined, method: string): RequestInit {
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has('Content-Type') && method !== 'GET' && method !== 'HEAD') {
    headers.set('Content-Type', 'application/json');
  }
  if (!SAFE_METHODS.has(method) && csrfToken) {
    headers.set(CSRF_HEADER, csrfToken);
  }

  return {
    credentials: 'include',
    ...init,
    headers
  };
}

async function ensureCsrfToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }
  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

  csrfTokenPromise = fetchCsrfToken();
  try {
    csrfToken = await csrfTokenPromise;
    return csrfToken;
  } finally {
    csrfTokenPromise = null;
  }
}

async function fetchCsrfToken(): Promise<string> {
  const response = await fetch(CSRF_ENDPOINT, {
    method: 'GET',
    credentials: 'include'
  });
  syncCsrfTokenFromResponse(response);

  const envelope = (await response.json()) as ApiEnvelope<{ headerName: string; token: string }>;
  if (!response.ok || !envelope?.success || !envelope.data?.token) {
    throw new Error('Failed to obtain CSRF token.');
  }

  csrfToken = envelope.data.token;
  return envelope.data.token;
}

function syncCsrfTokenFromResponse(response: Response) {
  const headerToken = response.headers.get(CSRF_HEADER);
  if (headerToken) {
    csrfToken = headerToken;
  }
}

function shouldRetryWithFreshCsrf(status: number, errorCode: string | undefined) {
  return status === 403 && errorCode === 'INVALID_CSRF_TOKEN';
}
