import {
  fetchCurrentGuest,
  fetchSignupTerms,
  loginGuest,
  logoutGuest,
  signupGuest
} from '../features/auth/api';
import {
  changeGuestPassword,
  createHostRoleRequest,
  fetchAccountProfile,
  fetchHostRoleRequestState,
  updateAccountProfile
} from '../features/account/api';
import {
  fetchMyReservations,
  fetchReservationDetail,
  cancelReservation,
  createReservation
} from '../features/reservations/api';
import {
  type AuthenticatedUser,
  type GuestAccountProfile,
  type HostRoleRequestState,
  type ReservationDetail,
  type ReservationSummary,
  type RoomTypeAvailability,
  type SignupTerm
} from '../features/guest-api-types';
import {
  defaultAccountProfileForm,
  defaultPasswordForm,
  defaultSignupForm,
  type AccountProfileFormState,
  type BannerState,
  type PasswordFormState,
  type ReservationCompleteState,
  type ReservationIntent,
  type SignupFormState
} from './guestAppState';
import { GuestPage } from './guestPages';

type SetState<T> = (value: T) => void;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '요청 처리 중 오류가 발생했습니다.';
}

export async function loadSignupTermsTask(args: {
  setLoadingSignupTerms: SetState<boolean>;
  setSignupTerms: SetState<SignupTerm[]>;
  setBanner: SetState<BannerState>;
}) {
  const { setLoadingSignupTerms, setSignupTerms, setBanner } = args;

  setLoadingSignupTerms(true);
  try {
    setSignupTerms(await fetchSignupTerms());
  } catch (error) {
    setBanner({ tone: 'error', text: getErrorMessage(error) });
  } finally {
    setLoadingSignupTerms(false);
  }
}

export async function loadCurrentGuestTask(args: {
  setUser: SetState<AuthenticatedUser | null>;
}) {
  const { setUser } = args;

  try {
    setUser(await fetchCurrentGuest());
  } catch {
    setUser(null);
  }
}

export async function loadReservationsTask(args: {
  setReservations: SetState<ReservationSummary[]>;
  setBanner: SetState<BannerState>;
}) {
  const { setReservations, setBanner } = args;

  try {
    setReservations(await fetchMyReservations());
  } catch (error) {
    setBanner({ tone: 'error', text: getErrorMessage(error) });
  }
}

export async function loadAccountProfileTask(args: {
  setLoadingAccountProfile: SetState<boolean>;
  setAccountProfile: SetState<GuestAccountProfile | null>;
  setAccountProfileForm: SetState<AccountProfileFormState>;
  setBanner: SetState<BannerState>;
}) {
  const { setLoadingAccountProfile, setAccountProfile, setAccountProfileForm, setBanner } = args;

  setLoadingAccountProfile(true);
  try {
    const profile = await fetchAccountProfile();
    setAccountProfile(profile);
    setAccountProfileForm({
      name: profile.name,
      email: profile.email ?? '',
      phone: profile.phone ?? ''
    });
  } catch (error) {
    setBanner({ tone: 'error', text: getErrorMessage(error) });
  } finally {
    setLoadingAccountProfile(false);
  }
}

export async function loadHostRoleRequestStateTask(args: {
  setLoadingHostRoleRequestState: SetState<boolean>;
  setHostRoleRequestState: SetState<HostRoleRequestState | null>;
  setBanner: SetState<BannerState>;
}) {
  const { setLoadingHostRoleRequestState, setHostRoleRequestState, setBanner } = args;

  setLoadingHostRoleRequestState(true);
  try {
    setHostRoleRequestState(await fetchHostRoleRequestState());
  } catch (error) {
    setBanner({ tone: 'error', text: getErrorMessage(error) });
  } finally {
    setLoadingHostRoleRequestState(false);
  }
}

export function clearAuthenticatedGuestStateTask(args: {
  setReservations: SetState<ReservationSummary[]>;
  setSelectedReservationId: SetState<number | null>;
  setReservationDetail: SetState<ReservationDetail | null>;
  setCompletedReservation: SetState<ReservationCompleteState | null>;
  setAccountProfile: SetState<GuestAccountProfile | null>;
  setAccountProfileForm: SetState<AccountProfileFormState>;
  setPasswordForm: SetState<PasswordFormState>;
  setHostRoleRequestState: SetState<HostRoleRequestState | null>;
  setHostRoleRequestReason: SetState<string>;
}) {
  args.setReservations([]);
  args.setSelectedReservationId(null);
  args.setReservationDetail(null);
  args.setCompletedReservation(null);
  args.setAccountProfile(null);
  args.setAccountProfileForm(defaultAccountProfileForm);
  args.setPasswordForm(defaultPasswordForm);
  args.setHostRoleRequestState(null);
  args.setHostRoleRequestReason('');
}

export async function loadReservationDetailTask(args: {
  reservationId: number;
  movePage?: boolean;
  setSelectedReservationId: SetState<number | null>;
  setReservationDetail: SetState<ReservationDetail | null>;
  setCurrentPage: SetState<GuestPage>;
  setBanner: SetState<BannerState>;
}) {
  const { reservationId, movePage = true, setSelectedReservationId, setReservationDetail, setCurrentPage, setBanner } = args;

  try {
    const detail = await fetchReservationDetail(reservationId);
    setSelectedReservationId(reservationId);
    setReservationDetail(detail);
    if (movePage) {
      setCurrentPage('reservation-detail');
    }
  } catch (error) {
    setBanner({ tone: 'error', text: getErrorMessage(error) });
  }
}

export async function submitGuestReservationTask(args: {
  selectedRoomType: RoomTypeAvailability | null;
  pendingReservationIntent: ReservationIntent | null;
  searchForm: { guestCount: string; checkInDate: string; checkOutDate: string };
  setCreatingReservation: SetState<boolean>;
  setCompletedReservation: SetState<ReservationCompleteState | null>;
  setPendingReservationIntent: SetState<ReservationIntent | null>;
  setCurrentPage: SetState<GuestPage>;
  setBanner: SetState<BannerState>;
  reloadReservations: () => Promise<void>;
  reloadReservationDetail: (reservationId: number, movePage?: boolean) => Promise<void>;
}) {
  const {
    selectedRoomType,
    pendingReservationIntent,
    searchForm,
    setCreatingReservation,
    setCompletedReservation,
    setPendingReservationIntent,
    setCurrentPage,
    setBanner,
    reloadReservations,
    reloadReservationDetail
  } = args;

  if (!selectedRoomType || !pendingReservationIntent) {
    setBanner({ tone: 'error', text: '예약 요청 정보를 먼저 선택해 주세요.' });
    return;
  }

  setCreatingReservation(true);
  try {
    const created = await createReservation({
      roomTypeId: pendingReservationIntent.roomTypeId,
      guestCount: Number(searchForm.guestCount),
      checkInDate: searchForm.checkInDate,
      checkOutDate: searchForm.checkOutDate
    });

    setCompletedReservation({
      reservationId: created.reservationId,
      reservationNo: created.reservationNo,
      accommodationName: created.accommodationName,
      roomTypeName: created.roomTypeName,
      checkInDate: created.checkInDate,
      checkOutDate: created.checkOutDate,
      guestCount: created.guestCount,
      status: created.status
    });
    setPendingReservationIntent(null);
    setCurrentPage('reservation-complete');
    await Promise.allSettled([
      reloadReservations(),
      reloadReservationDetail(created.reservationId, false)
    ]);
    setBanner({ tone: 'success', text: '예약 요청이 접수되었습니다.' });
  } catch (error) {
    setBanner({ tone: 'error', text: getErrorMessage(error) });
  } finally {
    setCreatingReservation(false);
  }
}

export async function loginGuestTask(args: {
  loginId: string;
  password: string;
  setLoggingIn: SetState<boolean>;
  setUser: SetState<AuthenticatedUser | null>;
  setPassword: SetState<string>;
  setBanner: SetState<BannerState>;
  setCurrentPage: SetState<GuestPage>;
  nextPage: GuestPage;
}) {
  const { loginId, password, setLoggingIn, setUser, setPassword, setBanner, setCurrentPage, nextPage } = args;

  setLoggingIn(true);
  try {
    const authenticatedUser = await loginGuest(loginId, password);
    setUser(authenticatedUser);
    setPassword('');
    setBanner({ tone: 'success', text: `${authenticatedUser.name}님 로그인되었습니다.` });
    setCurrentPage(nextPage);
  } catch (error) {
    setBanner({ tone: 'error', text: getErrorMessage(error) });
  } finally {
    setLoggingIn(false);
  }
}

export async function signupGuestTask(args: {
  signupForm: SignupFormState;
  setSigningUp: SetState<boolean>;
  setSignupForm: SetState<SignupFormState>;
  setCurrentPage: SetState<GuestPage>;
  setBanner: SetState<BannerState>;
}) {
  const { signupForm, setSigningUp, setSignupForm, setCurrentPage, setBanner } = args;

  setSigningUp(true);
  try {
    await signupGuest(signupForm);
    setSignupForm(defaultSignupForm);
    setCurrentPage('login');
    setBanner({ tone: 'success', text: '회원가입이 완료되었습니다. 로그인해 주세요.' });
  } catch (error) {
    setBanner({ tone: 'error', text: getErrorMessage(error) });
  } finally {
    setSigningUp(false);
  }
}

export async function logoutGuestTask(args: {
  setUser: SetState<AuthenticatedUser | null>;
  setCurrentPage: SetState<GuestPage>;
  setBanner: SetState<BannerState>;
}) {
  const { setUser, setCurrentPage, setBanner } = args;

  try {
    await logoutGuest();
  } catch {
    // Ignore logout failure and clear client state anyway.
  }

  setUser(null);
  setCurrentPage('search');
  setBanner({ tone: 'info', text: '로그아웃되었습니다.' });
}

export async function updateGuestProfileTask(args: {
  accountProfileForm: AccountProfileFormState;
  setUpdatingProfile: SetState<boolean>;
  setAccountProfile: SetState<GuestAccountProfile | null>;
  setAccountProfileForm: SetState<AccountProfileFormState>;
  setBanner: SetState<BannerState>;
}) {
  const { accountProfileForm, setUpdatingProfile, setAccountProfile, setAccountProfileForm, setBanner } = args;

  setUpdatingProfile(true);
  try {
    const profile = await updateAccountProfile(accountProfileForm);
    setAccountProfile(profile);
    setAccountProfileForm({
      name: profile.name,
      email: profile.email ?? '',
      phone: profile.phone ?? ''
    });
    setBanner({ tone: 'success', text: '프로필을 저장했습니다.' });
  } catch (error) {
    setBanner({ tone: 'error', text: getErrorMessage(error) });
  } finally {
    setUpdatingProfile(false);
  }
}

export async function changeGuestPasswordTask(args: {
  passwordForm: PasswordFormState;
  setChangingPassword: SetState<boolean>;
  setPasswordForm: SetState<PasswordFormState>;
  setBanner: SetState<BannerState>;
}) {
  const { passwordForm, setChangingPassword, setPasswordForm, setBanner } = args;

  setChangingPassword(true);
  try {
    await changeGuestPassword(passwordForm);
    setPasswordForm(defaultPasswordForm);
    setBanner({ tone: 'success', text: '비밀번호를 변경했습니다.' });
  } catch (error) {
    setBanner({ tone: 'error', text: getErrorMessage(error) });
  } finally {
    setChangingPassword(false);
  }
}

export async function createGuestHostRoleRequestTask(args: {
  hostRoleRequestReason: string;
  setCreatingHostRoleRequest: SetState<boolean>;
  setHostRoleRequestState: SetState<HostRoleRequestState | null>;
  setHostRoleRequestReason: SetState<string>;
  setBanner: SetState<BannerState>;
}) {
  const {
    hostRoleRequestReason,
    setCreatingHostRoleRequest,
    setHostRoleRequestState,
    setHostRoleRequestReason,
    setBanner
  } = args;

  setCreatingHostRoleRequest(true);
  try {
    const nextState = await createHostRoleRequest(hostRoleRequestReason);
    setHostRoleRequestState(nextState);
    setHostRoleRequestReason('');
    setBanner({ tone: 'success', text: '호스트 권한 요청이 제출되었습니다.' });
  } catch (error) {
    setBanner({ tone: 'error', text: getErrorMessage(error) });
  } finally {
    setCreatingHostRoleRequest(false);
  }
}

export async function cancelGuestReservationTask(args: {
  selectedReservationId: number | null;
  setCancellingReservation: SetState<boolean>;
  setBanner: SetState<BannerState>;
  reloadReservations: () => Promise<void>;
  reloadReservationDetail: (reservationId: number, movePage?: boolean) => Promise<void>;
}) {
  const { selectedReservationId, setCancellingReservation, setBanner, reloadReservations, reloadReservationDetail } = args;

  if (!selectedReservationId) {
    return;
  }

  setCancellingReservation(true);
  try {
    await cancelReservation(selectedReservationId);
    await Promise.all([reloadReservations(), reloadReservationDetail(selectedReservationId, true)]);
    setBanner({ tone: 'success', text: '예약을 취소했습니다.' });
  } catch (error) {
    setBanner({ tone: 'error', text: getErrorMessage(error) });
  } finally {
    setCancellingReservation(false);
  }
}
