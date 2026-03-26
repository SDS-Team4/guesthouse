import {
  GuestAccountProfile,
  HostRoleRequestState
} from '../guest-api-types';
import { apiRequest } from '../../shared/api/apiRequest';

export function fetchAccountProfile() {
  return apiRequest<GuestAccountProfile>('/api/v1/account/me', {
    method: 'GET'
  });
}

export function updateAccountProfile(profile: {
  name: string;
  email: string;
  phone: string;
}) {
  return apiRequest<GuestAccountProfile>('/api/v1/account/me', {
    method: 'PATCH',
    body: JSON.stringify(profile)
  });
}

export function changeGuestPassword(passwordForm: {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}) {
  return apiRequest<{ changed: boolean; changedAt: string }>('/api/v1/account/password', {
    method: 'POST',
    body: JSON.stringify(passwordForm)
  });
}

export function fetchHostRoleRequestState() {
  return apiRequest<HostRoleRequestState>('/api/v1/account/host-role-request', {
    method: 'GET'
  });
}

export function createHostRoleRequest(requestReason: string) {
  return apiRequest<HostRoleRequestState>('/api/v1/account/host-role-request', {
    method: 'POST',
    body: JSON.stringify({ requestReason })
  });
}
