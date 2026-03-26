import { GuestReservationStatus } from './types';

export type GuestCreateReservationRequestContract = {
  roomTypeId: number;
  guestCount: number;
  checkInDate: string;
  checkOutDate: string;
};

export type GuestCreateReservationResponseContract = {
  reservationId: number;
  reservationNo: string;
  accommodationId: number;
  accommodationName: string;
  roomTypeId: number;
  roomTypeName: string;
  guestCount: number;
  checkInDate: string;
  checkOutDate: string;
  status: GuestReservationStatus;
  requestedAt: string;
};

export type GuestReservationSummaryResponseContract = {
  reservationId: number;
  reservationNo: string;
  accommodationId: number;
  accommodationName: string;
  roomTypeId: number;
  roomTypeName: string;
  guestCount: number;
  checkInDate: string;
  checkOutDate: string;
  status: GuestReservationStatus;
  requestedAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
};

export type GuestReservationDetailResponseContract = {
  reservationId: number;
  reservationNo: string;
  accommodation: {
    accommodationId: number;
    accommodationName: string;
    region: string;
    address: string;
  };
  roomType: {
    roomTypeId: number;
    roomTypeName: string;
  };
  guestCount: number;
  checkInDate: string;
  checkOutDate: string;
  status: GuestReservationStatus;
  requestedAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancellationCutoffAt: string;
  cancellationAllowed: boolean;
  cancellationBlockedReason: string | null;
  nights: Array<{
    reservationNightId: number;
    stayDate: string;
  }>;
  statusHistory: Array<{
    fromStatus: GuestReservationStatus | null;
    toStatus: GuestReservationStatus;
    actionType:
      | 'REQUESTED'
      | 'HOST_CONFIRMED'
      | 'HOST_REJECTED'
      | 'GUEST_CANCELLED'
      | 'HOST_CANCELLED'
      | 'ADMIN_CANCELLED';
    reasonType: string | null;
    reasonText: string | null;
    changedAt: string;
  }>;
};

export type GuestReservationCancellationResponseContract = {
  reservationId: number;
  reservationNo: string;
  status: 'CANCELLED';
  cancelledAt: string;
};
