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

const GUEST_CSRF_COOKIE_NAME = 'GUEST_API_CSRF';
const CSRF_FAILURE_MESSAGE = 'CSRF token validation failed.';

function readCsrfTokenFromCookie() {
  if (typeof document === 'undefined') {
    return null;
  }
  const csrfCookie = document.cookie
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${GUEST_CSRF_COOKIE_NAME}=`));

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

async function readEnvelope<T>(response: Response): Promise<ApiEnvelope<T> | null> {
  try {
    return (await response.json()) as ApiEnvelope<T>;
  } catch {
    return null;
  }
}

function isCsrfFailure<T>(response: Response, envelope: ApiEnvelope<T> | null, init?: RequestInit) {
  const method = (init?.method ?? 'GET').toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return false;
  }
  return response.status === 403 && envelope?.error?.message === CSRF_FAILURE_MESSAGE;
}

async function refreshGuestCsrfCookie() {
  await fetch('/api/v1/auth/me', {
    method: 'GET',
    credentials: 'include'
  });
}

export async function apiRequest<T>(input: string, init?: RequestInit): Promise<T> {
  let response = await fetch(input, {
    ...init,
    credentials: 'include',
    headers: buildHeaders(init)
  });

  let envelope = await readEnvelope<T>(response);

  if (isCsrfFailure(response, envelope, init)) {
    await refreshGuestCsrfCookie();
    response = await fetch(input, {
      ...init,
      credentials: 'include',
      headers: buildHeaders(init)
    });
    envelope = await readEnvelope<T>(response);
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
