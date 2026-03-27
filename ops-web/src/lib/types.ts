export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error: { code: string; message: string } | null;
  timestamp: string;
};

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type StatusFilter = 'ALL' | ReservationStatus;
export type RoomBlockStatus = 'ACTIVE' | 'INACTIVE';
export type RoomBlockReasonType = 'MAINTENANCE' | 'HOST_BLOCK' | 'ADMIN_BLOCK' | 'OTHER';
export type PricePolicyStatus = 'ACTIVE' | 'INACTIVE';
export type HostRoleRequestStatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'DENIED';
export type AccommodationStatus = 'ACTIVE' | 'INACTIVE';
export type RoomTypeStatus = 'ACTIVE' | 'INACTIVE';
export type RoomStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

export type AuthenticatedUser = {
  userId: number;
  loginId: string;
  name: string;
  role: 'HOST' | 'ADMIN';
};

export type ReservationSummary = {
  reservationId: number;
  reservationNo: string;
  guestUserId: number;
  guestLoginId: string;
  guestName: string;
  accommodationId: number;
  accommodationName: string;
  roomTypeId: number;
  roomTypeName: string;
  guestCount: number;
  checkInDate: string;
  checkOutDate: string;
  status: ReservationStatus;
  requestedAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  reassignmentPossible: boolean;
  hasRelevantBlocks: boolean;
  hasRelevantPricing: boolean;
};

export type ReservationDetail = {
  reservationId: number;
  reservationNo: string;
  guest: { guestUserId: number; guestLoginId: string; guestName: string };
  accommodation: { accommodationId: number; accommodationName: string; region: string; address: string };
  roomType: { roomTypeId: number; roomTypeName: string };
  guestCount: number;
  status: ReservationStatus;
  checkInDate: string;
  checkOutDate: string;
  checkInTime: string;
  checkOutTime: string;
  requestedAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  reassignmentPossible: boolean;
  hasRelevantBlocks: boolean;
  hasRelevantPricing: boolean;
  nights: Array<{
    reservationNightId: number;
    stayDate: string;
    assignedRoomId: number;
    assignedRoomCode: string;
    assignedRoomTypeId: number;
    assignedRoomTypeName: string;
    assignedRoomBlocked: boolean;
    assignedRoomTypeOverride: boolean;
    reassignmentAllowed: boolean;
    reassignmentBlockedReason: string | null;
    availableReassignmentRooms: Array<{
      roomId: number;
      roomCode: string;
      roomTypeId: number;
      roomTypeName: string;
    }>;
  }>;
  statusHistory: Array<{
    historyId: number;
    fromStatus: ReservationStatus | null;
    toStatus: ReservationStatus;
    actionType:
      | 'REQUESTED'
      | 'HOST_CONFIRMED'
      | 'HOST_REJECTED'
      | 'GUEST_CANCELLED'
      | 'HOST_CANCELLED'
      | 'ADMIN_CANCELLED';
    changedByUserId: number;
    changedByLoginId: string;
    changedByName: string;
    reasonType: string | null;
    reasonText: string | null;
    changedAt: string;
  }>;
  blockContexts: Array<{
    blockId: number;
    roomId: number;
    roomCode: string;
    roomTypeId: number;
    roomTypeName: string;
    startDate: string;
    endDate: string;
    reasonType: string;
    reasonText: string | null;
  }>;
  pricingPolicies: Array<{
    policyId: number;
    roomTypeId: number;
    roomTypeName: string;
    policyName: string;
    startDate: string;
    endDate: string;
    deltaAmount: number;
    dayOfWeekMask: number | null;
  }>;
};

export type ReservationDecisionResponse = {
  reservationId: number;
  reservationNo: string;
  status: ReservationStatus;
  changedAt: string;
};

export type ReservationReassignmentResponse = {
  reservationId: number;
  reservationNo: string;
  changedNightCount: number;
  changedAt: string;
};

export type ReservationNightSwapResponse = {
  sourceReservationId: number;
  sourceReservationNo: string;
  targetReservationId: number;
  targetReservationNo: string;
  stayDate: string;
  changedAt: string;
};

export type ReservationCalendarView = {
  selectedAccommodationId: number | null;
  startDate: string;
  endDateExclusive: string;
  visibleDates: string[];
  accommodations: Array<{
    accommodationId: number;
    accommodationName: string;
    region: string;
  }>;
  roomTypes: Array<{
    roomTypeId: number;
    roomTypeName: string;
    rooms: Array<{
      roomId: number;
      roomCode: string;
    }>;
  }>;
  reservations: Array<{
    reservationId: number;
    reservationNo: string;
    guestLoginId: string;
    guestName: string;
    guestCount: number;
    roomTypeId: number;
    roomTypeName: string;
    status: ReservationStatus;
    checkInDate: string;
    checkOutDate: string;
    requestedAt: string | null;
    reassignmentPossible: boolean;
  }>;
  assignmentCells: Array<{
    reservationId: number;
    reservationNightId: number;
    stayDate: string;
    assignedRoomId: number;
    assignedRoomCode: string;
    assignedRoomTypeId: number;
    assignedRoomTypeName: string;
    reassignmentAllowed: boolean;
  }>;
  blockCells: Array<{
    blockId: number;
    roomId: number;
    stayDate: string;
    reasonType: string;
    reasonText: string | null;
  }>;
};

export type RoomBlockManagement = {
  selectedAccommodationId: number | null;
  selectedRoomId: number | null;
  accommodations: Array<{
    accommodationId: number;
    accommodationName: string;
    region: string;
  }>;
  rooms: Array<{
    roomId: number;
    accommodationId: number;
    roomTypeId: number;
    roomTypeName: string;
    roomCode: string;
  }>;
  blocks: Array<{
    blockId: number;
    accommodationId: number;
    accommodationName: string;
    roomId: number;
    roomCode: string;
    roomTypeId: number;
    roomTypeName: string;
    startDate: string;
    endDate: string;
    reasonType: string;
    reasonText: string | null;
    status: RoomBlockStatus;
    createdByUserId: number;
    createdByLoginId: string;
    createdByName: string;
    createdAt: string;
  }>;
};

export type RoomBlockMutationResponse = {
  blockId: number;
  accommodationId: number;
  accommodationName: string;
  roomId: number;
  roomCode: string;
  status: RoomBlockStatus;
  reasonType: string;
  reasonText: string | null;
  startDate: string;
  endDate: string;
  changedAt: string;
};

export type PricePolicyManagement = {
  selectedAccommodationId: number | null;
  selectedRoomTypeId: number | null;
  accommodations: Array<{
    accommodationId: number;
    accommodationName: string;
    region: string;
  }>;
  roomTypes: Array<{
    roomTypeId: number;
    accommodationId: number;
    roomTypeName: string;
    basePrice: number;
  }>;
  policies: Array<{
    policyId: number;
    accommodationId: number;
    accommodationName: string;
    roomTypeId: number;
    roomTypeName: string;
    policyName: string;
    startDate: string;
    endDate: string;
    deltaAmount: number;
    dayOfWeekMask: number | null;
    status: PricePolicyStatus;
    createdAt: string;
  }>;
};

export type PricePolicyMutationResponse = {
  policyId: number;
  accommodationId: number;
  accommodationName: string;
  roomTypeId: number;
  roomTypeName: string;
  policyName: string;
  startDate: string;
  endDate: string;
  deltaAmount: number;
  dayOfWeekMask: number | null;
  status: PricePolicyStatus;
  changedAt: string;
};

export type AccommodationSummary = {
  accommodationId: number;
  name: string;
  region: string;
  address: string;
  status: AccommodationStatus;
  roomTypeCount: number;
  roomCount: number;
  activeRoomCount: number;
  pendingReservationCount: number;
};

export type AccommodationDetail = {
  accommodationId: number;
  name: string;
  region: string;
  address: string;
  infoText: string | null;
  checkInTime: string;
  checkOutTime: string;
  status: AccommodationStatus;
  roomTypeCount: number;
  roomCount: number;
  activeRoomCount: number;
  pendingReservationCount: number;
  activeBlockCount: number;
  activePricePolicyCount: number;
  roomTypes: Array<{
    roomTypeId: number;
    accommodationId: number;
    name: string;
    baseCapacity: number;
    maxCapacity: number;
    basePrice: number;
    status: RoomTypeStatus;
    roomCount: number;
    activeRoomCount: number;
  }>;
  rooms: Array<{
    roomId: number;
    accommodationId: number;
    roomTypeId: number;
    roomTypeName: string;
    roomCode: string;
    status: RoomStatus;
    memo: string | null;
    hasFutureAssignments: boolean;
  }>;
};

export type AssetMutationResponse = {
  assetId: number;
  assetName: string;
  status: string;
  changedAt: string;
};

export type AdminUserSummary = {
  userId: number;
  loginId: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: 'GUEST' | 'HOST' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  failedLoginCount: number;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  latestHostRoleRequestStatus: 'PENDING' | 'APPROVED' | 'DENIED' | null;
};

export type AdminUserDetail = {
  userId: number;
  loginId: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: 'GUEST' | 'HOST' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
  failedLoginCount: number;
  lastFailedAt: string | null;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
};

export type AdminHostRoleRequest = {
  requestId: number;
  userId: number;
  userLoginId: string;
  userName: string;
  userEmail: string | null;
  userPhone: string | null;
  userRole: 'GUEST' | 'HOST' | 'ADMIN';
  userStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  requestReason: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  reviewedByUserId: number | null;
  reviewedByLoginId: string | null;
  reviewedByName: string | null;
  reviewReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

export type AdminHostRoleRequestDecisionResponse = {
  requestId: number;
  userId: number;
  status: 'APPROVED' | 'DENIED';
  userRole: 'GUEST' | 'HOST' | 'ADMIN';
  reviewReason: string | null;
  reviewedAt: string;
};

export type AdminTermStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type AdminTermCategory = 'SERVICE' | 'PRIVACY' | 'MARKETING';

export type AdminTermSummary = {
  termId: number;
  category: AdminTermCategory;
  title: string;
  version: string;
  required: boolean;
  status: AdminTermStatus;
  effectiveAt: string;
  updatedAt: string;
};

export type AdminTermDetail = {
  termId: number;
  category: AdminTermCategory;
  title: string;
  content: string;
  version: string;
  required: boolean;
  status: AdminTermStatus;
  effectiveAt: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminTermMutationResponse = {
  termId: number;
  category: AdminTermCategory;
  title: string;
  content: string;
  version: string;
  required: boolean;
  status: AdminTermStatus;
  effectiveAt: string;
  changedAt: string;
};

export type BannerState = { tone: 'success' | 'error' | 'info'; text: string } | null;

export type HostLivePageKey =
  | 'reservation-calendar'
  | 'reservations'
  | 'reservation-detail'
  | 'properties'
  | 'room-blocks'
  | 'pricing'
  | 'dashboard';

export type HostPageKey = HostLivePageKey;

export type AdminLivePageKey =
  | 'dashboard'
  | 'reservations'
  | 'reservation-detail'
  | 'room-blocks'
  | 'pricing'
  | 'users'
  | 'role-requests'
  | 'terms';

export type AdminPageKey = AdminLivePageKey;

export type OpsPageKey = HostPageKey | AdminPageKey;

export type OpsNavItem = {
  key: OpsPageKey;
  label: string;
  preview?: boolean;
};
