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
  loginGuestTask,
  logoutGuestTask,
  signupGuestTask,
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
  fetchRoomTypeCalendar,
  searchAccommodations
} from './features/search/api';
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
import './styles.css';

const SHOW_WORKSPACE_SIDEBAR = true;
const businessToday = getBusinessTodayIsoDate();

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '요청 처리 중 오류가 발생했습니다.';
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<GuestPage>('search');
  const [banner, setBanner] = useState<BannerState>(null);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [signupTerms, setSignupTerms] = useState<SignupTerm[]>([]);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [signupForm, setSignupForm] = useState<SignupFormState>(defaultSignupForm);
  const [searchForm, setSearchForm] = useState<SearchFormState>(defaultSearchForm);
  const [searchResults, setSearchResults] = useState<AccommodationSearchResult[]>([]);
  const [selectedAccommodationId, setSelectedAccommodationId] = useState<number | null>(null);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<number | null>(null);
  const [accommodationDetail, setAccommodationDetail] = useState<AccommodationDetail | null>(null);
  const [calendar, setCalendar] = useState<RoomTypeCalendar | null>(null);
  const [reservations, setReservations] = useState<ReservationSummary[]>([]);
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null);
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
  }, []);

  useEffect(() => {
    if (!user) {
      clearAuthenticatedState();
      return;
    }

    void Promise.all([loadReservations(), loadAccountProfile(), loadHostRoleRequestState()]);
  }, [user]);

  async function loadSignupTerms() {
    await loadSignupTermsTask({
      setLoadingSignupTerms,
      setSignupTerms,
      setBanner
    });
  }

  async function loadCurrentGuest() {
    await loadCurrentGuestTask({
      setUser,
      setCurrentPage
    });
  }

  async function loadReservations() {
    await loadReservationsTask({
      setReservations,
      setBanner
    });
  }

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
    await loginGuestTask({
      loginId,
      password,
      setLoggingIn,
      setUser,
      setPassword,
      setBanner,
      setCurrentPage,
      nextPage: resolveGuestPageAfterLogin(pendingReservationIntent)
    });
  }

  async function handleSignupSubmitViaTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await signupGuestTask({
      signupForm,
      setSigningUp,
      setSignupForm,
      setCurrentPage,
      setBanner
    });
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
          signupForm={signupForm}
          signupTerms={signupTerms}
          loggingIn={loggingIn}
          signingUp={signingUp}
          loadingSignupTerms={loadingSignupTerms}
          onLoginSubmit={handleLoginSubmitViaTask}
          onSignupSubmit={handleSignupSubmitViaTask}
          onRefreshTerms={loadSignupTerms}
          onLoginIdChange={setLoginId}
          onPasswordChange={setPassword}
          onSignupFieldChange={(field, value) => setSignupForm((prev) => ({ ...prev, [field]: value }))}
          onToggleAgreedTerm={(termId) =>
            setSignupForm((prev) => ({
              ...prev,
              agreedTermIds: prev.agreedTermIds.includes(termId)
                ? prev.agreedTermIds.filter((currentId) => currentId !== termId)
                : [...prev.agreedTermIds, termId]
            }))
          }
          formatTimestamp={formatTimestamp}
          onOpenLogin={() => setCurrentPage('login')}
          onOpenSignup={() => setCurrentPage('signup')}
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
          regionOptions={guestSearchRegionOptions}
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
              regions: [...guestSearchRegionOptions]
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
