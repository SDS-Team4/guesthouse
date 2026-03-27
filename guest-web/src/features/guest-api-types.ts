export type AuthenticatedUser = {
  userId: number;
  loginId: string;
  name: string;
  role: 'GUEST';
};

export type SignupTerm = {
  termId: number;
  category: string;
  title: string;
  content: string;
  version: string;
  effectiveAt: string;
};

export type GuestSignupResponse = {
  registered: true;
};

export type SignupLoginIdAvailability = {
  loginId: string;
  available: boolean;
};

export type SignupFieldAvailability = {
  loginId: string | null;
  loginIdAvailable: boolean | null;
  email: string | null;
  emailAvailable: boolean | null;
  phone: string | null;
  phoneAvailable: boolean | null;
};

export type HostRoleRequestStatus = 'PENDING' | 'APPROVED' | 'DENIED';

export type HostRoleRequestState = {
  currentUserRole: 'GUEST' | 'HOST' | 'ADMIN';
  canSubmitNewRequest: boolean;
  blockedReason: string | null;
  latestRequest: {
    requestId: number;
    requestReason: string;
    status: HostRoleRequestStatus;
    reviewedByUserId: number | null;
    reviewedByLoginId: string | null;
    reviewedByName: string | null;
    reviewReason: string | null;
    createdAt: string;
    reviewedAt: string | null;
  } | null;
};

export type GuestAccountProfile = {
  userId: number;
  loginId: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: 'GUEST';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
};

export type AccommodationAvailabilityCategory = 'AVAILABLE' | 'CONDITION_MISMATCH' | 'SOLD_OUT';

export type AccommodationSearchResult = {
  accommodationId: number;
  accommodationName: string;
  region: string;
  availabilityCategory: AccommodationAvailabilityCategory;
  matchingRoomTypeCount: number;
  availableRoomTypeCount: number;
  lowestBasePrice: number | null;
  lowestPreviewPrice: number | null;
};

export type RoomTypeAvailability = {
  roomTypeId: number;
  roomTypeName: string;
  baseCapacity: number;
  maxCapacity: number;
  basePrice: number;
  previewPrice: number;
  totalRoomCount: number;
  availableRoomCount: number;
  matchesGuestCount: boolean;
  availabilityCategory: AccommodationAvailabilityCategory;
};

export type AccommodationDetail = {
  accommodationId: number;
  accommodationName: string;
  region: string;
  address: string;
  infoText: string | null;
  checkInTime: string;
  checkOutTime: string;
  availabilityCategory: AccommodationAvailabilityCategory;
  roomTypes: RoomTypeAvailability[];
};

export type RoomTypeCalendarDay = {
  date: string;
  availableRoomCount: number;
  soldOut: boolean;
};

export type RoomTypeCalendar = {
  accommodationId: number;
  roomTypeId: number;
  roomTypeName: string;
  startDate: string;
  endDate: string;
  days: RoomTypeCalendarDay[];
};

export type ReservationSummary = {
  reservationId: number;
  reservationNo: string;
  accommodationId: number;
  accommodationName: string;
  roomTypeId: number;
  roomTypeName: string;
  guestCount: number;
  checkInDate: string;
  checkOutDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  requestedAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
};

export type ReservationDetail = {
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
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
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
    fromStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | null;
    toStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
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

export type ReservationCreateResponse = {
  reservationId: number;
  reservationNo: string;
  accommodationId: number;
  accommodationName: string;
  roomTypeId: number;
  roomTypeName: string;
  guestCount: number;
  checkInDate: string;
  checkOutDate: string;
  status: 'PENDING';
  requestedAt: string;
};

export type ReservationCancellationResponse = {
  reservationId: number;
  reservationNo: string;
  status: 'CANCELLED';
  cancelledAt: string;
};
