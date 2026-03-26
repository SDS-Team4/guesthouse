import {
  ReservationCancellationResponse,
  ReservationCreateResponse,
  ReservationDetail,
  ReservationSummary
} from '../guest-api-types';
import { apiRequest } from '../../shared/api/apiRequest';
import {
  GuestCreateReservationRequestContract,
  GuestCreateReservationResponseContract,
  GuestReservationCancellationResponseContract,
  GuestReservationDetailResponseContract,
  GuestReservationSummaryResponseContract
} from './api-contract';

function normalizeCreateReservationResponse(
  contract: GuestCreateReservationResponseContract
): ReservationCreateResponse {
  return {
    reservationId: contract.reservationId,
    reservationNo: contract.reservationNo,
    accommodationId: contract.accommodationId,
    accommodationName: contract.accommodationName,
    roomTypeId: contract.roomTypeId,
    roomTypeName: contract.roomTypeName,
    guestCount: contract.guestCount,
    checkInDate: contract.checkInDate,
    checkOutDate: contract.checkOutDate,
    status: 'PENDING',
    requestedAt: contract.requestedAt
  };
}

function normalizeReservationSummary(
  contract: GuestReservationSummaryResponseContract
): ReservationSummary {
  return {
    reservationId: contract.reservationId,
    reservationNo: contract.reservationNo,
    accommodationId: contract.accommodationId,
    accommodationName: contract.accommodationName,
    roomTypeId: contract.roomTypeId,
    roomTypeName: contract.roomTypeName,
    guestCount: contract.guestCount,
    checkInDate: contract.checkInDate,
    checkOutDate: contract.checkOutDate,
    status: contract.status,
    requestedAt: contract.requestedAt,
    confirmedAt: contract.confirmedAt,
    cancelledAt: contract.cancelledAt
  };
}

function normalizeReservationDetail(
  contract: GuestReservationDetailResponseContract
): ReservationDetail {
  return {
    reservationId: contract.reservationId,
    reservationNo: contract.reservationNo,
    accommodation: {
      accommodationId: contract.accommodation.accommodationId,
      accommodationName: contract.accommodation.accommodationName,
      region: contract.accommodation.region,
      address: contract.accommodation.address
    },
    roomType: {
      roomTypeId: contract.roomType.roomTypeId,
      roomTypeName: contract.roomType.roomTypeName
    },
    guestCount: contract.guestCount,
    checkInDate: contract.checkInDate,
    checkOutDate: contract.checkOutDate,
    status: contract.status,
    requestedAt: contract.requestedAt,
    confirmedAt: contract.confirmedAt,
    cancelledAt: contract.cancelledAt,
    cancellationCutoffAt: contract.cancellationCutoffAt,
    cancellationAllowed: contract.cancellationAllowed,
    cancellationBlockedReason: contract.cancellationBlockedReason,
    nights: contract.nights.map((night) => ({
      reservationNightId: night.reservationNightId,
      stayDate: night.stayDate
    })),
    statusHistory: contract.statusHistory.map((history) => ({
      fromStatus: history.fromStatus,
      toStatus: history.toStatus,
      actionType: history.actionType,
      reasonType: history.reasonType,
      reasonText: history.reasonText,
      changedAt: history.changedAt
    }))
  };
}

function normalizeReservationCancellationResponse(
  contract: GuestReservationCancellationResponseContract
): ReservationCancellationResponse {
  return {
    reservationId: contract.reservationId,
    reservationNo: contract.reservationNo,
    status: contract.status,
    cancelledAt: contract.cancelledAt
  };
}

export async function createReservation(payload: GuestCreateReservationRequestContract) {
  const response = await apiRequest<GuestCreateReservationResponseContract>('/api/v1/reservations', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return normalizeCreateReservationResponse(response);
}

export async function fetchMyReservations() {
  const response = await apiRequest<GuestReservationSummaryResponseContract[]>('/api/v1/reservations/my', {
    method: 'GET'
  });
  return response.map(normalizeReservationSummary);
}

export async function fetchReservationDetail(reservationId: number) {
  const response = await apiRequest<GuestReservationDetailResponseContract>(
    `/api/v1/reservations/${reservationId}`,
    {
      method: 'GET'
    }
  );
  return normalizeReservationDetail(response);
}

export async function cancelReservation(reservationId: number) {
  const response = await apiRequest<GuestReservationCancellationResponseContract>(
    `/api/v1/reservations/${reservationId}/cancel`,
    { method: 'POST' }
  );
  return normalizeReservationCancellationResponse(response);
}
