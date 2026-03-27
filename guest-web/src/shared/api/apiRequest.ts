export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error: { code: string; message: string } | null;
  timestamp: string;
};

export type ApiRequestError = Error & {
  status?: number;
  code?: string;
};

function readCsrfTokenFromCookie() {
  if (typeof document === 'undefined') {
    return null;
  }
  const csrfCookie = document.cookie
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.endsWith('_CSRF') || entry.includes('_CSRF='));

  if (!csrfCookie) {
    return null;
  }

  const separatorIndex = csrfCookie.indexOf('=');
  if (separatorIndex < 0) {
    return null;
  }
  return decodeURIComponent(csrfCookie.slice(separatorIndex + 1));
}

function buildHeaders(init?: RequestInit) {
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const method = (init?.method ?? 'GET').toUpperCase();
  const csrfToken = readCsrfTokenFromCookie();
  if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    headers.set('X-CSRF-Token', csrfToken);
  }
  return headers;
}

export async function apiRequest<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    credentials: 'include',
    headers: buildHeaders(init)
  });

  let envelope: ApiEnvelope<T> | null = null;
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    envelope = null;
  }

  if (!response.ok || !envelope?.success) {
    const errorMessage = envelope?.error?.message ?? 'Request failed.';
    const errorCode = envelope?.error?.code ?? 'UNKNOWN';
    const error = new Error(errorMessage) as ApiRequestError;
    error.status = response.status;
    error.code = errorCode;
    throw error;
  }

  return envelope.data;
}
