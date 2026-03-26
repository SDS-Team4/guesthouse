import {
  AuthenticatedUser,
  GuestSignupResponse,
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

export function logoutGuest() {
  return apiRequest('/api/v1/auth/logout', { method: 'POST' });
}
