import {
  AuthenticatedUser,
  SignupFieldAvailability,
  GuestSignupResponse,
  SignupLoginIdAvailability,
  SignupTerm
} from '../guest-api-types';
import { apiRequest } from '../../shared/api/apiRequest';

export function fetchSignupTerms() {
  return apiRequest<SignupTerm[]>('/api/v1/auth/signup-terms', { method: 'GET' });
}

export function fetchCurrentGuest() {
  return apiRequest<AuthenticatedUser>('/api/v1/auth/me', { method: 'GET' });
}

export function loginGuest(loginId: string, password: string) {
  return apiRequest<AuthenticatedUser>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ loginId, password })
  }).then(async (authenticatedUser) => {
    try {
      await apiRequest<AuthenticatedUser>('/api/v1/auth/me', { method: 'GET' });
    } catch {
      // Keep the successful login result even if the follow-up session refresh fails.
    }
    return authenticatedUser;
  });
}

export function signupGuest(signupForm: {
  loginId: string;
  password: string;
  passwordConfirm: string;
  name: string;
  email: string;
  phone: string;
  agreedTermIds: number[];
}) {
  return apiRequest<GuestSignupResponse>('/api/v1/auth/signup', {
    method: 'POST',
    body: JSON.stringify(signupForm)
  });
}

export function checkSignupLoginIdAvailability(loginId: string) {
  const query = new URLSearchParams({ loginId }).toString();
  return apiRequest<SignupLoginIdAvailability>(`/api/v1/auth/signup-login-id-availability?${query}`, {
    method: 'GET'
  });
}

export function checkSignupFieldAvailability(fields: {
  loginId?: string;
  email?: string;
  phone?: string;
}) {
  const params = new URLSearchParams();
  if (fields.loginId) {
    params.set('loginId', fields.loginId);
  }
  if (fields.email) {
    params.set('email', fields.email);
  }
  if (fields.phone) {
    params.set('phone', fields.phone);
  }
  const query = params.toString();
  const path = query ? `/api/v1/auth/signup-field-availability?${query}` : '/api/v1/auth/signup-field-availability';
  return apiRequest<SignupFieldAvailability>(path, { method: 'GET' });
}

export function logoutGuest() {
  return apiRequest('/api/v1/auth/logout', { method: 'POST' });
}
