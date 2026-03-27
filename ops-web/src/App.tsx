import { FormEvent, useEffect, useState } from 'react';

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error: { code: string; message: string } | null;
  timestamp: string;
};

type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
type StatusFilter = 'ALL' | ReservationStatus;
type RoomBlockStatus = 'ACTIVE' | 'INACTIVE';
type RoomBlockReasonType = 'MAINTENANCE' | 'HOST_BLOCK' | 'ADMIN_BLOCK' | 'OTHER';
type PricePolicyStatus = 'ACTIVE' | 'INACTIVE';

type AuthenticatedUser = {
  userId: number;
  loginId: string;
  name: string;
  role: 'HOST' | 'ADMIN';
};

type ReservationSummary = {
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

type ReservationDetail = {
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

type ReservationDecisionResponse = {
  reservationId: number;
  reservationNo: string;
  status: ReservationStatus;
  changedAt: string;
};

type ReservationReassignmentResponse = {
  reservationId: number;
  reservationNo: string;
  changedNightCount: number;
  changedAt: string;
};

type RoomBlockManagement = {
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

type RoomBlockMutationResponse = {
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

type PricePolicyManagement = {
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

type PricePolicyMutationResponse = {
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

type AdminUserSummary = {
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

type AdminUserDetail = {
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

type HostRoleRequestStatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'DENIED';

type AdminHostRoleRequest = {
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

type AdminHostRoleRequestDecisionResponse = {
  requestId: number;
  userId: number;
  status: 'APPROVED' | 'DENIED';
  userRole: 'GUEST' | 'HOST' | 'ADMIN';
  reviewReason: string | null;
  reviewedAt: string;
};

type BannerState = { tone: 'success' | 'error' | 'info'; text: string } | null;

const statusFilters: StatusFilter[] = ['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED'];
const hostRoleRequestStatusFilters: HostRoleRequestStatusFilter[] = ['PENDING', 'APPROVED', 'DENIED', 'ALL'];
const pricingWeekdayOptions = [
  { label: 'Mon', bit: 1 },
  { label: 'Tue', bit: 2 },
  { label: 'Wed', bit: 4 },
  { label: 'Thu', bit: 8 },
  { label: 'Fri', bit: 16 },
  { label: 'Sat', bit: 32 },
  { label: 'Sun', bit: 64 }
];

const OPS_CSRF_COOKIE_NAME = 'OPS_API_CSRF';
const CSRF_FAILURE_MESSAGE = 'CSRF token validation failed.';

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

async function refreshOpsCsrfCookie() {
  await fetch('/api/v1/auth/me', {
    method: 'GET',
    credentials: 'include'
  });
}

async function apiRequest<T>(input: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (typeof document !== 'undefined') {
    const csrfCookie = document.cookie
      .split(';')
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith(`${OPS_CSRF_COOKIE_NAME}=`));

    if (csrfCookie) {
      const separatorIndex = csrfCookie.indexOf('=');
      const csrfToken = separatorIndex >= 0 ? decodeURIComponent(csrfCookie.slice(separatorIndex + 1)) : null;
      const method = (init?.method ?? 'GET').toUpperCase();
      if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        headers.set('X-CSRF-Token', csrfToken);
      }
    }
  }

  let response = await fetch(input, {
    ...init,
    credentials: 'include',
    headers
  });

  let envelope = await readEnvelope<T>(response);
  if (isCsrfFailure(response, envelope, init)) {
    await refreshOpsCsrfCookie();
    response = await fetch(input, {
      ...init,
      credentials: 'include',
      headers: (() => {
        const retryHeaders = new Headers(init?.headers ?? {});
        if (!retryHeaders.has('Content-Type')) {
          retryHeaders.set('Content-Type', 'application/json');
        }

        if (typeof document !== 'undefined') {
          const csrfCookie = document.cookie
            .split(';')
            .map((entry) => entry.trim())
            .find((entry) => entry.startsWith(`${OPS_CSRF_COOKIE_NAME}=`));

          if (csrfCookie) {
            const separatorIndex = csrfCookie.indexOf('=');
            const csrfToken = separatorIndex >= 0 ? decodeURIComponent(csrfCookie.slice(separatorIndex + 1)) : null;
            const method = (init?.method ?? 'GET').toUpperCase();
            if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
              retryHeaders.set('X-CSRF-Token', csrfToken);
            }
          }
        }

        return retryHeaders;
      })()
    });
    envelope = await readEnvelope<T>(response);
  }
  if (!response.ok || !envelope?.success) {
    const errorMessage = envelope?.error?.message ?? 'Request failed.';
    const errorCode = envelope?.error?.code ?? 'UNKNOWN';
    const error = new Error(errorMessage) as Error & { status?: number; code?: string };
    error.status = response.status;
    error.code = errorCode;
    throw error;
  }
  return envelope.data;
}

function formatTimestamp(value: string | null) {
  return value ? new Date(value).toLocaleString('ko-KR') : 'Not yet';
}

function formatStatusFilter(filter: StatusFilter) {
  return filter === 'ALL' ? 'All' : filter;
}

function formatReservationAction(actionType: ReservationDetail['statusHistory'][number]['actionType']) {
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

function formatBlockReasonType(reasonType: string) {
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

function blockReasonOptions(role: AuthenticatedUser['role'] | undefined): Array<{
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

function reservationDetailToSummary(reservationDetail: ReservationDetail): ReservationSummary {
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

function buildRoomBlocksEndpoint(accommodationId: number | null, roomId: number | null) {
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

function buildPricePoliciesEndpoint(accommodationId: number | null, roomTypeId: number | null) {
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

function formatPriceDelta(deltaAmount: number) {
  const sign = deltaAmount >= 0 ? '+' : '-';
  return `${sign}${Math.abs(deltaAmount).toLocaleString('ko-KR')} KRW`;
}

function formatPricingDayMask(dayOfWeekMask: number | null) {
  if (dayOfWeekMask === null) {
    return 'All days';
  }
  const labels = pricingWeekdayOptions
    .filter((option) => (dayOfWeekMask & option.bit) !== 0)
    .map((option) => option.label);
  return labels.length === 0 ? 'No active days' : labels.join(', ');
}

function buildDayOfWeekMask(selectedBits: number[]) {
  if (selectedBits.length === 0) {
    return null;
  }
  return selectedBits.reduce((total, bit) => total + bit, 0);
}

function formatHostRoleRequestStatusFilter(filter: HostRoleRequestStatusFilter) {
  return filter === 'ALL' ? 'All' : filter;
}

function buildAdminHostRoleRequestsEndpoint(filter: HostRoleRequestStatusFilter) {
  if (filter === 'ALL') {
    return '/api/v1/admin/host-role-requests';
  }
  return `/api/v1/admin/host-role-requests?status=${filter}`;
}

function App() {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [reservations, setReservations] = useState<ReservationSummary[]>([]);
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null);
  const [reservationDetail, setReservationDetail] = useState<ReservationDetail | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');
  const [banner, setBanner] = useState<BannerState>(null);
  const [loginId, setLoginId] = useState('host.demo');
  const [password, setPassword] = useState('hostpass123!');
  const [initializing, setInitializing] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [decisioningReservationId, setDecisioningReservationId] = useState<number | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<number, string>>({});
  const [reassignmentSelections, setReassignmentSelections] = useState<Record<number, string>>({});
  const [reassigningNightId, setReassigningNightId] = useState<number | null>(null);
  const [roomBlockManagement, setRoomBlockManagement] = useState<RoomBlockManagement | null>(null);
  const [loadingRoomBlocks, setLoadingRoomBlocks] = useState(false);
  const [creatingRoomBlock, setCreatingRoomBlock] = useState(false);
  const [deactivatingBlockId, setDeactivatingBlockId] = useState<number | null>(null);
  const [blockAccommodationId, setBlockAccommodationId] = useState('');
  const [blockRoomFilterId, setBlockRoomFilterId] = useState('ALL');
  const [newBlockRoomId, setNewBlockRoomId] = useState('');
  const [newBlockStartDate, setNewBlockStartDate] = useState('');
  const [newBlockEndDate, setNewBlockEndDate] = useState('');
  const [newBlockReasonType, setNewBlockReasonType] = useState<RoomBlockReasonType>('HOST_BLOCK');
  const [newBlockReasonText, setNewBlockReasonText] = useState('');
  const [pricePolicyManagement, setPricePolicyManagement] = useState<PricePolicyManagement | null>(null);
  const [loadingPricePolicies, setLoadingPricePolicies] = useState(false);
  const [creatingPricePolicy, setCreatingPricePolicy] = useState(false);
  const [deactivatingPolicyId, setDeactivatingPolicyId] = useState<number | null>(null);
  const [pricingAccommodationId, setPricingAccommodationId] = useState('');
  const [pricingRoomTypeFilterId, setPricingRoomTypeFilterId] = useState('ALL');
  const [newPolicyRoomTypeId, setNewPolicyRoomTypeId] = useState('');
  const [newPolicyName, setNewPolicyName] = useState('');
  const [newPolicyStartDate, setNewPolicyStartDate] = useState('');
  const [newPolicyEndDate, setNewPolicyEndDate] = useState('');
  const [newPolicyDeltaAmount, setNewPolicyDeltaAmount] = useState('');
  const [newPolicyDayBits, setNewPolicyDayBits] = useState<number[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserSummary[]>([]);
  const [selectedAdminUserId, setSelectedAdminUserId] = useState<number | null>(null);
  const [adminUserDetail, setAdminUserDetail] = useState<AdminUserDetail | null>(null);
  const [loadingAdminUsers, setLoadingAdminUsers] = useState(false);
  const [loadingAdminUserDetail, setLoadingAdminUserDetail] = useState(false);
  const [hostRoleRequestFilter, setHostRoleRequestFilter] = useState<HostRoleRequestStatusFilter>('PENDING');
  const [adminHostRoleRequests, setAdminHostRoleRequests] = useState<AdminHostRoleRequest[]>([]);
  const [selectedHostRoleRequestId, setSelectedHostRoleRequestId] = useState<number | null>(null);
  const [hostRoleRequestDetail, setHostRoleRequestDetail] = useState<AdminHostRoleRequest | null>(null);
  const [loadingHostRoleRequests, setLoadingHostRoleRequests] = useState(false);
  const [loadingHostRoleRequestDetail, setLoadingHostRoleRequestDetail] = useState(false);
  const [reviewingHostRoleRequestId, setReviewingHostRoleRequestId] = useState<number | null>(null);
  const [adminReviewReason, setAdminReviewReason] = useState('');

  useEffect(() => {
    void bootstrapSession();
  }, []);

  async function bootstrapSession() {
    setInitializing(true);
    try {
      const currentUser = await apiRequest<AuthenticatedUser>('/api/v1/auth/me', { method: 'GET' });
      setUser(currentUser);
      await loadReservations(false, statusFilter);
      await loadRoomBlocks(false, null, null, currentUser);
      await loadPricePolicies(false, null, null);
      if (currentUser.role === 'ADMIN') {
        await Promise.all([loadAdminUsers(false), loadHostRoleRequests(false, hostRoleRequestFilter)]);
      }
    } catch (error) {
      const apiError = error as Error & { status?: number };
      if (apiError.status !== 401) {
        setBanner({ tone: 'error', text: apiError.message });
      }
      resetOpsState();
    } finally {
      setInitializing(false);
    }
  }

  function resetOpsState() {
    setUser(null);
    setReservations([]);
    setSelectedReservationId(null);
    setReservationDetail(null);
    setRejectReasons({});
    setReassignmentSelections({});
    setDecisioningReservationId(null);
    setReassigningNightId(null);
    setRoomBlockManagement(null);
    setBlockAccommodationId('');
    setBlockRoomFilterId('ALL');
    setNewBlockRoomId('');
    setNewBlockStartDate('');
    setNewBlockEndDate('');
    setNewBlockReasonType('HOST_BLOCK');
    setNewBlockReasonText('');
    setCreatingRoomBlock(false);
    setDeactivatingBlockId(null);
    setPricePolicyManagement(null);
    setLoadingPricePolicies(false);
    setCreatingPricePolicy(false);
    setDeactivatingPolicyId(null);
    setPricingAccommodationId('');
    setPricingRoomTypeFilterId('ALL');
    setNewPolicyRoomTypeId('');
    setNewPolicyName('');
    setNewPolicyStartDate('');
    setNewPolicyEndDate('');
    setNewPolicyDeltaAmount('');
    setNewPolicyDayBits([]);
    setAdminUsers([]);
    setSelectedAdminUserId(null);
    setAdminUserDetail(null);
    setLoadingAdminUsers(false);
    setLoadingAdminUserDetail(false);
    setHostRoleRequestFilter('PENDING');
    setAdminHostRoleRequests([]);
    setSelectedHostRoleRequestId(null);
    setHostRoleRequestDetail(null);
    setLoadingHostRoleRequests(false);
    setLoadingHostRoleRequestDetail(false);
    setReviewingHostRoleRequestId(null);
    setAdminReviewReason('');
  }

  function reservationsEndpoint(filter: StatusFilter) {
    return filter === 'ALL' ? '/api/v1/reservations' : `/api/v1/reservations?status=${filter}`;
  }

  async function loadReservations(showBanner = true, filter = statusFilter) {
    setRefreshing(true);
    try {
      const data = await apiRequest<ReservationSummary[]>(reservationsEndpoint(filter), { method: 'GET' });
      setReservations(data);
      if (showBanner) {
        setBanner({ tone: 'info', text: `${formatStatusFilter(filter)} reservations refreshed.` });
      }
    } finally {
      setRefreshing(false);
    }
  }

  async function loadReservationDetail(reservationId: number, showBanner = false) {
    setLoadingDetail(true);
    try {
      const data = await apiRequest<ReservationDetail>(`/api/v1/reservations/${reservationId}`, { method: 'GET' });
      setSelectedReservationId(reservationId);
      setReservationDetail(data);
      setReassignmentSelections((current) => {
        const next = { ...current };
        for (const night of data.nights) {
          if (!next[night.reservationNightId] && night.availableReassignmentRooms[0]) {
            next[night.reservationNightId] = String(night.availableReassignmentRooms[0].roomId);
          }
        }
        return next;
      });
      if (showBanner) {
        setBanner({ tone: 'info', text: `Reservation ${data.reservationNo} refreshed.` });
      }
    } finally {
      setLoadingDetail(false);
    }
  }

  async function loadRoomBlocks(
    showBanner = true,
    accommodationId: number | null = null,
    roomId: number | null = null,
    viewer: AuthenticatedUser | null = user
  ) {
    setLoadingRoomBlocks(true);
    try {
      const data = await apiRequest<RoomBlockManagement>(buildRoomBlocksEndpoint(accommodationId, roomId), {
        method: 'GET'
      });
      setRoomBlockManagement(data);
      setBlockAccommodationId(data.selectedAccommodationId === null ? '' : String(data.selectedAccommodationId));
      setBlockRoomFilterId(data.selectedRoomId === null ? 'ALL' : String(data.selectedRoomId));
      setNewBlockRoomId((current) => {
        if (current && data.rooms.some((room) => String(room.roomId) === current)) {
          return current;
        }
        return data.rooms[0] ? String(data.rooms[0].roomId) : '';
      });
      const allowedReasonTypes = blockReasonOptions(viewer?.role);
      setNewBlockReasonType((current) => {
        if (allowedReasonTypes.some((option) => option.value === current)) {
          return current;
        }
        return allowedReasonTypes[0]?.value ?? 'OTHER';
      });
      if (showBanner) {
        setBanner({ tone: 'info', text: 'Room blocks refreshed.' });
      }
    } finally {
      setLoadingRoomBlocks(false);
    }
  }

  async function loadPricePolicies(
    showBanner = true,
    accommodationId: number | null = null,
    roomTypeId: number | null = null
  ) {
    setLoadingPricePolicies(true);
    try {
      const data = await apiRequest<PricePolicyManagement>(buildPricePoliciesEndpoint(accommodationId, roomTypeId), {
        method: 'GET'
      });
      setPricePolicyManagement(data);
      setPricingAccommodationId(data.selectedAccommodationId === null ? '' : String(data.selectedAccommodationId));
      setPricingRoomTypeFilterId(data.selectedRoomTypeId === null ? 'ALL' : String(data.selectedRoomTypeId));
      setNewPolicyRoomTypeId((current) => {
        if (current && data.roomTypes.some((roomType) => String(roomType.roomTypeId) === current)) {
          return current;
        }
        return data.roomTypes[0] ? String(data.roomTypes[0].roomTypeId) : '';
      });
      if (showBanner) {
        setBanner({ tone: 'info', text: 'Price policies refreshed.' });
      }
    } finally {
      setLoadingPricePolicies(false);
    }
  }

  async function loadAdminUsers(showBanner = true) {
    setLoadingAdminUsers(true);
    try {
      const data = await apiRequest<AdminUserSummary[]>('/api/v1/admin/users', { method: 'GET' });
      setAdminUsers(data);
      const nextSelectedUserId =
        selectedAdminUserId !== null && data.some((item) => item.userId === selectedAdminUserId)
          ? selectedAdminUserId
          : data[0]?.userId ?? null;
      if (nextSelectedUserId !== null) {
        await loadAdminUserDetail(nextSelectedUserId, false);
      } else {
        setSelectedAdminUserId(null);
        setAdminUserDetail(null);
      }
      if (showBanner) {
        setBanner({ tone: 'info', text: 'Admin users refreshed.' });
      }
    } finally {
      setLoadingAdminUsers(false);
    }
  }

  async function loadAdminUserDetail(userId: number, showBanner = false) {
    setLoadingAdminUserDetail(true);
    try {
      const data = await apiRequest<AdminUserDetail>(`/api/v1/admin/users/${userId}`, { method: 'GET' });
      setSelectedAdminUserId(userId);
      setAdminUserDetail(data);
      if (showBanner) {
        setBanner({ tone: 'info', text: `User ${data.loginId} refreshed.` });
      }
    } finally {
      setLoadingAdminUserDetail(false);
    }
  }

  async function loadHostRoleRequests(showBanner = true, filter = hostRoleRequestFilter) {
    setLoadingHostRoleRequests(true);
    try {
      const data = await apiRequest<AdminHostRoleRequest[]>(buildAdminHostRoleRequestsEndpoint(filter), {
        method: 'GET'
      });
      setAdminHostRoleRequests(data);
      const nextSelectedRequestId =
        selectedHostRoleRequestId !== null && data.some((item) => item.requestId === selectedHostRoleRequestId)
          ? selectedHostRoleRequestId
          : data[0]?.requestId ?? null;
      if (nextSelectedRequestId !== null) {
        await loadHostRoleRequestDetail(nextSelectedRequestId, false);
      } else {
        setSelectedHostRoleRequestId(null);
        setHostRoleRequestDetail(null);
      }
      if (showBanner) {
        setBanner({ tone: 'info', text: `${formatHostRoleRequestStatusFilter(filter)} host role requests refreshed.` });
      }
    } finally {
      setLoadingHostRoleRequests(false);
    }
  }

  async function loadHostRoleRequestDetail(requestId: number, showBanner = false) {
    setLoadingHostRoleRequestDetail(true);
    try {
      const data = await apiRequest<AdminHostRoleRequest>(`/api/v1/admin/host-role-requests/${requestId}`, {
        method: 'GET'
      });
      setSelectedHostRoleRequestId(requestId);
      setHostRoleRequestDetail(data);
      if (showBanner) {
        setBanner({ tone: 'info', text: `Host role request ${requestId} refreshed.` });
      }
    } finally {
      setLoadingHostRoleRequestDetail(false);
    }
  }

  async function refreshListAndDetail(reservationId: number | null = selectedReservationId, filter = statusFilter) {
    await loadReservations(false, filter);
    if (reservationId !== null) {
      await loadReservationDetail(reservationId, false);
    }
  }

  async function refreshRoomBlocksAndDetail() {
    const selectedAccommodation =
      blockAccommodationId === '' ? roomBlockManagement?.selectedAccommodationId ?? null : Number(blockAccommodationId);
    const selectedRoom = blockRoomFilterId === 'ALL' ? null : Number(blockRoomFilterId);
    await loadRoomBlocks(false, selectedAccommodation, selectedRoom);
    if (selectedReservationId !== null) {
      await loadReservationDetail(selectedReservationId, false);
    }
  }

  async function refreshPricePoliciesAndDetail() {
    const selectedAccommodation =
      pricingAccommodationId === ''
        ? pricePolicyManagement?.selectedAccommodationId ?? null
        : Number(pricingAccommodationId);
    const selectedRoomType = pricingRoomTypeFilterId === 'ALL' ? null : Number(pricingRoomTypeFilterId);
    await loadPricePolicies(false, selectedAccommodation, selectedRoomType);
    if (selectedReservationId !== null) {
      await loadReservationDetail(selectedReservationId, false);
    }
  }

  async function refreshAdminContext(
    nextRequestId: number | null = selectedHostRoleRequestId,
    nextUserId: number | null = selectedAdminUserId,
    filter = hostRoleRequestFilter
  ) {
    await loadAdminUsers(false);
    if (nextUserId !== null) {
      await loadAdminUserDetail(nextUserId, false);
    }
    await loadHostRoleRequests(false, filter);
    if (nextRequestId !== null) {
      await loadHostRoleRequestDetail(nextRequestId, false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoggingIn(true);
    try {
      const loggedInUser = await apiRequest<AuthenticatedUser>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ loginId, password })
      });
      setUser(loggedInUser);
      await loadReservations(false, statusFilter);
      await loadRoomBlocks(false, null, null, loggedInUser);
      await loadPricePolicies(false, null, null);
      if (loggedInUser.role === 'ADMIN') {
        await Promise.all([loadAdminUsers(false), loadHostRoleRequests(false, hostRoleRequestFilter)]);
      }
      setBanner({ tone: 'success', text: `Signed in as ${loggedInUser.loginId}.` });
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    try {
      await apiRequest('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      // Session invalidation is best-effort only.
    }
    resetOpsState();
    setBanner({ tone: 'info', text: 'Signed out.' });
  }

  async function handleHostRoleRequestFilterChange(filter: HostRoleRequestStatusFilter) {
    setHostRoleRequestFilter(filter);
    try {
      await loadHostRoleRequests(true, filter);
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    }
  }

  async function handleFilterChange(filter: StatusFilter) {
    setStatusFilter(filter);
    try {
      await loadReservations(false, filter);
      setBanner({ tone: 'info', text: `${formatStatusFilter(filter)} filter applied.` });
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    }
  }

  async function handleOpenDetail(reservationId: number, showBanner = true) {
    try {
      await loadReservationDetail(reservationId, showBanner);
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    }
  }

  async function handleApprove(reservation: ReservationSummary) {
    setDecisioningReservationId(reservation.reservationId);
    try {
      const decision = await apiRequest<ReservationDecisionResponse>(
        `/api/v1/reservations/${reservation.reservationId}/approve`,
        { method: 'POST' }
      );
      await refreshListAndDetail(reservation.reservationId);
      setBanner({
        tone: 'success',
        text: `Reservation ${decision.reservationNo} moved to ${decision.status}.`
      });
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    } finally {
      setDecisioningReservationId(null);
    }
  }

  async function handleReject(reservation: ReservationSummary) {
    setDecisioningReservationId(reservation.reservationId);
    try {
      const decision = await apiRequest<ReservationDecisionResponse>(
        `/api/v1/reservations/${reservation.reservationId}/reject`,
        {
          method: 'POST',
          body: JSON.stringify({ reasonText: rejectReasons[reservation.reservationId]?.trim() || null })
        }
      );
      setRejectReasons((current) => ({ ...current, [reservation.reservationId]: '' }));
      await refreshListAndDetail(reservation.reservationId);
      setBanner({
        tone: 'success',
        text: `Reservation ${decision.reservationNo} moved to ${decision.status}.`
      });
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    } finally {
      setDecisioningReservationId(null);
    }
  }

  async function handleReassignNight(night: ReservationDetail['nights'][number]) {
    const selectedRoomId = Number(reassignmentSelections[night.reservationNightId]);
    if (!selectedRoomId || !reservationDetail) {
      setBanner({ tone: 'error', text: 'Choose a replacement room first.' });
      return;
    }

    setReassigningNightId(night.reservationNightId);
    try {
      const result = await apiRequest<ReservationReassignmentResponse>(
        `/api/v1/reservations/${reservationDetail.reservationId}/reassign`,
        {
          method: 'POST',
          body: JSON.stringify({
            changes: [{ reservationNightId: night.reservationNightId, assignedRoomId: selectedRoomId }]
          })
        }
      );
      await refreshListAndDetail(reservationDetail.reservationId);
      setBanner({
        tone: 'success',
        text: `Reservation ${result.reservationNo} reassigned for ${result.changedNightCount} night(s).`
      });
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    } finally {
      setReassigningNightId(null);
    }
  }

  async function handleAccommodationBlockFilterChange(accommodationId: string) {
    setBlockAccommodationId(accommodationId);
    setBlockRoomFilterId('ALL');
    try {
      await loadRoomBlocks(false, Number(accommodationId), null);
      setBanner({ tone: 'info', text: 'Accommodation block context updated.' });
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    }
  }

  async function handleAccommodationPricingFilterChange(accommodationId: string) {
    setPricingAccommodationId(accommodationId);
    setPricingRoomTypeFilterId('ALL');
    try {
      await loadPricePolicies(false, Number(accommodationId), null);
      setBanner({ tone: 'info', text: 'Pricing accommodation context updated.' });
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    }
  }

  async function handleRoomTypePricingFilterChange(roomTypeId: string) {
    setPricingRoomTypeFilterId(roomTypeId);
    const selectedAccommodation =
      pricingAccommodationId === ''
        ? pricePolicyManagement?.selectedAccommodationId ?? null
        : Number(pricingAccommodationId);
    if (selectedAccommodation === null) {
      return;
    }
    try {
      await loadPricePolicies(false, selectedAccommodation, roomTypeId === 'ALL' ? null : Number(roomTypeId));
      setBanner({ tone: 'info', text: 'Pricing room-type filter updated.' });
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    }
  }

  async function handleRoomBlockFilterChange(roomId: string) {
    setBlockRoomFilterId(roomId);
    const selectedAccommodation =
      blockAccommodationId === '' ? roomBlockManagement?.selectedAccommodationId ?? null : Number(blockAccommodationId);
    if (selectedAccommodation === null) {
      return;
    }
    try {
      await loadRoomBlocks(false, selectedAccommodation, roomId === 'ALL' ? null : Number(roomId));
      setBanner({ tone: 'info', text: 'Room block filter updated.' });
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    }
  }

  async function handleCreateRoomBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newBlockRoomId || !newBlockStartDate || !newBlockEndDate) {
      setBanner({ tone: 'error', text: 'Room, start date, and end date are required.' });
      return;
    }
    setCreatingRoomBlock(true);
    try {
      const result = await apiRequest<RoomBlockMutationResponse>('/api/v1/room-blocks', {
        method: 'POST',
        body: JSON.stringify({
          roomId: Number(newBlockRoomId),
          startDate: newBlockStartDate,
          endDate: newBlockEndDate,
          reasonType: newBlockReasonType,
          reasonText: newBlockReasonText.trim() || null
        })
      });
      await refreshRoomBlocksAndDetail();
      setNewBlockReasonText('');
      setBanner({
        tone: 'success',
        text: `Room block ${result.blockId} created for room ${result.roomCode}.`
      });
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    } finally {
      setCreatingRoomBlock(false);
    }
  }

  async function handleDeactivateRoomBlock(blockId: number) {
    setDeactivatingBlockId(blockId);
    try {
      const result = await apiRequest<RoomBlockMutationResponse>(`/api/v1/room-blocks/${blockId}/deactivate`, {
        method: 'POST'
      });
      await refreshRoomBlocksAndDetail();
      setBanner({
        tone: 'success',
        text: `Room block ${result.blockId} is now ${result.status}.`
      });
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    } finally {
      setDeactivatingBlockId(null);
    }
  }

  function toggleNewPolicyDayBit(bit: number) {
    setNewPolicyDayBits((current) =>
      current.includes(bit) ? current.filter((value) => value !== bit) : [...current, bit].sort((a, b) => a - b)
    );
  }

  async function handleCreatePricePolicy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newPolicyRoomTypeId || !newPolicyName.trim() || !newPolicyStartDate || !newPolicyEndDate || !newPolicyDeltaAmount.trim()) {
      setBanner({ tone: 'error', text: 'Room type, policy name, date range, and delta amount are required.' });
      return;
    }
    setCreatingPricePolicy(true);
    try {
      const result = await apiRequest<PricePolicyMutationResponse>('/api/v1/price-policies', {
        method: 'POST',
        body: JSON.stringify({
          roomTypeId: Number(newPolicyRoomTypeId),
          policyName: newPolicyName.trim(),
          startDate: newPolicyStartDate,
          endDate: newPolicyEndDate,
          deltaAmount: Number(newPolicyDeltaAmount),
          dayOfWeekMask: buildDayOfWeekMask(newPolicyDayBits)
        })
      });
      await refreshPricePoliciesAndDetail();
      setNewPolicyName('');
      setNewPolicyDeltaAmount('');
      setNewPolicyDayBits([]);
      setBanner({
        tone: 'success',
        text: `Price policy ${result.policyId} created for ${result.roomTypeName}.`
      });
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    } finally {
      setCreatingPricePolicy(false);
    }
  }

  async function handleApproveHostRoleRequest(request: AdminHostRoleRequest) {
    setReviewingHostRoleRequestId(request.requestId);
    try {
      const result = await apiRequest<AdminHostRoleRequestDecisionResponse>(
        `/api/v1/admin/host-role-requests/${request.requestId}/approve`,
        {
          method: 'POST',
          body: JSON.stringify({ reviewReason: adminReviewReason.trim() || null })
        }
      );
      await refreshAdminContext(request.requestId, request.userId);
      setBanner({
        tone: 'success',
        text: `Host role request ${result.requestId} was approved.`
      });
      setAdminReviewReason('');
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    } finally {
      setReviewingHostRoleRequestId(null);
    }
  }

  async function handleRejectHostRoleRequest(request: AdminHostRoleRequest) {
    setReviewingHostRoleRequestId(request.requestId);
    try {
      const result = await apiRequest<AdminHostRoleRequestDecisionResponse>(
        `/api/v1/admin/host-role-requests/${request.requestId}/reject`,
        {
          method: 'POST',
          body: JSON.stringify({ reviewReason: adminReviewReason })
        }
      );
      await refreshAdminContext(request.requestId, request.userId);
      setBanner({
        tone: 'success',
        text: `Host role request ${result.requestId} was rejected.`
      });
      setAdminReviewReason('');
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    } finally {
      setReviewingHostRoleRequestId(null);
    }
  }

  async function handleDeactivatePricePolicy(policyId: number) {
    setDeactivatingPolicyId(policyId);
    try {
      const result = await apiRequest<PricePolicyMutationResponse>(`/api/v1/price-policies/${policyId}/deactivate`, {
        method: 'POST'
      });
      await refreshPricePoliciesAndDetail();
      setBanner({
        tone: 'success',
        text: `Price policy ${result.policyId} is now ${result.status}.`
      });
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    } finally {
      setDeactivatingPolicyId(null);
    }
  }

  const selectedReservationInList =
    selectedReservationId === null
      ? null
      : reservations.find((reservation) => reservation.reservationId === selectedReservationId) ?? null;
  const selectedAdminUserInList =
    selectedAdminUserId === null
      ? null
      : adminUsers.find((adminUser) => adminUser.userId === selectedAdminUserId) ?? null;
  const selectedHostRoleRequestInList =
    selectedHostRoleRequestId === null
      ? null
      : adminHostRoleRequests.find((request) => request.requestId === selectedHostRoleRequestId) ?? null;
  const roomBlockReasonChoices = blockReasonOptions(user?.role);
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">ops-web / M5 pricing + block management / M6 operations foundation</p>
          <h1>Reservation operations, room-level blocks, and additive pricing</h1>
          <p className="hero-copy">
            Review reservations across statuses, inspect nightly assignments, approve or reject
            pending requests, reassign today-or-future nights, and manage room-level blocks and
            room-type price policies that feed the same guest preview and ops detail rules.
          </p>
        </div>
        <div className="hero-meta">
          <span>HOST ownership enforced</span>
          <span>ADMIN has broader ops access</span>
          <span>Room-level ACTIVE blocks drive exclusion</span>
          <span>Active pricing deltas stack additively</span>
        </div>
      </header>

      {banner ? <div className={`banner banner-${banner.tone}`}>{banner.text}</div> : null}

      {initializing ? (
        <section className="panel">
          <h2>Checking session</h2>
          <p>Looking for an existing ops session.</p>
        </section>
      ) : null}

      {!initializing && !user ? (
        <section className="panel narrow">
          <h2>Ops login</h2>
          <p className="muted">Seed account: host.demo / hostpass123! or admin.demo / adminpass123!</p>
          <form className="stack" onSubmit={handleLogin}>
            <label>
              Login ID
              <input value={loginId} onChange={(event) => setLoginId(event.target.value)} />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <button type="submit" disabled={loggingIn}>
              {loggingIn ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </section>
      ) : null}

      {user ? (
        <main className="stack-layout">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Current session</h2>
                <p className="muted">
                  Ops runtime now supports host-scoped access, broader admin operations access, and
                  practical room-level block management.
                </p>
              </div>
              <button type="button" className="secondary-button" onClick={handleLogout}>
                Sign out
              </button>
            </div>
            <dl className="definition-list">
              <div><dt>User ID</dt><dd>{user.userId}</dd></div>
              <div><dt>Login ID</dt><dd>{user.loginId}</dd></div>
                <div><dt>Name</dt><dd>{user.name}</dd></div>
                <div><dt>Role</dt><dd>{user.role}</dd></div>
              </dl>
            </section>

            {isAdmin ? (
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Admin user management</h2>
                    <p className="muted">
                      Minimal M7 governance panel for user visibility and host-role-request review.
                    </p>
                  </div>
                  <div className="action-group">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => void loadAdminUsers(true)}
                      disabled={loadingAdminUsers}
                    >
                      {loadingAdminUsers ? 'Refreshing...' : 'Refresh users'}
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => void loadHostRoleRequests(true, hostRoleRequestFilter)}
                      disabled={loadingHostRoleRequests}
                    >
                      {loadingHostRoleRequests ? 'Refreshing...' : 'Refresh requests'}
                    </button>
                  </div>
                </div>

                <div className="admin-grid">
                  <section className="detail-card">
                    <h4>Users</h4>
                    {adminUsers.length === 0 ? (
                      <p className="empty-state">No users found.</p>
                    ) : (
                      <div className="admin-list">
                        {adminUsers.map((adminUser) => (
                          <button
                            key={adminUser.userId}
                            type="button"
                            className={`result-card ${
                              adminUser.userId === selectedAdminUserId ? 'result-card-active' : ''
                            }`}
                            onClick={() => void loadAdminUserDetail(adminUser.userId, true)}
                          >
                            <div className="result-card-header">
                              <div>
                                <strong>{adminUser.loginId}</strong>
                                <p>{adminUser.name}</p>
                              </div>
                              <span className={`status-pill status-${adminUser.role.toLowerCase()}`}>
                                {adminUser.role}
                              </span>
                            </div>
                            <div className="result-metrics">
                              <span>Status: {adminUser.status}</span>
                              <span>Failed logins: {adminUser.failedLoginCount}</span>
                              <span>
                                Latest request:{' '}
                                {adminUser.latestHostRoleRequestStatus ?? 'None'}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="detail-card">
                    <h4>User detail</h4>
                    {!adminUserDetail ? (
                      <p className="empty-state">Choose one user to inspect detail.</p>
                    ) : (
                      <dl className="definition-list admin-definition-list">
                        <div><dt>Login ID</dt><dd>{adminUserDetail.loginId}</dd></div>
                        <div><dt>Name</dt><dd>{adminUserDetail.name}</dd></div>
                        <div><dt>Role</dt><dd>{adminUserDetail.role}</dd></div>
                        <div><dt>Status</dt><dd>{adminUserDetail.status}</dd></div>
                        <div><dt>Email</dt><dd>{adminUserDetail.email ?? 'Not set'}</dd></div>
                        <div><dt>Phone</dt><dd>{adminUserDetail.phone ?? 'Not set'}</dd></div>
                        <div><dt>Created</dt><dd>{formatTimestamp(adminUserDetail.createdAt)}</dd></div>
                        <div><dt>Updated</dt><dd>{formatTimestamp(adminUserDetail.updatedAt)}</dd></div>
                        <div><dt>Last login</dt><dd>{formatTimestamp(adminUserDetail.lastLoginAt)}</dd></div>
                        <div><dt>Failed count</dt><dd>{adminUserDetail.failedLoginCount}</dd></div>
                        <div><dt>Last failed</dt><dd>{formatTimestamp(adminUserDetail.lastFailedAt)}</dd></div>
                        <div><dt>Locked until</dt><dd>{formatTimestamp(adminUserDetail.lockedUntil)}</dd></div>
                        <div>
                          <dt>Password changed</dt>
                          <dd>{formatTimestamp(adminUserDetail.passwordChangedAt)}</dd>
                        </div>
                      </dl>
                    )}
                  </section>

                  <section className="detail-card detail-card-wide">
                    <div className="panel-header">
                      <div>
                        <h4>Host role requests</h4>
                        <p className="muted">Approve or reject guest-to-host role requests.</p>
                      </div>
                    </div>

                    <div className="filter-row">
                      {hostRoleRequestStatusFilters.map((filter) => (
                        <button
                          key={filter}
                          type="button"
                          className={filter === hostRoleRequestFilter ? 'filter-chip filter-chip-active' : 'filter-chip'}
                          onClick={() => void handleHostRoleRequestFilterChange(filter)}
                        >
                          {formatHostRoleRequestStatusFilter(filter)}
                        </button>
                      ))}
                    </div>

                    <div className="admin-grid admin-grid-wide">
                      <section className="detail-card">
                        {adminHostRoleRequests.length === 0 ? (
                          <p className="empty-state">No host role requests match the current filter.</p>
                        ) : (
                          <div className="admin-list">
                            {adminHostRoleRequests.map((request) => (
                              <button
                                key={request.requestId}
                                type="button"
                                className={`result-card ${
                                  request.requestId === selectedHostRoleRequestId ? 'result-card-active' : ''
                                }`}
                                onClick={() => void loadHostRoleRequestDetail(request.requestId, true)}
                              >
                                <div className="result-card-header">
                                  <div>
                                    <strong>{request.userLoginId}</strong>
                                    <p>{request.userName}</p>
                                  </div>
                                  <span className={`status-pill status-${request.status.toLowerCase()}`}>
                                    {request.status}
                                  </span>
                                </div>
                                <div className="result-metrics">
                                  <span>User role: {request.userRole}</span>
                                  <span>User status: {request.userStatus}</span>
                                  <span>Requested: {formatTimestamp(request.createdAt)}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </section>

                      <section className="detail-card">
                        {!hostRoleRequestDetail ? (
                          <p className="empty-state">Choose one request to inspect or review it.</p>
                        ) : (
                          <div className="detail-stack">
                            <div>
                              <h4>{hostRoleRequestDetail.userLoginId}</h4>
                              <p className="detail-line">{hostRoleRequestDetail.userName}</p>
                              <p className="detail-line">{hostRoleRequestDetail.requestReason}</p>
                              <p className="detail-line">
                                Status {hostRoleRequestDetail.status} / Requested {formatTimestamp(hostRoleRequestDetail.createdAt)}
                              </p>
                              {hostRoleRequestDetail.reviewedAt ? (
                                <p className="detail-line">
                                  Reviewed {formatTimestamp(hostRoleRequestDetail.reviewedAt)}
                                </p>
                              ) : null}
                              {hostRoleRequestDetail.reviewedByLoginId ? (
                                <p className="detail-line">
                                  Reviewer {hostRoleRequestDetail.reviewedByName} ({hostRoleRequestDetail.reviewedByLoginId})
                                </p>
                              ) : null}
                              {hostRoleRequestDetail.reviewReason ? (
                                <p className="detail-line history-reason">{hostRoleRequestDetail.reviewReason}</p>
                              ) : null}
                            </div>

                            <label>
                              Review reason
                              <textarea
                                rows={4}
                                value={adminReviewReason}
                                placeholder="Optional on approve, required on reject."
                                onChange={(event) => setAdminReviewReason(event.target.value)}
                              />
                            </label>

                            <div className="action-group">
                              <button
                                type="button"
                                disabled={
                                  hostRoleRequestDetail.status !== 'PENDING' ||
                                  reviewingHostRoleRequestId === hostRoleRequestDetail.requestId
                                }
                                onClick={() => void handleApproveHostRoleRequest(hostRoleRequestDetail)}
                              >
                                {reviewingHostRoleRequestId === hostRoleRequestDetail.requestId ? 'Working...' : 'Approve host role'}
                              </button>
                              <button
                                type="button"
                                className="danger-button"
                                disabled={
                                  hostRoleRequestDetail.status !== 'PENDING' ||
                                  reviewingHostRoleRequestId === hostRoleRequestDetail.requestId
                                }
                                onClick={() => void handleRejectHostRoleRequest(hostRoleRequestDetail)}
                              >
                                {reviewingHostRoleRequestId === hostRoleRequestDetail.requestId ? 'Working...' : 'Reject request'}
                              </button>
                            </div>
                          </div>
                        )}
                      </section>
                    </div>
                  </section>
                </div>
              </section>
            ) : null}

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Reservation list</h2>
                <p className="muted">
                  Pending and confirmed reservations remain inventory-consuming. Reassignment is allowed only for
                  today and future nights.
                </p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => void loadReservations(true, statusFilter)}
              >
                {refreshing ? 'Refreshing...' : 'Refresh list'}
              </button>
            </div>

            <div className="filter-row">
              {statusFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={filter === statusFilter ? 'filter-chip filter-chip-active' : 'filter-chip'}
                  onClick={() => void handleFilterChange(filter)}
                >
                  {formatStatusFilter(filter)}
                </button>
              ))}
            </div>

            {reservations.length === 0 ? (
              <p className="empty-state">No reservations match the current filter.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Reservation</th>
                      <th>Guest</th>
                      <th>Accommodation</th>
                      <th>Room type</th>
                      <th>Guests</th>
                      <th>Stay</th>
                      <th>Signals</th>
                      <th>Timestamps</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((reservation) => {
                      const isWorking = decisioningReservationId === reservation.reservationId;
                      const isSelected = reservation.reservationId === selectedReservationId;
                      return (
                        <tr key={reservation.reservationId} className={isSelected ? 'table-row-selected' : undefined}>
                          <td>
                            <strong>{reservation.reservationNo}</strong>
                            <div className="row-subtext">ID {reservation.reservationId}</div>
                            <span className={`status-pill status-${reservation.status.toLowerCase()}`}>
                              {reservation.status}
                            </span>
                          </td>
                          <td>
                            {reservation.guestName}
                            <div className="row-subtext">{reservation.guestLoginId}</div>
                          </td>
                          <td>{reservation.accommodationName}</td>
                          <td>{reservation.roomTypeName}</td>
                          <td>{reservation.guestCount}</td>
                          <td>{reservation.checkInDate} to {reservation.checkOutDate}</td>
                          <td>
                            <div className="signal-list">
                              <span>{reservation.reassignmentPossible ? 'Reassignable' : 'Locked'}</span>
                              <span>{reservation.hasRelevantBlocks ? 'Block overlap' : 'No block overlap'}</span>
                              <span>{reservation.hasRelevantPricing ? 'Pricing overlap' : 'No pricing overlap'}</span>
                            </div>
                          </td>
                          <td>
                            <div className="row-subtext">Requested {formatTimestamp(reservation.requestedAt)}</div>
                            {reservation.confirmedAt ? (
                              <div className="row-subtext">Confirmed {formatTimestamp(reservation.confirmedAt)}</div>
                            ) : null}
                            {reservation.cancelledAt ? (
                              <div className="row-subtext">Cancelled {formatTimestamp(reservation.cancelledAt)}</div>
                            ) : null}
                          </td>
                          <td>
                            <div className="action-stack">
                              <button
                                type="button"
                                className="secondary-button"
                                onClick={() => void handleOpenDetail(reservation.reservationId, true)}
                              >
                                Open detail
                              </button>
                              {reservation.status === 'PENDING' ? (
                                <>
                                  <input
                                    value={rejectReasons[reservation.reservationId] ?? ''}
                                    placeholder="Optional reject reason"
                                    onChange={(event) =>
                                      setRejectReasons((current) => ({
                                        ...current,
                                        [reservation.reservationId]: event.target.value
                                      }))
                                    }
                                  />
                                  <div className="action-group">
                                    <button type="button" disabled={isWorking} onClick={() => void handleApprove(reservation)}>
                                      {isWorking ? 'Working...' : 'Approve'}
                                    </button>
                                    <button
                                      type="button"
                                      className="danger-button"
                                      disabled={isWorking}
                                      onClick={() => void handleReject(reservation)}
                                    >
                                      {isWorking ? 'Working...' : 'Reject'}
                                    </button>
                                  </div>
                                </>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Room block management</h2>
                <p className="muted">
                  Create and deactivate room-level blocks. Active blocks are read by guest availability and by
                  reassignment validation without any separate sync step.
                </p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  void loadRoomBlocks(
                    true,
                    blockAccommodationId === ''
                      ? roomBlockManagement?.selectedAccommodationId ?? null
                      : Number(blockAccommodationId),
                    blockRoomFilterId === 'ALL' ? null : Number(blockRoomFilterId)
                  )
                }
              >
                {loadingRoomBlocks ? 'Refreshing...' : 'Refresh blocks'}
              </button>
            </div>

            {!roomBlockManagement || roomBlockManagement.accommodations.length === 0 ? (
              <p className="empty-state">No accessible accommodations are available for room-block management.</p>
            ) : (
              <div className="detail-stack">
                <div className="field-grid">
                  <label>
                    Accommodation
                    <select
                      value={blockAccommodationId}
                      onChange={(event) => void handleAccommodationBlockFilterChange(event.target.value)}
                    >
                      {roomBlockManagement.accommodations.map((accommodation) => (
                        <option key={accommodation.accommodationId} value={accommodation.accommodationId}>
                          {accommodation.accommodationName} / {accommodation.region}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Room filter
                    <select
                      value={blockRoomFilterId}
                      onChange={(event) => void handleRoomBlockFilterChange(event.target.value)}
                    >
                      <option value="ALL">All rooms</option>
                      {roomBlockManagement.rooms.map((room) => (
                        <option key={room.roomId} value={room.roomId}>
                          {room.roomCode} / {room.roomTypeName}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <form className="block-form" onSubmit={handleCreateRoomBlock}>
                  <div className="field-grid">
                    <label>
                      Room
                      <select value={newBlockRoomId} onChange={(event) => setNewBlockRoomId(event.target.value)}>
                        <option value="">Select a room</option>
                        {roomBlockManagement.rooms.map((room) => (
                          <option key={room.roomId} value={room.roomId}>
                            {room.roomCode} / {room.roomTypeName}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Reason type
                      <select
                        value={newBlockReasonType}
                        onChange={(event) => setNewBlockReasonType(event.target.value as RoomBlockReasonType)}
                      >
                        {roomBlockReasonChoices.map((reason) => (
                          <option key={reason.value} value={reason.value}>
                            {reason.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Start date
                      <input
                        type="date"
                        value={newBlockStartDate}
                        onChange={(event) => setNewBlockStartDate(event.target.value)}
                      />
                    </label>

                    <label>
                      End date
                      <input
                        type="date"
                        value={newBlockEndDate}
                        onChange={(event) => setNewBlockEndDate(event.target.value)}
                      />
                    </label>
                  </div>

                  <label>
                    Reason note
                    <textarea
                      rows={3}
                      value={newBlockReasonText}
                      placeholder="Optional operational note for this block"
                      onChange={(event) => setNewBlockReasonText(event.target.value)}
                    />
                  </label>

                  <div className="block-actions">
                    <button type="submit" disabled={creatingRoomBlock}>
                      {creatingRoomBlock ? 'Creating...' : 'Create room block'}
                    </button>
                  </div>
                </form>

                {roomBlockManagement.blocks.length === 0 ? (
                  <p className="empty-state">No room blocks match the current accommodation or room filter.</p>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Block</th>
                          <th>Room</th>
                          <th>Date range</th>
                          <th>Reason</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roomBlockManagement.blocks.map((block) => (
                          <tr key={block.blockId}>
                            <td>
                              <strong>Block {block.blockId}</strong>
                              <div className="row-subtext">{block.accommodationName}</div>
                              <span className={`status-pill status-${block.status.toLowerCase()}`}>
                                {block.status}
                              </span>
                            </td>
                            <td>
                              {block.roomCode}
                              <div className="row-subtext">{block.roomTypeName}</div>
                            </td>
                            <td>{block.startDate} to {block.endDate}</td>
                            <td>
                              <div>{formatBlockReasonType(block.reasonType)}</div>
                              {block.reasonText ? <div className="row-subtext">{block.reasonText}</div> : null}
                            </td>
                            <td>
                              <div>{block.createdByName}</div>
                              <div className="row-subtext">{block.createdByLoginId}</div>
                              <div className="row-subtext">{formatTimestamp(block.createdAt)}</div>
                            </td>
                            <td>
                              {block.status === 'ACTIVE' ? (
                                <button
                                  type="button"
                                  className="danger-button"
                                  disabled={deactivatingBlockId === block.blockId}
                                  onClick={() => void handleDeactivateRoomBlock(block.blockId)}
                                >
                                  {deactivatingBlockId === block.blockId ? 'Working...' : 'Deactivate'}
                                </button>
                              ) : (
                                <span className="row-subtext">Already inactive</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Pricing management</h2>
                <p className="muted">
                  Create and deactivate room-type additive delta policies. Overlapping active policies stay allowed and
                  stack on top of the base price when their date and weekday masks both apply.
                </p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  void loadPricePolicies(
                    true,
                    pricingAccommodationId === ''
                      ? pricePolicyManagement?.selectedAccommodationId ?? null
                      : Number(pricingAccommodationId),
                    pricingRoomTypeFilterId === 'ALL' ? null : Number(pricingRoomTypeFilterId)
                  )
                }
              >
                {loadingPricePolicies ? 'Refreshing...' : 'Refresh pricing'}
              </button>
            </div>

            {!pricePolicyManagement || pricePolicyManagement.accommodations.length === 0 ? (
              <p className="empty-state">No accessible accommodations are available for pricing management.</p>
            ) : (
              <div className="detail-stack">
                <div className="field-grid">
                  <label>
                    Accommodation
                    <select
                      value={pricingAccommodationId}
                      onChange={(event) => void handleAccommodationPricingFilterChange(event.target.value)}
                    >
                      {pricePolicyManagement.accommodations.map((accommodation) => (
                        <option key={accommodation.accommodationId} value={accommodation.accommodationId}>
                          {accommodation.accommodationName} / {accommodation.region}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Room type filter
                    <select
                      value={pricingRoomTypeFilterId}
                      onChange={(event) => void handleRoomTypePricingFilterChange(event.target.value)}
                    >
                      <option value="ALL">All room types</option>
                      {pricePolicyManagement.roomTypes.map((roomType) => (
                        <option key={roomType.roomTypeId} value={roomType.roomTypeId}>
                          {roomType.roomTypeName} / Base {roomType.basePrice.toLocaleString('ko-KR')} KRW
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <form className="block-form" onSubmit={handleCreatePricePolicy}>
                  <div className="field-grid">
                    <label>
                      Room type
                      <select value={newPolicyRoomTypeId} onChange={(event) => setNewPolicyRoomTypeId(event.target.value)}>
                        <option value="">Select a room type</option>
                        {pricePolicyManagement.roomTypes.map((roomType) => (
                          <option key={roomType.roomTypeId} value={roomType.roomTypeId}>
                            {roomType.roomTypeName} / Base {roomType.basePrice.toLocaleString('ko-KR')} KRW
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Policy name
                      <input
                        value={newPolicyName}
                        placeholder="Weekend uplift"
                        onChange={(event) => setNewPolicyName(event.target.value)}
                      />
                    </label>

                    <label>
                      Start date
                      <input
                        type="date"
                        value={newPolicyStartDate}
                        onChange={(event) => setNewPolicyStartDate(event.target.value)}
                      />
                    </label>

                    <label>
                      End date
                      <input
                        type="date"
                        value={newPolicyEndDate}
                        onChange={(event) => setNewPolicyEndDate(event.target.value)}
                      />
                    </label>
                  </div>

                  <div className="field-grid">
                    <label>
                      Additive delta amount (KRW)
                      <input
                        type="number"
                        step="1000"
                        value={newPolicyDeltaAmount}
                        placeholder="15000 or -5000"
                        onChange={(event) => setNewPolicyDeltaAmount(event.target.value)}
                      />
                    </label>
                  </div>

                  <div className="weekday-picker">
                    <span className="weekday-label">Weekday mask</span>
                    <div className="weekday-options">
                      {pricingWeekdayOptions.map((option) => (
                        <label key={option.bit} className="weekday-option">
                          <input
                            type="checkbox"
                            checked={newPolicyDayBits.includes(option.bit)}
                            onChange={() => toggleNewPolicyDayBit(option.bit)}
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                    <p className="row-subtext">
                      Leave all days unchecked to apply the additive delta every day. If multiple active policies
                      overlap, their deltas are summed.
                    </p>
                  </div>

                  <div className="block-actions">
                    <button type="submit" disabled={creatingPricePolicy}>
                      {creatingPricePolicy ? 'Creating...' : 'Create price policy'}
                    </button>
                  </div>
                </form>

                {pricePolicyManagement.policies.length === 0 ? (
                  <p className="empty-state">No price policies match the current accommodation or room-type filter.</p>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Policy</th>
                          <th>Room type</th>
                          <th>Date range</th>
                          <th>Delta</th>
                          <th>Weekdays</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pricePolicyManagement.policies.map((policy) => (
                          <tr key={policy.policyId}>
                            <td>
                              <strong>{policy.policyName}</strong>
                              <div className="row-subtext">Policy {policy.policyId}</div>
                              <div className="row-subtext">{policy.accommodationName}</div>
                              <span className={`status-pill status-${policy.status.toLowerCase()}`}>{policy.status}</span>
                            </td>
                            <td>
                              {policy.roomTypeName}
                              <div className="row-subtext">Room type ID {policy.roomTypeId}</div>
                            </td>
                            <td>{policy.startDate} to {policy.endDate}</td>
                            <td>{formatPriceDelta(policy.deltaAmount)}</td>
                            <td>{formatPricingDayMask(policy.dayOfWeekMask)}</td>
                            <td>{formatTimestamp(policy.createdAt)}</td>
                            <td>
                              {policy.status === 'ACTIVE' ? (
                                <button
                                  type="button"
                                  className="danger-button"
                                  disabled={deactivatingPolicyId === policy.policyId}
                                  onClick={() => void handleDeactivatePricePolicy(policy.policyId)}
                                >
                                  {deactivatingPolicyId === policy.policyId ? 'Working...' : 'Deactivate'}
                                </button>
                              ) : (
                                <span className="row-subtext">Already inactive</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Reservation detail</h2>
                <p className="muted">
                  Detail includes nightly assignments, status history, and block/pricing context so operators can
                  understand why a room is assignable or blocked right now.
                </p>
              </div>
              {selectedReservationId ? (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => void handleOpenDetail(selectedReservationId, true)}
                  disabled={loadingDetail}
                >
                  {loadingDetail ? 'Refreshing...' : 'Refresh detail'}
                </button>
              ) : null}
            </div>

            {!reservationDetail ? (
              <p className="empty-state">Open one reservation from the list to inspect detail and reassignment context.</p>
            ) : (
              <div className="detail-stack">
                <div className="detail-summary">
                  <div>
                    <h3>{reservationDetail.reservationNo}</h3>
                    <p className="detail-line">
                      {reservationDetail.accommodation.accommodationName} / {reservationDetail.roomType.roomTypeName}
                    </p>
                    <p className="detail-line">
                      {reservationDetail.checkInDate} to {reservationDetail.checkOutDate}
                    </p>
                  </div>
                  <div className="summary-meta">
                    <span className={`status-pill status-${reservationDetail.status.toLowerCase()}`}>
                      {reservationDetail.status}
                    </span>
                    <span>{reservationDetail.reassignmentPossible ? 'Reassignment open' : 'Reassignment closed'}</span>
                    <span>{reservationDetail.hasRelevantBlocks ? 'Block overlap present' : 'No block overlap'}</span>
                    <span>{reservationDetail.hasRelevantPricing ? 'Pricing overlap present' : 'No pricing overlap'}</span>
                  </div>
                </div>

                <div className="reservation-detail-grid">
                  <section className="detail-card">
                    <h4>Guest summary</h4>
                    <p className="detail-line"><strong>{reservationDetail.guest.guestName}</strong></p>
                    <p className="detail-line">{reservationDetail.guest.guestLoginId}</p>
                    <p className="detail-line">Guest ID {reservationDetail.guest.guestUserId}</p>
                    <p className="detail-line">Guest count {reservationDetail.guestCount}</p>
                  </section>

                  <section className="detail-card">
                    <h4>Accommodation summary</h4>
                    <p className="detail-line">{reservationDetail.accommodation.accommodationName}</p>
                    <p className="detail-line">{reservationDetail.accommodation.region}</p>
                    <p className="detail-line">{reservationDetail.accommodation.address}</p>
                    <p className="detail-line">
                      Check-in {reservationDetail.checkInTime} / Check-out {reservationDetail.checkOutTime}
                    </p>
                  </section>

                  <section className="detail-card">
                    <h4>Timestamps</h4>
                    <p className="detail-line">Requested {formatTimestamp(reservationDetail.requestedAt)}</p>
                    <p className="detail-line">Confirmed {formatTimestamp(reservationDetail.confirmedAt)}</p>
                    <p className="detail-line">Cancelled {formatTimestamp(reservationDetail.cancelledAt)}</p>
                  </section>

                  <section className="detail-card">
                    <h4>Pending decisions</h4>
                    {reservationDetail.status !== 'PENDING' ? (
                      <p className="empty-state">Approve/reject actions are available only while the reservation is pending.</p>
                    ) : (
                      <>
                        <input
                          value={rejectReasons[reservationDetail.reservationId] ?? ''}
                          placeholder="Optional reject reason"
                          onChange={(event) =>
                            setRejectReasons((current) => ({
                              ...current,
                              [reservationDetail.reservationId]: event.target.value
                            }))
                          }
                        />
                        <div className="action-group">
                          <button
                            type="button"
                            disabled={decisioningReservationId === reservationDetail.reservationId}
                            onClick={() =>
                              void handleApprove(selectedReservationInList ?? reservationDetailToSummary(reservationDetail))
                            }
                          >
                            {decisioningReservationId === reservationDetail.reservationId ? 'Working...' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            className="danger-button"
                            disabled={decisioningReservationId === reservationDetail.reservationId}
                            onClick={() =>
                              void handleReject(selectedReservationInList ?? reservationDetailToSummary(reservationDetail))
                            }
                          >
                            {decisioningReservationId === reservationDetail.reservationId ? 'Working...' : 'Reject'}
                          </button>
                        </div>
                      </>
                    )}
                  </section>
                </div>

                <section className="detail-card detail-card-wide">
                  <h4>Nightly assignments</h4>
                  <div className="night-ops-list">
                    {reservationDetail.nights.map((night) => {
                      const selectedRoomId = reassignmentSelections[night.reservationNightId] ?? '';
                      const canSubmitReassignment =
                        night.reassignmentAllowed &&
                        night.availableReassignmentRooms.length > 0 &&
                        selectedRoomId !== '';
                      return (
                        <article key={night.reservationNightId} className="night-ops-card">
                          <div className="night-ops-header">
                            <strong>{night.stayDate}</strong>
                            <span>
                              Assigned {night.assignedRoomCode} / {night.assignedRoomTypeName}
                            </span>
                          </div>
                          <div className="signal-list">
                            <span>{night.assignedRoomBlocked ? 'Assigned room currently blocked' : 'Assigned room clear'}</span>
                            <span>{night.assignedRoomTypeOverride ? 'Cross-type override active' : 'Booked room type match'}</span>
                            <span>{night.reassignmentAllowed ? 'Editable night' : night.reassignmentBlockedReason ?? 'Locked night'}</span>
                          </div>
                          {night.reassignmentAllowed ? (
                            night.availableReassignmentRooms.length === 0 ? (
                              <p className="empty-state">No valid alternative rooms are available for this night right now.</p>
                            ) : (
                              <div className="reassignment-row">
                                <select
                                  value={selectedRoomId}
                                  onChange={(event) =>
                                    setReassignmentSelections((current) => ({
                                      ...current,
                                      [night.reservationNightId]: event.target.value
                                    }))
                                  }
                                >
                                  {night.availableReassignmentRooms.map((room) => (
                                    <option key={room.roomId} value={room.roomId}>
                                      {room.roomCode} / {room.roomTypeName}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  disabled={!canSubmitReassignment || reassigningNightId === night.reservationNightId}
                                  onClick={() => void handleReassignNight(night)}
                                >
                                  {reassigningNightId === night.reservationNightId ? 'Reassigning...' : 'Reassign night'}
                                </button>
                              </div>
                            )
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                </section>

                <div className="reservation-detail-grid">
                  <section className="detail-card">
                    <h4>Block context</h4>
                    {reservationDetail.blockContexts.length === 0 ? (
                      <p className="empty-state">No active room blocks overlap this stay.</p>
                    ) : (
                      <div className="history-list">
                        {reservationDetail.blockContexts.map((block) => (
                          <article key={block.blockId} className="history-item">
                            <div className="history-header">
                              <strong>{block.roomCode} / {block.roomTypeName}</strong>
                              <span>{block.startDate} to {block.endDate}</span>
                            </div>
                            <p className="detail-line">{formatBlockReasonType(block.reasonType)}</p>
                            {block.reasonText ? <p className="detail-line history-reason">{block.reasonText}</p> : null}
                          </article>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="detail-card">
                    <h4>Pricing context</h4>
                    {reservationDetail.pricingPolicies.length === 0 ? (
                      <p className="empty-state">No active pricing policies overlap the booked room type for this stay.</p>
                    ) : (
                      <div className="history-list">
                        {reservationDetail.pricingPolicies.map((policy) => (
                          <article key={policy.policyId} className="history-item">
                            <div className="history-header">
                              <strong>{policy.policyName}</strong>
                              <span>{policy.startDate} to {policy.endDate}</span>
                            </div>
                            <p className="detail-line">{policy.roomTypeName}</p>
                            <p className="detail-line">Delta {formatPriceDelta(policy.deltaAmount)}</p>
                            <p className="detail-line">{formatPricingDayMask(policy.dayOfWeekMask)}</p>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="detail-card detail-card-wide">
                    <h4>Status history</h4>
                    {reservationDetail.statusHistory.length === 0 ? (
                      <p className="empty-state">No status events recorded yet.</p>
                    ) : (
                      <div className="history-list">
                        {reservationDetail.statusHistory.map((event) => (
                          <article key={event.historyId} className="history-item">
                            <div className="history-header">
                              <strong>{formatReservationAction(event.actionType)}</strong>
                              <span>{formatTimestamp(event.changedAt)}</span>
                            </div>
                            <p className="detail-line">
                              {event.fromStatus ? `${event.fromStatus} -> ${event.toStatus}` : event.toStatus}
                            </p>
                            <p className="detail-line">By {event.changedByName} ({event.changedByLoginId})</p>
                            {event.reasonText ? <p className="detail-line history-reason">{event.reasonText}</p> : null}
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </div>
            )}
          </section>
        </main>
      ) : null}
    </div>
  );
}

export default App;
