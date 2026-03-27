import { FormEvent, useEffect, useMemo, useState } from 'react';
import { GuestAppShell } from './app/GuestAppShell';
import { GuestSidePanel } from './app/GuestSidePanel';
import {
  buildGuestSidebarActions,
  resolveGuestPageAfterLogin,
  resolveGuestPageForAccess,
  resolveReservationRequestEntryPage
} from './app/guestAppFlow';
import {
  cancelGuestReservationTask,
  changeGuestPasswordTask,
  clearAuthenticatedGuestStateTask,
  createGuestHostRoleRequestTask,
  loadAccountProfileTask,
  loadCurrentGuestTask,
  loadHostRoleRequestStateTask,
  loadReservationDetailTask,
  loadReservationsTask,
  loadSignupTermsTask,
  logoutGuestTask,
  submitGuestReservationTask,
  updateGuestProfileTask
} from './app/guestAppOrchestration';
import { GuestPage } from './app/guestPages';
import {
  defaultAccountProfileForm,
  defaultPasswordForm,
  defaultSearchForm,
  defaultSignupForm,
  guestSearchRegionOptions,
  type AccountProfileFormState,
  type BannerState,
  type PasswordFormState,
  type ReservationCompleteState,
  type ReservationIntent,
  type SearchFormState,
  type SignupFormErrors,
  type SignupLoginIdAvailability,
  type SignupFormState
} from './app/guestAppState';
import { GuestAuthSection } from './features/auth/sections/GuestAuthSection';
import { GuestMyPageSection } from './features/account/sections/GuestMyPageSection';
import { GuestAccountSection } from './features/account/sections/GuestAccountSection';
import { GuestSearchHomeSection } from './features/search/sections/GuestSearchHomeSection';
import { GuestAccommodationResultsSection } from './features/search/sections/GuestAccommodationResultsSection';
import { GuestAccommodationDetailSection } from './features/search/sections/GuestAccommodationDetailSection';
import { GuestReservationRequestSection } from './features/reservations/sections/GuestReservationRequestSection';
import { GuestReservationCompleteSection } from './features/reservations/sections/GuestReservationCompleteSection';
import { GuestReservationListSection } from './features/reservations/sections/GuestReservationListSection';
import { GuestReservationDetailSection } from './features/reservations/sections/GuestReservationDetailSection';
import { PlaceholderPage } from './features/recovery/pages/PlaceholderPage';
import {
  fetchAccommodationDetail,
  fetchAccommodationRegions,
  fetchRoomTypeCalendar,
  searchAccommodations
} from './features/search/api';
import { checkSignupFieldAvailability, checkSignupLoginIdAvailability, loginGuest, signupGuest } from './features/auth/api';
import { fetchReservationDetail } from './features/reservations/api';
import {
  type AccommodationSearchResult,
  type AccommodationDetail,
  type AuthenticatedUser,
  type GuestAccountProfile,
  type HostRoleRequestState,
  type ReservationDetail,
  type ReservationSummary,
  type RoomTypeCalendar,
  type SignupTerm
} from './features/guest-api-types';
import {
  formatHostRoleRequestStatus,
  formatReservationAction,
  formatTimestamp,
  getBusinessTodayIsoDate,
  validateSearchForm
} from './shared/lib/guestFormatting';
import { type ApiRequestError } from './shared/api/apiRequest';
import './styles.css';

const SHOW_WORKSPACE_SIDEBAR = true;
const businessToday = getBusinessTodayIsoDate();
const guestPageValues: GuestPage[] = [
  'search',
  'accommodations',
  'accommodation-detail',
  'reservation-request',
  'reservation-complete',
  'reservation-list',
  'reservation-detail',
  'login',
  'signup',
  'mypage',
  'account-profile',
  'account-password',
  'account-host-role-request',
  'find-id',
  'find-password'
];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '요청 처리 중 오류가 발생했습니다.';
}

const signupEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSignupForm(
  signupForm: SignupFormState,
  requiredTermIds: number[]
): SignupFormErrors {
  const errors: SignupFormErrors = {};
  const loginId = signupForm.loginId.trim();
  const password = signupForm.password;
  const passwordConfirm = signupForm.passwordConfirm;
  const name = signupForm.name.trim();
  const email = signupForm.email.trim();
  const phone = signupForm.phone.trim();

  if (!loginId) {
    errors.loginId = '아이디를 입력해주세요.';
  } else if (loginId.length < 4 || loginId.length > 50) {
    errors.loginId = '아이디는 4~50자 사이로 입력해주세요.';
  }

  if (!password) {
    errors.password = '비밀번호를 입력해주세요.';
  } else if (password.length < 8 || password.length > 100) {
    errors.password = '비밀번호는 8~100자 사이로 입력해주세요.';
  }

  if (!passwordConfirm) {
    errors.passwordConfirm = '비밀번호 확인을 입력해주세요.';
  } else if (passwordConfirm.length < 8 || passwordConfirm.length > 100) {
    errors.passwordConfirm = '비밀번호 확인은 8~100자 사이로 입력해주세요.';
  } else if (password && password !== passwordConfirm) {
    errors.passwordConfirm = '비밀번호 입력값이 일치하지 않습니다.';
  }

  if (!name) {
    errors.name = '이름을 입력해주세요.';
  } else if (name.length > 50) {
    errors.name = '이름은 50자 이하로 입력해주세요.';
  }

  if (!email) {
    errors.email = '이메일을 입력해주세요.';
  } else if (email.length > 100) {
    errors.email = '이메일은 100자 이하로 입력해주세요.';
  } else if (!signupEmailPattern.test(email)) {
    errors.email = '이메일 형식을 다시 확인해주세요.';
  }

  if (!phone) {
    errors.phone = '연락처를 입력해주세요.';
  } else if (phone.length > 20) {
    errors.phone = '연락처는 20자 이하로 입력해주세요.';
  }

  if (requiredTermIds.length === 0) {
    errors.agreedTermIds = '현재 가입에 필요한 약관을 불러오지 못했어요. 다시 새로고침해주세요.';
  } else if (!requiredTermIds.every((termId) => signupForm.agreedTermIds.includes(termId))) {
    errors.agreedTermIds = '필수 약관 동의가 필요합니다.';
  }

  return errors;
}

function mapSignupRequestError(error: unknown): SignupFormErrors {
  const requestError = error as ApiRequestError;
  switch (requestError.code) {
    case 'DUPLICATE_LOGIN_ID':
      return { loginId: '이미 사용 중인 아이디입니다.' };
    case 'DUPLICATE_EMAIL':
      return { email: '이미 사용 중인 이메일입니다.' };
    case 'DUPLICATE_PHONE':
      return { phone: '이미 사용 중인 연락처입니다.' };
    default:
      break;
  }

  const message = requestError.message ?? '';
  if (message.includes('Password confirmation')) {
    return { passwordConfirm: '비밀번호 입력값이 일치하지 않습니다.' };
  }
  if (message.includes('All required terms')) {
    return { agreedTermIds: '필수 약관 동의가 필요합니다.' };
  }

  return {};
}

function readGuestPageFromHash(): GuestPage | null {
  return readGuestPageFromHashInternal();
}

function getReadableErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '요청 처리 중 오류가 발생했습니다.';
}

function validateSignupFormSafe(
  signupForm: SignupFormState,
  requiredTermIds: number[]
): SignupFormErrors {
  const errors: SignupFormErrors = {};
  const loginId = signupForm.loginId.trim();
  const password = signupForm.password;
  const passwordConfirm = signupForm.passwordConfirm;
  const name = signupForm.name.trim();
  const email = signupForm.email.trim();
  const phone = signupForm.phone.trim();

  if (!loginId) {
    errors.loginId = '아이디를 입력해주세요.';
  } else if (loginId.length < 4 || loginId.length > 50) {
    errors.loginId = '아이디는 4~50자 사이로 입력해주세요.';
  }

  if (!password) {
    errors.password = '비밀번호를 입력해주세요.';
  } else if (password.length < 8 || password.length > 100) {
    errors.password = '비밀번호는 8~100자 사이로 입력해주세요.';
  }

  if (!passwordConfirm) {
    errors.passwordConfirm = '비밀번호 확인을 입력해주세요.';
  } else if (passwordConfirm.length < 8 || passwordConfirm.length > 100) {
    errors.passwordConfirm = '비밀번호 확인은 8~100자 사이로 입력해주세요.';
  } else if (password && password !== passwordConfirm) {
    errors.passwordConfirm = '비밀번호 입력값이 일치하지 않습니다.';
  }

  if (!name) {
    errors.name = '이름을 입력해주세요.';
  } else if (name.length > 50) {
    errors.name = '이름은 50자 이하로 입력해주세요.';
  }

  if (!email) {
    errors.email = '이메일을 입력해주세요.';
  } else if (email.length > 100) {
    errors.email = '이메일은 100자 이하로 입력해주세요.';
  } else if (!signupEmailPattern.test(email)) {
    errors.email = '이메일 형식을 다시 확인해주세요.';
  }

  if (!phone) {
    errors.phone = '연락처를 입력해주세요.';
  } else if (phone.length > 20) {
    errors.phone = '연락처는 20자 이하로 입력해주세요.';
  }

  if (requiredTermIds.length === 0) {
    errors.agreedTermIds = '현재 가입에 필요한 약관을 불러오지 못했어요. 다시 새로고침해주세요.';
  } else if (!requiredTermIds.every((termId) => signupForm.agreedTermIds.includes(termId))) {
    errors.agreedTermIds = '필수 약관 동의가 필요합니다.';
  }

  return errors;
}

function mapSignupRequestErrorSafe(error: unknown): SignupFormErrors {
  const requestError = error as ApiRequestError;
  switch (requestError.code) {
    case 'DUPLICATE_LOGIN_ID':
      return { loginId: '이미 사용 중인 아이디입니다.' };
    case 'DUPLICATE_EMAIL':
      return { email: '이미 사용 중인 이메일입니다.' };
    case 'DUPLICATE_PHONE':
      return { phone: '이미 사용 중인 연락처입니다.' };
    default:
      break;
  }

  const message = requestError.message ?? '';
  if (message.includes('Password confirmation')) {
    return { passwordConfirm: '비밀번호 입력값이 일치하지 않습니다.' };
  }
  if (message.includes('All required terms')) {
    return { agreedTermIds: '필수 약관 동의가 필요합니다.' };
  }

  return {};
}

function buildSignupLoginIdAvailability(
  loginId: string,
  available: boolean
): SignupLoginIdAvailability {
  const normalizedLoginId = loginId.trim();
  return {
    checkedLoginId: normalizedLoginId,
    available,
    message: available ? '사용 가능한 아이디입니다.' : '이미 사용 중인 아이디입니다.'
  };
}

async function fetchSignupDuplicateErrors(
  signupForm: SignupFormState
): Promise<SignupFormErrors> {
  const loginId = signupForm.loginId.trim();
  const email = signupForm.email.trim();
  const phone = signupForm.phone.trim();

  if (!loginId && !email && !phone) {
    return {};
  }

  const availability = await checkSignupFieldAvailability({
    loginId: loginId || undefined,
    email: email || undefined,
    phone: phone || undefined
  });

  const errors: SignupFormErrors = {};
  if (availability.loginIdAvailable === false) {
    errors.loginId = '이미 사용 중인 아이디입니다.';
  }
  if (availability.emailAvailable === false) {
    errors.email = '이미 사용 중인 이메일입니다.';
  }
  if (availability.phoneAvailable === false) {
    errors.phone = '이미 사용 중인 연락처입니다.';
  }
  return errors;
}

function mapLoginRequestErrorSafe(error: unknown) {
  const requestError = error as ApiRequestError;
  if (requestError.code === 'INVALID_CREDENTIALS') {
    return '아이디 또는 비밀번호가 올바르지 않습니다.';
  }
  if (requestError.code === 'ACCOUNT_LOCKED') {
    return '로그인 실패가 반복되어 마지막 시도부터 5분 동안 잠겨 있습니다.';
  }
  return null;
}

function readGuestPageFromHashInternal(): GuestPage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const hash = window.location.hash.replace(/^#/, '');
  const [pagePart] = hash.split('?');
  return guestPageValues.includes(pagePart as GuestPage) ? (pagePart as GuestPage) : null;
}

function readGuestRouteStateFromHash(): {
  page: GuestPage | null;
  accommodationId: number | null;
  reservationId: number | null;
  roomTypeId: number | null;
  regions: string[];
  checkInDate: string | null;
  checkOutDate: string | null;
  guestCount: string | null;
} {
  if (typeof window === 'undefined') {
    return {
      page: null as GuestPage | null,
      accommodationId: null as number | null,
      reservationId: null as number | null,
      roomTypeId: null as number | null,
      regions: [] as string[],
      checkInDate: null as string | null,
      checkOutDate: null as string | null,
      guestCount: null as string | null
    };
  }

  const hash = window.location.hash.replace(/^#/, '');
  const [pagePart, queryPart = ''] = hash.split('?');
  const params = new URLSearchParams(queryPart);
  const parseNumber = (value: string | null) => {
    if (!value) {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  return {
    page: guestPageValues.includes(pagePart as GuestPage) ? (pagePart as GuestPage) : null,
    accommodationId: parseNumber(params.get('accommodationId')),
    reservationId: parseNumber(params.get('reservationId')),
    roomTypeId: parseNumber(params.get('roomTypeId')),
    regions: (params.get('regions') ?? '')
      .split(',')
      .map((region) => region.trim())
      .filter((region) => region.length > 0),
    checkInDate: params.get('checkInDate'),
    checkOutDate: params.get('checkOutDate'),
    guestCount: params.get('guestCount')
  };
}

function buildGuestHash(args: {
  currentPage: GuestPage;
  selectedAccommodationId: number | null;
  selectedReservationId: number | null;
  selectedRoomTypeId: number | null;
  searchForm: SearchFormState;
}) {
  const { currentPage, selectedAccommodationId, selectedReservationId, selectedRoomTypeId, searchForm } = args;
  const params = new URLSearchParams();

  if (
    currentPage === 'accommodations' ||
    currentPage === 'accommodation-detail' ||
    currentPage === 'reservation-request' ||
    currentPage === 'reservation-complete'
  ) {
    if (searchForm.regions.length > 0) {
      params.set('regions', searchForm.regions.join(','));
    }
    params.set('checkInDate', searchForm.checkInDate);
    params.set('checkOutDate', searchForm.checkOutDate);
    params.set('guestCount', searchForm.guestCount);
  }

  if (
    currentPage === 'accommodation-detail' ||
    currentPage === 'reservation-request' ||
    currentPage === 'reservation-complete'
  ) {
    if (selectedAccommodationId) {
      params.set('accommodationId', String(selectedAccommodationId));
    }
    if (selectedRoomTypeId) {
      params.set('roomTypeId', String(selectedRoomTypeId));
    }
  }

  if (currentPage === 'reservation-detail' && selectedReservationId) {
    params.set('reservationId', String(selectedReservationId));
  }

  const query = params.toString();
  return query ? `#${currentPage}?${query}` : `#${currentPage}`;
}

function mapLoginRequestError(error: unknown) {
  const requestError = error as ApiRequestError;
  if (requestError.code === 'INVALID_CREDENTIALS') {
    return '아이디 또는 비밀번호가 올바르지 않습니다.';
  }
  if (requestError.code === 'ACCOUNT_LOCKED') {
    return '로그인 실패가 반복되어 마지막 시도부터 5분 동안 잠겨 있습니다.';
  }
  return null;
}

export default function App() {
  const initialRouteState = readGuestRouteStateFromHash();
  const [currentPage, setCurrentPage] = useState<GuestPage>(() => initialRouteState.page ?? 'search');
  const [banner, setBanner] = useState<BannerState>(null);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [signupTerms, setSignupTerms] = useState<SignupTerm[]>([]);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signupForm, setSignupForm] = useState<SignupFormState>(defaultSignupForm);
  const [signupErrors, setSignupErrors] = useState<SignupFormErrors>({});
  const [signupLoginIdAvailability, setSignupLoginIdAvailability] = useState<SignupLoginIdAvailability | null>(null);
  const [searchForm, setSearchForm] = useState<SearchFormState>(() => ({
    ...defaultSearchForm,
    regions: initialRouteState.regions.length > 0 ? initialRouteState.regions : defaultSearchForm.regions,
    checkInDate: initialRouteState.checkInDate ?? defaultSearchForm.checkInDate,
    checkOutDate: initialRouteState.checkOutDate ?? defaultSearchForm.checkOutDate,
    guestCount: initialRouteState.guestCount ?? defaultSearchForm.guestCount
  }));
  const [searchRegionOptions, setSearchRegionOptions] = useState<string[]>([...guestSearchRegionOptions]);
  const [searchResults, setSearchResults] = useState<AccommodationSearchResult[]>([]);
  const [selectedAccommodationId, setSelectedAccommodationId] = useState<number | null>(initialRouteState.accommodationId);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<number | null>(initialRouteState.roomTypeId);
  const [accommodationDetail, setAccommodationDetail] = useState<AccommodationDetail | null>(null);
  const [calendar, setCalendar] = useState<RoomTypeCalendar | null>(null);
  const [reservations, setReservations] = useState<ReservationSummary[]>([]);
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(initialRouteState.reservationId);
  const [reservationDetail, setReservationDetail] = useState<ReservationDetail | null>(null);
  const [completedReservation, setCompletedReservation] = useState<ReservationCompleteState | null>(null);
  const [pendingReservationIntent, setPendingReservationIntent] = useState<ReservationIntent | null>(null);
  const [accountProfile, setAccountProfile] = useState<GuestAccountProfile | null>(null);
  const [accountProfileForm, setAccountProfileForm] = useState<AccountProfileFormState>(defaultAccountProfileForm);
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(defaultPasswordForm);
  const [hostRoleRequestState, setHostRoleRequestState] = useState<HostRoleRequestState | null>(null);
  const [hostRoleRequestReason, setHostRoleRequestReason] = useState('');
  const [searching, setSearching] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [signingUp, setSigningUp] = useState(false);
  const [checkingSignupLoginId, setCheckingSignupLoginId] = useState(false);
  const [loadingSignupTerms, setLoadingSignupTerms] = useState(false);
  const [creatingReservation, setCreatingReservation] = useState(false);
  const [cancellingReservation, setCancellingReservation] = useState(false);
  const [loadingAccountProfile, setLoadingAccountProfile] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [loadingHostRoleRequestState, setLoadingHostRoleRequestState] = useState(false);
  const [creatingHostRoleRequest, setCreatingHostRoleRequest] = useState(false);

  const selectedRoomType = useMemo(
    () => accommodationDetail?.roomTypes.find((roomType) => roomType.roomTypeId === selectedRoomTypeId) ?? null,
    [accommodationDetail, selectedRoomTypeId]
  );

  useEffect(() => {
    void loadSignupTerms();
    void loadCurrentGuest();
    void loadSearchRegionOptions();
  }, []);

  useEffect(() => {
    if (!user) {
      clearAuthenticatedState();
      return;
    }

    void Promise.all([loadReservations(), loadAccountProfile(), loadHostRoleRequestState()]);
  }, [user]);

  useEffect(() => {
    const nextPage = resolveGuestPageForAccess(currentPage, Boolean(user));
    if (nextPage !== currentPage) {
      setCurrentPage(nextPage);
    }
  }, [currentPage, user]);

  useEffect(() => {
    const handleHashChange = () => {
      const nextRoute = readGuestRouteStateFromHash();
      if (!nextRoute.page) {
        return;
      }
      if (nextRoute.checkInDate || nextRoute.checkOutDate || nextRoute.guestCount) {
        setSearchForm((prev) => ({
          ...prev,
          regions: nextRoute.regions.length > 0 ? nextRoute.regions : prev.regions,
          checkInDate: nextRoute.checkInDate ?? prev.checkInDate,
          checkOutDate: nextRoute.checkOutDate ?? prev.checkOutDate,
          guestCount: nextRoute.guestCount ?? prev.guestCount
        }));
      }
      setSelectedAccommodationId(nextRoute.accommodationId);
      setSelectedReservationId(nextRoute.reservationId);
      setSelectedRoomTypeId(nextRoute.roomTypeId);
      setCurrentPage(resolveGuestPageForAccess(nextRoute.page, Boolean(user)));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user]);

  useEffect(() => {
    const nextHash = buildGuestHash({
      currentPage,
      selectedAccommodationId,
      selectedReservationId,
      selectedRoomTypeId,
      searchForm
    });
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, '', nextHash);
    }
  }, [currentPage, searchForm, selectedAccommodationId, selectedReservationId, selectedRoomTypeId]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [currentPage]);

  async function loadSignupTerms() {
    await loadSignupTermsTask({
      setLoadingSignupTerms,
      setSignupTerms,
      setBanner
    });
  }

  async function loadCurrentGuest() {
    await loadCurrentGuestTask({
      setUser
    });
  }

  async function loadSearchRegionOptions() {
    try {
      const regions = await fetchAccommodationRegions();
      if (regions.length > 0) {
        setSearchRegionOptions(regions);
      } else {
        setSearchRegionOptions([...guestSearchRegionOptions]);
      }
    } catch {
      setSearchRegionOptions([...guestSearchRegionOptions]);
    }
  }

  async function loadReservations() {
    await loadReservationsTask({
      setReservations,
      setBanner
    });
  }

  useEffect(() => {
    if (currentPage !== 'accommodations' || searchResults.length > 0) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const results = await searchAccommodations(searchForm);
        if (!cancelled) {
          setSearchResults(results);
        }
      } catch (error) {
        if (!cancelled) {
          setBanner({ tone: 'error', text: getErrorMessage(error) });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentPage, searchForm, searchResults.length]);

  useEffect(() => {
    if (currentPage !== 'accommodation-detail' || !selectedAccommodationId) {
      return;
    }
    if (accommodationDetail?.accommodationId === selectedAccommodationId) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const detail = await fetchAccommodationDetail(searchForm, selectedAccommodationId);
        if (!cancelled) {
          setAccommodationDetail(detail);
        }
      } catch (error) {
        if (!cancelled) {
          setBanner({ tone: 'error', text: getErrorMessage(error) });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentPage, selectedAccommodationId, accommodationDetail, searchForm]);

  useEffect(() => {
    if (currentPage !== 'reservation-detail' || !selectedReservationId || !user) {
      return;
    }
    if (reservationDetail?.reservationId === selectedReservationId) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const detail = await fetchReservationDetail(selectedReservationId);
        if (!cancelled) {
          setReservationDetail(detail);
        }
      } catch (error) {
        if (!cancelled) {
          setBanner({ tone: 'error', text: getErrorMessage(error) });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentPage, selectedReservationId, reservationDetail, user]);

  async function loadAccountProfile() {
    await loadAccountProfileTask({
      setLoadingAccountProfile,
      setAccountProfile,
      setAccountProfileForm,
      setBanner
    });
  }

  async function loadHostRoleRequestState() {
    await loadHostRoleRequestStateTask({
      setLoadingHostRoleRequestState,
      setHostRoleRequestState,
      setBanner
    });
  }

  function clearAuthenticatedState() {
    clearAuthenticatedGuestStateTask({
      setReservations,
      setSelectedReservationId,
      setReservationDetail,
      setCompletedReservation,
      setAccountProfile,
      setAccountProfileForm,
      setPasswordForm,
      setHostRoleRequestState,
      setHostRoleRequestReason
    });
  }

  function navigate(page: GuestPage) {
    setCurrentPage(resolveGuestPageForAccess(page, Boolean(user)));
  }

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateSearchForm(searchForm);
    if (validationError) {
      setBanner({ tone: 'error', text: validationError });
      return;
    }

    setSearching(true);
    try {
      const results = await searchAccommodations(searchForm);
      setSearchResults(results);
      setSelectedAccommodationId(null);
      setSelectedRoomTypeId(null);
      setAccommodationDetail(null);
      setCalendar(null);
      setCurrentPage('accommodations');
      setBanner({ tone: 'success', text: '숙소 목록을 불러왔습니다.' });
    } catch (error) {
      setBanner({ tone: 'error', text: getErrorMessage(error) });
    } finally {
      setSearching(false);
    }
  }

  async function openAccommodation(accommodationId: number) {
    try {
      const detail = await fetchAccommodationDetail(searchForm, accommodationId);
      setSelectedAccommodationId(accommodationId);
      setSelectedRoomTypeId(null);
      setAccommodationDetail(detail);
      setCalendar(null);
      setCurrentPage('accommodation-detail');
    } catch (error) {
      setBanner({ tone: 'error', text: getErrorMessage(error) });
    }
  }

  async function openCalendar(roomTypeId: number) {
    if (!selectedAccommodationId) {
      return;
    }

    try {
      const nextCalendar = await fetchRoomTypeCalendar(searchForm, selectedAccommodationId, roomTypeId);
      setSelectedRoomTypeId(roomTypeId);
      setCalendar(nextCalendar);
    } catch (error) {
      setBanner({ tone: 'error', text: getErrorMessage(error) });
    }
  }

  function closeCalendar() {
    setSelectedRoomTypeId(null);
    setCalendar(null);
  }

  function openReservationRequest(roomTypeId: number) {
    setSelectedRoomTypeId(roomTypeId);
    setPendingReservationIntent({
      accommodationId: selectedAccommodationId ?? 0,
      roomTypeId
    });

    const nextPage = resolveReservationRequestEntryPage(Boolean(user));
    if (nextPage === 'login') {
      setCurrentPage(nextPage);
      setBanner({ tone: 'info', text: '예약 요청을 진행하려면 먼저 로그인해 주세요.' });
      return;
    }

    setCurrentPage(nextPage);
  }

  async function loadReservationDetailViaTask(reservationId: number, movePage = true) {
    await loadReservationDetailTask({
      reservationId,
      movePage,
      setSelectedReservationId,
      setReservationDetail,
      setCurrentPage,
      setBanner
    });
  }

  async function submitReservationViaTask() {
    await submitGuestReservationTask({
      selectedRoomType,
      pendingReservationIntent,
      searchForm,
      setCreatingReservation,
      setCompletedReservation,
      setPendingReservationIntent,
      setCurrentPage,
      setBanner,
      reloadReservations: loadReservations,
      reloadReservationDetail: loadReservationDetailViaTask
    });
  }

  async function handleLoginSubmitViaTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loginId.trim() || !password) {
      setLoginError('아이디와 비밀번호를 모두 입력해주세요.');
      setBanner({ tone: 'error', text: '아이디와 비밀번호를 확인해주세요.' });
      return;
    }

    setLoginError(null);
    setLoggingIn(true);
    try {
      const authenticatedUser = await loginGuest(loginId, password);
      setUser(authenticatedUser);
      setPassword('');
      setBanner({ tone: 'success', text: `${authenticatedUser.name}님이 로그인되었습니다.` });
      setCurrentPage(resolveGuestPageAfterLogin(pendingReservationIntent));
    } catch (error) {
      setLoginError(mapLoginRequestError(error) ?? getErrorMessage(error));
      setBanner({ tone: 'error', text: getErrorMessage(error) });
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleSignupSubmitViaTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateSignupForm(
      signupForm,
      signupTerms.map((term) => term.termId)
    );
    if (Object.keys(nextErrors).length > 0) {
      setSignupErrors(nextErrors);
      setBanner({ tone: 'error', text: '입력 내용을 다시 확인해주세요.' });
      return;
    }

    setSignupErrors({});
    setSigningUp(true);
    try {
      await signupGuest(signupForm);
      setSignupForm(defaultSignupForm);
      setCurrentPage('login');
      setBanner({ tone: 'success', text: '?뚯썝媛?낆씠 ?꾨즺?섏뿀?듬땲?? 濡쒓렇?명빐 二쇱꽭??' });
    } catch (error) {
      const mappedErrors = mapSignupRequestError(error);
      if (Object.keys(mappedErrors).length > 0) {
        setSignupErrors(mappedErrors);
      }
      setBanner({ tone: 'error', text: getErrorMessage(error) });
    } finally {
      setSigningUp(false);
    }
  }

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loginId.trim() || !password) {
      setLoginError('아이디와 비밀번호를 모두 입력해주세요.');
      setBanner({ tone: 'error', text: '아이디와 비밀번호를 확인해주세요.' });
      return;
    }

    setLoginError(null);
    setLoggingIn(true);
    try {
      const authenticatedUser = await loginGuest(loginId, password);
      setUser(authenticatedUser);
      setPassword('');
      setBanner({ tone: 'success', text: `${authenticatedUser.name}님이 로그인되었습니다.` });
      setCurrentPage(resolveGuestPageAfterLogin(pendingReservationIntent));
    } catch (error) {
      setLoginError(mapLoginRequestErrorSafe(error) ?? getReadableErrorMessage(error));
      setBanner({ tone: 'error', text: getReadableErrorMessage(error) });
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleSignupSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const localErrors = validateSignupFormSafe(
      signupForm,
      signupTerms.map((term) => term.termId)
    );

    let duplicateErrors: SignupFormErrors = {};
    try {
      duplicateErrors = await fetchSignupDuplicateErrors(signupForm);
    } catch (error) {
      setBanner({ tone: 'error', text: getReadableErrorMessage(error) });
      return;
    }

    const nextErrors: SignupFormErrors = {
      ...localErrors,
      ...duplicateErrors
    };
    if (Object.keys(nextErrors).length > 0) {
      setSignupErrors(nextErrors);
      if (!localErrors.loginId && signupForm.loginId.trim()) {
        setSignupLoginIdAvailability(
          buildSignupLoginIdAvailability(signupForm.loginId, !duplicateErrors.loginId)
        );
      }
      setBanner({ tone: 'error', text: '입력 내용을 다시 확인해주세요.' });
      return;
    }

    setSignupErrors({});
    setSignupLoginIdAvailability(null);
    setSigningUp(true);
    try {
      await signupGuest(signupForm);
      setSignupForm(defaultSignupForm);
      setSignupLoginIdAvailability(null);
      setCurrentPage('login');
      setBanner({ tone: 'success', text: '회원가입이 완료되었습니다. 로그인 후 이용해주세요.' });
    } catch (error) {
      const mappedErrors = mapSignupRequestErrorSafe(error);
      if (Object.keys(mappedErrors).length > 0) {
        setSignupErrors(mappedErrors);
      }
      setBanner({ tone: 'error', text: getReadableErrorMessage(error) });
    } finally {
      setSigningUp(false);
    }
  }

  async function handleSignupLoginIdCheck() {
    const trimmedLoginId = signupForm.loginId.trim();
    if (!trimmedLoginId) {
      setSignupErrors((prev) => ({ ...prev, loginId: '아이디를 입력해주세요.' }));
      setSignupLoginIdAvailability(null);
      return;
    }
    if (trimmedLoginId.length < 4 || trimmedLoginId.length > 50) {
      setSignupErrors((prev) => ({ ...prev, loginId: '아이디는 4~50자 사이로 입력해주세요.' }));
      setSignupLoginIdAvailability(null);
      return;
    }

    setCheckingSignupLoginId(true);
    setSignupErrors((prev) => {
      if (!prev.loginId) {
        return prev;
      }
      const next = { ...prev };
      delete next.loginId;
      return next;
    });

    try {
      const availability = await checkSignupLoginIdAvailability(trimmedLoginId);
      setSignupLoginIdAvailability(buildSignupLoginIdAvailability(availability.loginId, availability.available));
      if (!availability.available) {
        setSignupErrors((prev) => ({ ...prev, loginId: '이미 사용 중인 아이디입니다.' }));
      } else {
        setSignupErrors((prev) => {
          if (!prev.loginId) {
            return prev;
          }
          const next = { ...prev };
          delete next.loginId;
          return next;
        });
      }
    } catch (error) {
      setSignupLoginIdAvailability(null);
      setBanner({ tone: 'error', text: getReadableErrorMessage(error) });
    } finally {
      setCheckingSignupLoginId(false);
    }
  }

  async function handleLogoutViaTask() {
    await logoutGuestTask({
      setUser,
      setCurrentPage,
      setBanner
    });
  }

  async function handleProfileSubmitViaTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await updateGuestProfileTask({
      accountProfileForm,
      setUpdatingProfile,
      setAccountProfile,
      setAccountProfileForm,
      setBanner
    });
  }

  async function handlePasswordSubmitViaTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await changeGuestPasswordTask({
      passwordForm,
      setChangingPassword,
      setPasswordForm,
      setBanner
    });
  }

  async function handleHostRoleRequestSubmitViaTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createGuestHostRoleRequestTask({
      hostRoleRequestReason,
      setCreatingHostRoleRequest,
      setHostRoleRequestState,
      setHostRoleRequestReason,
      setBanner
    });
  }

  async function handleReservationCancelViaTask() {
    await cancelGuestReservationTask({
      selectedReservationId,
      setCancellingReservation,
      setBanner,
      reloadReservations: loadReservations,
      reloadReservationDetail: loadReservationDetailViaTask
    });
  }

  const guestSidebarActions = useMemo(
    () =>
      buildGuestSidebarActions({
        currentPage,
        hasCompletedReservation: Boolean(completedReservation),
        onOpenSearch: () => setCurrentPage('search'),
        onOpenAccommodations: () => setCurrentPage('accommodations'),
        onOpenReservationList: () => navigate('reservation-list'),
        onOpenCompletedReservationDetail: () => {
          if (completedReservation) {
            void loadReservationDetailViaTask(completedReservation.reservationId, true);
          }
        }
      }),
    [completedReservation, currentPage]
  );

  return (
    <GuestAppShell
      sidebar={
        <GuestSidePanel
          currentPage={currentPage}
          userLoginId={user?.loginId ?? null}
          businessToday={businessToday}
          banner={banner}
          pendingReservationIntent={pendingReservationIntent}
          actions={guestSidebarActions}
          onNavigate={navigate}
        />
      }
      showSidebar={SHOW_WORKSPACE_SIDEBAR}
      signedIn={Boolean(user)}
      onNavigate={navigate}
      onLogout={handleLogoutViaTask}
    >
      {currentPage === 'login' || currentPage === 'signup' ? (
        <GuestAuthSection
          mode={currentPage}
          pendingReservationIntent={pendingReservationIntent}
          loginId={loginId}
          password={password}
          loginError={loginError}
          signupForm={signupForm}
          signupTerms={signupTerms}
          loggingIn={loggingIn}
          signingUp={signingUp}
          loadingSignupTerms={loadingSignupTerms}
          onLoginSubmit={handleLoginSubmit}
          onSignupSubmit={handleSignupSubmit}
          onCheckSignupLoginId={handleSignupLoginIdCheck}
          onRefreshTerms={loadSignupTerms}
          onLoginIdChange={(value) => {
            setLoginId(value);
            if (loginError) {
              setLoginError(null);
            }
          }}
          onPasswordChange={(value) => {
            setPassword(value);
            if (loginError) {
              setLoginError(null);
            }
          }}
          signupErrors={signupErrors}
          signupLoginIdAvailability={signupLoginIdAvailability}
          checkingSignupLoginId={checkingSignupLoginId}
          onSignupFieldChange={(field, value) => {
            setSignupForm((prev) => ({ ...prev, [field]: value }));
            if (field === 'loginId') {
              setSignupLoginIdAvailability(null);
            }
            setSignupErrors((prev) => {
              if (!prev[field]) {
                return prev;
              }
              const next = { ...prev };
              delete next[field];
              return next;
            });
          }}
          onToggleAgreedTerm={(termId) => {
            setSignupForm((prev) => ({
              ...prev,
              agreedTermIds: prev.agreedTermIds.includes(termId)
                ? prev.agreedTermIds.filter((currentId) => currentId !== termId)
                : [...prev.agreedTermIds, termId]
            }));
            setSignupErrors((prev) => {
              if (!prev.agreedTermIds) {
                return prev;
              }
              const next = { ...prev };
              delete next.agreedTermIds;
              return next;
            });
          }}
          formatTimestamp={formatTimestamp}
          onOpenLogin={() => {
            setLoginError(null);
            setSignupLoginIdAvailability(null);
            setCurrentPage('login');
          }}
          onOpenSignup={() => {
            setSignupErrors({});
            setSignupLoginIdAvailability(null);
            setCurrentPage('signup');
          }}
          onOpenFindId={() => setCurrentPage('find-id')}
          onOpenFindPassword={() => setCurrentPage('find-password')}
        />
      ) : null}

      {currentPage === 'find-id' ? (
        <PlaceholderPage
          title="아이디 찾기"
          description="백엔드 recovery API 연결 전까지는 UI 플레이스홀더만 유지합니다."
          buttonText="아이디 찾기 준비중"
          fields={['이름', '이메일 또는 휴대폰 번호']}
        />
      ) : null}

      {currentPage === 'find-password' ? (
        <PlaceholderPage
          title="비밀번호 찾기"
          description="백엔드 recovery API 연결 전까지는 UI 플레이스홀더만 유지합니다."
          buttonText="비밀번호 찾기 준비중"
          fields={['아이디', '이메일 또는 휴대폰 번호']}
        />
      ) : null}

      {currentPage === 'search' ? (
        <GuestSearchHomeSection
          businessToday={businessToday}
          regionOptions={searchRegionOptions}
          searchForm={searchForm}
          searching={searching}
          onSearchSubmit={handleSearchSubmit}
          onToggleRegion={(region) =>
            setSearchForm((prev) => ({
              ...prev,
              regions: prev.regions.includes(region)
                ? prev.regions.filter((currentRegion) => currentRegion !== region)
                : [...prev.regions, region]
            }))
          }
          onSelectAllRegions={() =>
            setSearchForm((prev) => ({
              ...prev,
              regions: [...searchRegionOptions]
            }))
          }
          onClearRegions={() =>
            setSearchForm((prev) => ({
              ...prev,
              regions: []
            }))
          }
          onGuestCountChange={(value) => setSearchForm((prev) => ({ ...prev, guestCount: value }))}
          onCheckInDateChange={(value) => setSearchForm((prev) => ({ ...prev, checkInDate: value }))}
          onCheckOutDateChange={(value) => setSearchForm((prev) => ({ ...prev, checkOutDate: value }))}
        />
      ) : null}

      {currentPage === 'accommodations' ? (
        <GuestAccommodationResultsSection
          searchResults={searchResults}
          selectedAccommodationId={selectedAccommodationId}
          onOpenAccommodation={openAccommodation}
        />
      ) : null}

      {currentPage === 'accommodation-detail' ? (
        <GuestAccommodationDetailSection
          businessToday={businessToday}
          searchCheckInDate={searchForm.checkInDate}
          searchCheckOutDate={searchForm.checkOutDate}
          searchGuestCount={searchForm.guestCount}
          selectedAccommodationId={selectedAccommodationId}
          selectedRoomTypeId={selectedRoomTypeId}
          selectedRoomTypeName={selectedRoomType?.roomTypeName ?? null}
          accommodationDetail={accommodationDetail}
          calendar={calendar}
          userSignedIn={Boolean(user)}
          creatingReservation={creatingReservation ? selectedRoomTypeId : null}
          onOpenCalendar={openCalendar}
          onCloseCalendar={closeCalendar}
          onReserve={openReservationRequest}
        />
      ) : null}

      {currentPage === 'mypage' && user ? (
        <GuestMyPageSection
          user={user}
          onOpenProfile={() => setCurrentPage('account-profile')}
          onOpenPassword={() => setCurrentPage('account-password')}
          onOpenHostRoleRequest={() => setCurrentPage('account-host-role-request')}
          onOpenReservations={() => setCurrentPage('reservation-list')}
          onLogout={handleLogoutViaTask}
        />
      ) : null}

      {(currentPage === 'account-profile' ||
        currentPage === 'account-password' ||
        currentPage === 'account-host-role-request') && user ? (
        <GuestAccountSection
          mode={
            currentPage === 'account-profile'
              ? 'profile'
              : currentPage === 'account-password'
                ? 'password'
                : 'host-role-request'
          }
          user={user}
          accountProfile={accountProfile}
          accountProfileForm={accountProfileForm}
          passwordForm={passwordForm}
          hostRoleRequestState={hostRoleRequestState}
          hostRoleRequestReason={hostRoleRequestReason}
          loadingAccountProfile={loadingAccountProfile}
          updatingProfile={updatingProfile}
          changingPassword={changingPassword}
          loadingHostRoleRequestState={loadingHostRoleRequestState}
          creatingHostRoleRequest={creatingHostRoleRequest}
          onOpenProfile={() => setCurrentPage('account-profile')}
          onOpenPassword={() => setCurrentPage('account-password')}
          onOpenHostRoleRequest={() => setCurrentPage('account-host-role-request')}
          onLogout={handleLogoutViaTask}
          onRefreshProfile={loadAccountProfile}
          onProfileSubmit={handleProfileSubmitViaTask}
          onPasswordSubmit={handlePasswordSubmitViaTask}
          onRefreshHostRoleRequest={loadHostRoleRequestState}
          onCreateHostRoleRequest={handleHostRoleRequestSubmitViaTask}
          onAccountProfileFieldChange={(field, value) =>
            setAccountProfileForm((prev) => ({ ...prev, [field]: value }))
          }
          onPasswordFieldChange={(field, value) => setPasswordForm((prev) => ({ ...prev, [field]: value }))}
          onHostRoleReasonChange={setHostRoleRequestReason}
          formatTimestamp={formatTimestamp}
          formatHostRoleRequestStatus={formatHostRoleRequestStatus}
        />
      ) : null}

      {currentPage === 'reservation-request' ? (
        <GuestReservationRequestSection
          accommodationName={accommodationDetail?.accommodationName ?? null}
          roomType={selectedRoomType}
          searchGuestCount={searchForm.guestCount}
          checkInDate={searchForm.checkInDate}
          checkOutDate={searchForm.checkOutDate}
          creatingReservation={creatingReservation}
          onSubmit={submitReservationViaTask}
          onBackToSearch={() => setCurrentPage('search')}
        />
      ) : null}

      {currentPage === 'reservation-complete' ? (
        <GuestReservationCompleteSection
          reservation={completedReservation}
          onOpenReservationDetail={() =>
            completedReservation ? void loadReservationDetailViaTask(completedReservation.reservationId, true) : undefined
          }
          onOpenReservationList={() => setCurrentPage('reservation-list')}
        />
      ) : null}

      {currentPage === 'reservation-list' ? (
        <GuestReservationListSection
          reservations={reservations}
          selectedReservationId={selectedReservationId}
          onOpenDetail={(reservationId) => void loadReservationDetailViaTask(reservationId, true)}
        />
      ) : null}

      {currentPage === 'reservation-detail' ? (
        <GuestReservationDetailSection
          reservationDetail={reservationDetail}
          cancellingReservation={cancellingReservation}
          onCancelReservation={() => void handleReservationCancelViaTask()}
          formatTimestamp={formatTimestamp}
          formatReservationAction={formatReservationAction}
        />
      ) : null}
    </GuestAppShell>
  );
}
