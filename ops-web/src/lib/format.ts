import type {
  AccommodationDetail,
  AccommodationSummary,
  AssetMutationResponse,
  AuthenticatedUser,
  AdminTermCategory,
  AdminTermStatus,
  HostRoleRequestStatusFilter,
  ReservationDetail,
  ReservationSummary,
  RoomBlockReasonType,
  StatusFilter
} from './types';

export const statusFilters: StatusFilter[] = ['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED'];
export const hostRoleRequestStatusFilters: HostRoleRequestStatusFilter[] = ['PENDING', 'APPROVED', 'DENIED', 'ALL'];
export const pricingWeekdayOptions = [
  { label: 'Mon', bit: 1 },
  { label: 'Tue', bit: 2 },
  { label: 'Wed', bit: 4 },
  { label: 'Thu', bit: 8 },
  { label: 'Fri', bit: 16 },
  { label: 'Sat', bit: 32 },
  { label: 'Sun', bit: 64 }
];

export function formatTimestamp(value: string | null) {
  return value ? new Date(value).toLocaleString('ko-KR') : 'Not yet';
}

export function formatStatusFilter(filter: StatusFilter) {
  return filter === 'ALL' ? 'All' : filter;
}

export function formatReservationAction(actionType: ReservationDetail['statusHistory'][number]['actionType']) {
  switch (actionType) {
    case 'REQUESTED':
      return 'Requested';
    case 'HOST_CONFIRMED':
      return 'Host confirmed';
    case 'HOST_REJECTED':
      return 'Host rejected';
    case 'GUEST_CANCELLED':
      return 'Guest cancelled';
    case 'HOST_CANCELLED':
      return 'Host cancelled';
    case 'ADMIN_CANCELLED':
      return 'Admin cancelled';
  }
}

export function formatBlockReasonType(reasonType: string) {
  switch (reasonType) {
    case 'MAINTENANCE':
      return 'Maintenance';
    case 'HOST_BLOCK':
      return 'Host block';
    case 'ADMIN_BLOCK':
      return 'Admin block';
    case 'OTHER':
      return 'Other';
    default:
      return reasonType;
  }
}

export function blockReasonOptions(role: AuthenticatedUser['role'] | undefined): Array<{
  value: RoomBlockReasonType;
  label: string;
}> {
  if (role === 'ADMIN') {
    return [
      { value: 'MAINTENANCE', label: 'Maintenance' },
      { value: 'ADMIN_BLOCK', label: 'Admin block' },
      { value: 'OTHER', label: 'Other' }
    ];
  }

  return [
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'HOST_BLOCK', label: 'Host block' },
    { value: 'OTHER', label: 'Other' }
  ];
}

export function reservationDetailToSummary(reservationDetail: ReservationDetail): ReservationSummary {
  return {
    reservationId: reservationDetail.reservationId,
    reservationNo: reservationDetail.reservationNo,
    guestUserId: reservationDetail.guest.guestUserId,
    guestLoginId: reservationDetail.guest.guestLoginId,
    guestName: reservationDetail.guest.guestName,
    accommodationId: reservationDetail.accommodation.accommodationId,
    accommodationName: reservationDetail.accommodation.accommodationName,
    roomTypeId: reservationDetail.roomType.roomTypeId,
    roomTypeName: reservationDetail.roomType.roomTypeName,
    guestCount: reservationDetail.guestCount,
    checkInDate: reservationDetail.checkInDate,
    checkOutDate: reservationDetail.checkOutDate,
    status: reservationDetail.status,
    requestedAt: reservationDetail.requestedAt,
    confirmedAt: reservationDetail.confirmedAt,
    cancelledAt: reservationDetail.cancelledAt,
    reassignmentPossible: reservationDetail.reassignmentPossible,
    hasRelevantBlocks: reservationDetail.hasRelevantBlocks,
    hasRelevantPricing: reservationDetail.hasRelevantPricing
  };
}

export function buildRoomBlocksEndpoint(accommodationId: number | null, roomId: number | null) {
  const params = new URLSearchParams();

  if (accommodationId !== null) {
    params.set('accommodationId', String(accommodationId));
  }

  if (roomId !== null) {
    params.set('roomId', String(roomId));
  }

  const query = params.toString();
  return query ? `/api/v1/room-blocks?${query}` : '/api/v1/room-blocks';
}

export function buildPricePoliciesEndpoint(accommodationId: number | null, roomTypeId: number | null) {
  const params = new URLSearchParams();

  if (accommodationId !== null) {
    params.set('accommodationId', String(accommodationId));
  }

  if (roomTypeId !== null) {
    params.set('roomTypeId', String(roomTypeId));
  }

  const query = params.toString();
  return query ? `/api/v1/price-policies?${query}` : '/api/v1/price-policies';
}

export function buildReservationCalendarEndpoint(accommodationId: number | null, startDate: string, days = 365) {
  const params = new URLSearchParams();

  if (accommodationId !== null) {
    params.set('accommodationId', String(accommodationId));
  }

  params.set('startDate', startDate);
  params.set('days', String(days));

  return `/api/v1/reservations/calendar?${params.toString()}`;
}

export function formatPriceDelta(deltaAmount: number) {
  const sign = deltaAmount >= 0 ? '+' : '-';
  return `${sign}${Math.abs(deltaAmount).toLocaleString('ko-KR')} KRW`;
}

export function formatPricingDayMask(dayOfWeekMask: number | null) {
  if (dayOfWeekMask === null) {
    return 'All days';
  }

  const labels = pricingWeekdayOptions
    .filter((option) => (dayOfWeekMask & option.bit) !== 0)
    .map((option) => option.label);

  return labels.length === 0 ? 'No active days' : labels.join(', ');
}

export function buildDayOfWeekMask(selectedBits: number[]) {
  if (selectedBits.length === 0) {
    return null;
  }

  return selectedBits.reduce((total, bit) => total + bit, 0);
}

export function formatHostRoleRequestStatusFilter(filter: HostRoleRequestStatusFilter) {
  return filter === 'ALL' ? 'All' : filter;
}

export function formatTermCategory(category: AdminTermCategory) {
  switch (category) {
    case 'SERVICE':
      return 'Service';
    case 'PRIVACY':
      return 'Privacy';
    case 'MARKETING':
      return 'Marketing';
  }
}

export function formatTermStatus(status: AdminTermStatus) {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'PUBLISHED':
      return 'Published';
    case 'ARCHIVED':
      return 'Archived';
  }
}

export function buildAdminHostRoleRequestsEndpoint(filter: HostRoleRequestStatusFilter) {
  if (filter === 'ALL') {
    return '/api/v1/admin/host-role-requests';
  }

  return `/api/v1/admin/host-role-requests?status=${filter}`;
}

export function buildHostAccommodationDetailEndpoint(accommodationId: number) {
  return `/api/v1/host/accommodations/${accommodationId}`;
}

export function formatAssetStatus(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'Active';
    case 'INACTIVE':
      return 'Inactive';
    case 'MAINTENANCE':
      return 'Maintenance';
    default:
      return status;
  }
}

export function summarizeAccommodation(detail: AccommodationDetail | AccommodationSummary | null) {
  if (!detail) {
    return null;
  }

  return `${detail.name} / ${detail.region}`;
}

export function describeAssetMutation(response: AssetMutationResponse, subject: string) {
  return `${subject} ${response.assetName} saved as ${response.status}.`;
}
