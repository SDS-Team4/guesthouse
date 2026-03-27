import { apiRequest } from './api';
import {
  AccountProfileFormState,
  AccommodationDetail,
  AccommodationSearchResult,
  AuthenticatedUser,
  GuestAccountProfile,
  GuestSignupResponse,
  HostRoleRequestState,
  PasswordFormState,
  ReservationCancellationResponse,
  ReservationCreateResponse,
  ReservationDetail,
  ReservationSummary,
  RoomTypeCalendar,
  SearchFormState,
  SignupFormState,
  SignupTerm
} from './types';

function buildSearchParams(searchForm: SearchFormState) {
  const params = new URLSearchParams({
    checkInDate: searchForm.checkInDate,
    checkOutDate: searchForm.checkOutDate,
    guestCount: searchForm.guestCount
  });

  if (searchForm.region.trim()) {
    params.set('region', searchForm.region.trim().toUpperCase());
  }

  return params;
}

export function fetchCurrentUser() {
  return apiRequest<AuthenticatedUser>('/api/v1/auth/me', { method: 'GET' });
}

export function loginGuest(loginId: string, password: string) {
  return apiRequest<AuthenticatedUser>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ loginId, password })
  });
}

export function signupGuest(signupForm: SignupFormState) {
  return apiRequest<GuestSignupResponse>('/api/v1/auth/signup', {
    method: 'POST',
    body: JSON.stringify(signupForm)
  });
}

export function fetchSignupTerms() {
  return apiRequest<SignupTerm[]>('/api/v1/auth/signup-terms', { method: 'GET' });
}

export function logoutGuest() {
  return apiRequest('/api/v1/auth/logout', { method: 'POST' });
}

export function searchAccommodations(searchForm: SearchFormState) {
  const params = buildSearchParams(searchForm);
  return apiRequest<AccommodationSearchResult[]>(`/api/v1/accommodations/search?${params.toString()}`, {
    method: 'GET'
  });
}

export function fetchAccommodationDetail(accommodationId: number, searchForm: SearchFormState) {
  const params = buildSearchParams(searchForm);
  return apiRequest<AccommodationDetail>(`/api/v1/accommodations/${accommodationId}?${params.toString()}`, {
    method: 'GET'
  });
}

export function fetchRoomTypeCalendar(
  accommodationId: number,
  roomTypeId: number,
  searchForm: SearchFormState
) {
  const params = new URLSearchParams({
    startDate: searchForm.checkInDate,
    endDate: searchForm.checkOutDate
  });
  return apiRequest<RoomTypeCalendar>(
    `/api/v1/accommodations/${accommodationId}/room-types/${roomTypeId}/calendar?${params.toString()}`,
    { method: 'GET' }
  );
}

export function createReservation(
  roomTypeId: number,
  guestCount: number,
  checkInDate: string,
  checkOutDate: string
) {
  return apiRequest<ReservationCreateResponse>('/api/v1/reservations', {
    method: 'POST',
    body: JSON.stringify({
      roomTypeId,
      guestCount,
      checkInDate,
      checkOutDate
    })
  });
}

export function fetchReservations() {
  return apiRequest<ReservationSummary[]>('/api/v1/reservations/my', { method: 'GET' });
}

export function fetchReservationDetail(reservationId: number) {
  return apiRequest<ReservationDetail>(`/api/v1/reservations/${reservationId}`, {
    method: 'GET'
  });
}

export function cancelReservation(reservationId: number) {
  return apiRequest<ReservationCancellationResponse>(`/api/v1/reservations/${reservationId}/cancel`, {
    method: 'POST'
  });
}

export function fetchHostRoleRequestState() {
  return apiRequest<HostRoleRequestState>('/api/v1/account/host-role-request', { method: 'GET' });
}

export function createHostRoleRequest(requestReason: string) {
  return apiRequest<HostRoleRequestState>('/api/v1/account/host-role-request', {
    method: 'POST',
    body: JSON.stringify({ requestReason })
  });
}

export function fetchAccountProfile() {
  return apiRequest<GuestAccountProfile>('/api/v1/account/me', { method: 'GET' });
}

export function updateAccountProfile(profileForm: AccountProfileFormState) {
  return apiRequest<GuestAccountProfile>('/api/v1/account/me', {
    method: 'PATCH',
    body: JSON.stringify(profileForm)
  });
}

export function changeGuestPassword(passwordForm: PasswordFormState) {
  return apiRequest<{ changed: boolean; changedAt: string }>('/api/v1/account/password', {
    method: 'POST',
    body: JSON.stringify(passwordForm)
  });
}
