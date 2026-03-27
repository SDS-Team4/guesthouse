export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error: { code: string; message: string } | null;
  timestamp: string;
};

export type PageKey =
  | 'login'
  | 'signup'
  | 'mypage'
  | 'account'
  | 'search'
  | 'accommodations'
  | 'accommodation-detail'
  | 'reservation-request'
  | 'reservation-complete'
  | 'reservation-list'
  | 'reservation-detail'
  | 'find-id'
  | 'find-password';

export type AuthGate = 'logged-out' | 'logged-in' | 'all';

export const pageMeta: Record<PageKey, { label: string; auth: AuthGate }> = {
  login: { label: '로그인', auth: 'logged-out' },
  signup: { label: '회원가입', auth: 'logged-out' },
  mypage: { label: '마이페이지', auth: 'logged-in' },
  account: { label: '계정관리', auth: 'logged-in' },
  search: { label: '메인 검색', auth: 'all' },
  accommodations: { label: '숙소 목록', auth: 'all' },
  'accommodation-detail': { label: '숙소 상세', auth: 'all' },
  'reservation-request': { label: '예약 요청', auth: 'logged-in' },
  'reservation-complete': { label: '예약 완료', auth: 'logged-in' },
  'reservation-list': { label: '예약 목록', auth: 'logged-in' },
  'reservation-detail': { label: '예약 상세', auth: 'logged-in' },
  'find-id': { label: '아이디 찾기', auth: 'all' },
  'find-password': { label: '비밀번호 찾기', auth: 'all' }
};

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
  loginId: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: 'GUEST';
  status: 'ACTIVE';
  createdAt: string;
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

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

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
  status: ReservationStatus;
  requestedAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
};

export type ReservationActionType =
  | 'REQUESTED'
  | 'HOST_CONFIRMED'
  | 'HOST_REJECTED'
  | 'GUEST_CANCELLED'
  | 'HOST_CANCELLED'
  | 'ADMIN_CANCELLED';

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
  status: ReservationStatus;
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
    fromStatus: ReservationStatus | null;
    toStatus: ReservationStatus;
    actionType: ReservationActionType;
    reasonType: string | null;
    reasonText: string | null;
    changedAt: string;
  }>;
};

export type ReservationCreateResponse = {
  reservationId: number;
  reservationNo: string;
  accommodationId: number;
  roomTypeId: number;
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

export type ReservationCompleteContext = {
  reservation: ReservationCreateResponse;
  accommodationName: string;
  roomTypeName: string;
};

export type BannerState = {
  tone: 'success' | 'error' | 'info';
  text: string;
} | null;

export type SearchFormState = {
  region: string;
  guestCount: string;
  checkInDate: string;
  checkOutDate: string;
};

export type SignupFormState = {
  loginId: string;
  password: string;
  passwordConfirm: string;
  name: string;
  email: string;
  phone: string;
  agreedTermIds: number[];
};

export type AccountProfileFormState = {
  name: string;
  email: string;
  phone: string;
};

export type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
};

export type ReservationIntent = {
  accommodationId: number;
  roomTypeId: number;
};

export type SearchSortKey = 'recommended' | 'price-asc' | 'price-desc';

export type ReservationListFilterState = {
  status: 'ALL' | ReservationStatus;
  dateFrom: string;
  dateTo: string;
};

export const defaultSearchForm: SearchFormState = {
  region: 'SEOUL',
  guestCount: '2',
  checkInDate: '2026-04-16',
  checkOutDate: '2026-04-18'
};

export const defaultSignupForm: SignupFormState = {
  loginId: '',
  password: '',
  passwordConfirm: '',
  name: '',
  email: '',
  phone: '',
  agreedTermIds: []
};

export const defaultAccountProfileForm: AccountProfileFormState = {
  name: '',
  email: '',
  phone: ''
};

export const defaultPasswordForm: PasswordFormState = {
  currentPassword: '',
  newPassword: '',
  newPasswordConfirm: ''
};

export const defaultReservationListFilter: ReservationListFilterState = {
  status: 'ALL',
  dateFrom: '',
  dateTo: ''
};
