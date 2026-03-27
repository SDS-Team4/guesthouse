import { FormEvent, useEffect, useMemo, useState } from 'react';
import { GuestShell } from './components/guest/GuestShell';
import {
  changeGuestPassword,
  createHostRoleRequest,
  createReservation,
  fetchAccountProfile,
  fetchAccommodationDetail,
  fetchCurrentUser,
  fetchHostRoleRequestState,
  fetchReservationDetail,
  fetchReservations,
  fetchRoomTypeCalendar,
  fetchSignupTerms,
  loginGuest,
  logoutGuest,
  searchAccommodations,
  signupGuest,
  updateAccountProfile,
  cancelReservation as cancelReservationRequest
} from './lib/guestApi';
import {
  AccountProfileFormState,
  AccommodationDetail,
  AccommodationSearchResult,
  AuthenticatedUser,
  BannerState,
  GuestAccountProfile,
  HostRoleRequestState,
  PageKey,
  ReservationDetail,
  ReservationCompleteContext,
  ReservationIntent,
  ReservationSummary,
  SearchFormState,
  SearchSortKey,
  SignupTerm,
  RoomTypeCalendar,
  defaultAccountProfileForm,
  defaultPasswordForm,
  defaultReservationListFilter,
  defaultSearchForm,
  defaultSignupForm,
  pageMeta
} from './lib/types';
import { getBusinessTodayIsoDate, validateSearchForm } from './lib/date';
import { LoginPage, RecoveryPlaceholderPage, SignupPage } from './pages/guest/AuthPages';
import { AccountPage, MyPage } from './pages/guest/AccountPages';
import {
  AccommodationDetailPage,
  ReservationCompletePage,
  ReservationRequestPage,
  SearchLandingPage,
  SearchResultsPage
} from './pages/guest/SearchPages';
import { ReservationDetailPage, ReservationListPage } from './pages/guest/ReservationPages';

function App() {
  const [currentPage, setCurrentPage] = useState<PageKey>('search');
  const [postLoginTarget, setPostLoginTarget] = useState<PageKey | null>(null);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [banner, setBanner] = useState<BannerState>(null);
  const [loginId, setLoginId] = useState('guest.demo');
  const [password, setPassword] = useState('guestpass123!');
  const [signupForm, setSignupForm] = useState(defaultSignupForm);
  const [signupTerms, setSignupTerms] = useState<SignupTerm[]>([]);
  const [searchForm, setSearchForm] = useState<SearchFormState>(defaultSearchForm);
  const [searchSort, setSearchSort] = useState<SearchSortKey>('recommended');
  const [searchResults, setSearchResults] = useState<AccommodationSearchResult[]>([]);
  const [selectedAccommodationId, setSelectedAccommodationId] = useState<number | null>(null);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<number | null>(null);
  const [accommodationDetail, setAccommodationDetail] = useState<AccommodationDetail | null>(null);
  const [calendar, setCalendar] = useState<RoomTypeCalendar | null>(null);
  const [reservations, setReservations] = useState<ReservationSummary[]>([]);
  const [reservationFilter, setReservationFilter] = useState(defaultReservationListFilter);
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null);
  const [reservationDetail, setReservationDetail] = useState<ReservationDetail | null>(null);
  const [completeContext, setCompleteContext] = useState<ReservationCompleteContext | null>(null);
  const [hostRoleRequestState, setHostRoleRequestState] = useState<HostRoleRequestState | null>(null);
  const [hostRoleRequestReason, setHostRoleRequestReason] = useState('');
  const [accountProfile, setAccountProfile] = useState<GuestAccountProfile | null>(null);
  const [accountProfileForm, setAccountProfileForm] =
    useState<AccountProfileFormState>(defaultAccountProfileForm);
  const [passwordForm, setPasswordForm] = useState(defaultPasswordForm);
  const [pendingReservationIntent, setPendingReservationIntent] = useState<ReservationIntent | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loadingSignupTerms, setLoadingSignupTerms] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [signingUp, setSigningUp] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [refreshingReservations, setRefreshingReservations] = useState(false);
  const [loadingReservationDetail, setLoadingReservationDetail] = useState(false);
  const [loadingHostRoleRequestState, setLoadingHostRoleRequestState] = useState(false);
  const [creatingHostRoleRequest, setCreatingHostRoleRequest] = useState(false);
  const [loadingAccountProfile, setLoadingAccountProfile] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [cancellingReservation, setCancellingReservation] = useState(false);
  const [creatingReservation, setCreatingReservation] = useState(false);

  const selectedRoomType =
    accommodationDetail?.roomTypes.find((roomType) => roomType.roomTypeId === selectedRoomTypeId) ?? null;

  const activePage = useMemo(() => {
    const meta = pageMeta[currentPage];
    if (meta.auth === 'logged-in' && !user) {
      return 'login';
    }
    if (meta.auth === 'logged-out' && user) {
      return 'mypage';
    }
    return currentPage;
  }, [currentPage, user]);

  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      if (reservationFilter.status !== 'ALL' && reservation.status !== reservationFilter.status) {
        return false;
      }
      if (reservationFilter.dateFrom && reservation.checkOutDate < reservationFilter.dateFrom) {
        return false;
      }
      if (reservationFilter.dateTo && reservation.checkInDate > reservationFilter.dateTo) {
        return false;
      }
      return true;
    });
  }, [reservationFilter, reservations]);

  useEffect(() => {
    void bootstrap();
  }, []);

  async function bootstrap() {
    setInitializing(true);
    try {
      await Promise.all([loadSignupTerms(false), loadSearchResults(false)]);
      try {
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
        await loadAuthenticatedGuestState(false);
      } catch (error) {
        const apiError = error as Error & { status?: number };
        if (apiError.status !== 401) {
          setBanner({ tone: 'error', text: apiError.message });
        }
        clearAuthenticatedState();
      }
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    } finally {
      setInitializing(false);
    }
  }

  function clearAuthenticatedState() {
    setUser(null);
    setReservations([]);
    setSelectedReservationId(null);
    setReservationDetail(null);
    setCompleteContext(null);
    setHostRoleRequestState(null);
    setHostRoleRequestReason('');
    setAccountProfile(null);
    setAccountProfileForm(defaultAccountProfileForm);
    setPasswordForm(defaultPasswordForm);
  }

  function resetAfterLogout() {
    clearAuthenticatedState();
    setPendingReservationIntent(null);
    setPostLoginTarget(null);
    setCurrentPage('search');
  }

  function navigate(page: PageKey) {
    const meta = pageMeta[page];
    if (meta.auth === 'logged-in' && !user) {
      setPostLoginTarget(page);
      setCurrentPage('login');
      return;
    }
    if (meta.auth === 'logged-out' && user) {
      setCurrentPage('mypage');
      return;
    }
    setCurrentPage(page);
  }

  async function loadAuthenticatedGuestState(showBanner = true) {
    await Promise.all([loadReservations(false), loadHostRoleRequestState(false), loadAccountProfile(false)]);
    if (showBanner) {
      setBanner({ tone: 'info', text: '게스트 계정 데이터를 새로 불러왔습니다.' });
    }
  }

  async function loadSignupTerms(showBanner = true) {
    setLoadingSignupTerms(true);
    try {
      const terms = await fetchSignupTerms();
      setSignupTerms(terms);
      setSignupForm((current) => ({
        ...current,
        agreedTermIds: current.agreedTermIds.filter((termId) => terms.some((term) => term.termId === termId))
      }));
      if (showBanner) {
        setBanner({ tone: 'info', text: '필수 약관 목록을 갱신했습니다.' });
      }
    } finally {
      setLoadingSignupTerms(false);
    }
  }

  async function loadReservations(showBanner = true) {
    setRefreshingReservations(true);
    try {
      const data = await fetchReservations();
      setReservations(data);
      if (showBanner) {
        setBanner({ tone: 'info', text: '예약 목록을 갱신했습니다.' });
      }
    } finally {
      setRefreshingReservations(false);
    }
  }

  async function loadReservationDetail(reservationId: number, showBanner = false) {
    setLoadingReservationDetail(true);
    try {
      const detail = await fetchReservationDetail(reservationId);
      setSelectedReservationId(reservationId);
      setReservationDetail(detail);
      if (showBanner) {
        setBanner({ tone: 'info', text: '예약 상세를 갱신했습니다.' });
      }
    } catch (error) {
      setSelectedReservationId(null);
      setReservationDetail(null);
      throw error;
    } finally {
      setLoadingReservationDetail(false);
    }
  }

  async function loadHostRoleRequestState(showBanner = true) {
    setLoadingHostRoleRequestState(true);
    try {
      const state = await fetchHostRoleRequestState();
      setHostRoleRequestState(state);
      if (showBanner) {
        setBanner({ tone: 'info', text: '호스트 권한 요청 상태를 갱신했습니다.' });
      }
    } finally {
      setLoadingHostRoleRequestState(false);
    }
  }

  async function loadAccountProfile(showBanner = true) {
    setLoadingAccountProfile(true);
    try {
      const profile = await fetchAccountProfile();
      setAccountProfile(profile);
      setAccountProfileForm({
        name: profile.name,
        email: profile.email ?? '',
        phone: profile.phone ?? ''
      });
      if (showBanner) {
        setBanner({ tone: 'info', text: '프로필을 갱신했습니다.' });
      }
    } finally {
      setLoadingAccountProfile(false);
    }
  }

  async function loadSearchResults(
    showBanner = true,
    preferredAccommodationId?: number | null,
    preferredRoomTypeId?: number | null
  ) {
    const validationMessage = validateSearchForm(searchForm);
    if (validationMessage) {
      throw new Error(validationMessage);
    }

    setSearching(true);
    try {
      const results = await searchAccommodations(searchForm);
      setSearchResults(results);

      const nextAccommodationId =
        preferredAccommodationId && results.some((item) => item.accommodationId === preferredAccommodationId)
          ? preferredAccommodationId
          : results[0]?.accommodationId ?? null;

      if (nextAccommodationId !== null) {
        await loadAccommodationDetail(nextAccommodationId, false, preferredRoomTypeId);
      } else {
        setSelectedAccommodationId(null);
        setSelectedRoomTypeId(null);
        setAccommodationDetail(null);
        setCalendar(null);
      }

      if (showBanner) {
        setBanner({ tone: 'info', text: '숙소 검색 결과를 갱신했습니다.' });
      }
    } finally {
      setSearching(false);
    }
  }

  async function loadAccommodationDetail(
    accommodationId: number,
    showBanner = false,
    preferredRoomTypeId?: number | null
  ) {
    setLoadingDetail(true);
    try {
      const detail = await fetchAccommodationDetail(accommodationId, searchForm);
      setSelectedAccommodationId(accommodationId);
      setAccommodationDetail(detail);

      const nextRoomTypeId =
        preferredRoomTypeId && detail.roomTypes.some((roomType) => roomType.roomTypeId === preferredRoomTypeId)
          ? preferredRoomTypeId
          : detail.roomTypes[0]?.roomTypeId ?? null;

      setSelectedRoomTypeId(nextRoomTypeId);

      if (nextRoomTypeId !== null) {
        await loadCalendar(accommodationId, nextRoomTypeId, false);
      } else {
        setCalendar(null);
      }

      if (showBanner) {
        setBanner({ tone: 'info', text: '숙소 상세를 갱신했습니다.' });
      }
    } finally {
      setLoadingDetail(false);
    }
  }

  async function loadCalendar(accommodationId: number, roomTypeId: number, showBanner = false) {
    setLoadingCalendar(true);
    try {
      const nextCalendar = await fetchRoomTypeCalendar(accommodationId, roomTypeId, searchForm);
      setSelectedRoomTypeId(roomTypeId);
      setCalendar(nextCalendar);
      if (showBanner) {
        setBanner({ tone: 'info', text: '예약 현황 캘린더를 갱신했습니다.' });
      }
    } finally {
      setLoadingCalendar(false);
    }
  }

  async function refreshSearchContext(
    accommodationId: number | null = selectedAccommodationId,
    roomTypeId: number | null = selectedRoomTypeId
  ) {
    await loadSearchResults(false, accommodationId, roomTypeId);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoggingIn(true);
    try {
      const loggedInUser = await loginGuest(loginId, password);
      setUser(loggedInUser);
      await loadAuthenticatedGuestState(false);

      if (pendingReservationIntent) {
        try {
          await loadAccommodationDetail(
            pendingReservationIntent.accommodationId,
            false,
            pendingReservationIntent.roomTypeId
          );
          setCurrentPage('reservation-request');
        } catch (error) {
          const apiError = error as Error;
          setBanner({ tone: 'error', text: apiError.message });
          setCurrentPage('mypage');
        }
      } else {
        setCurrentPage(postLoginTarget ?? 'mypage');
      }

      setPostLoginTarget(null);
      setBanner({
        tone: 'success',
        text: pendingReservationIntent
          ? `Signed in as ${loggedInUser.loginId}. Saved reservation context is ready.`
          : `Signed in as ${loggedInUser.loginId}.`
      });
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (signupForm.password !== signupForm.passwordConfirm) {
      setBanner({ tone: 'error', text: 'Password confirmation does not match.' });
      return;
    }

    const requiredTermIds = signupTerms.map((term) => term.termId);
    const hasAllRequiredTerms = requiredTermIds.every((termId) => signupForm.agreedTermIds.includes(termId));
    if (!hasAllRequiredTerms) {
      setBanner({ tone: 'error', text: 'Agree to all required signup terms before creating the account.' });
      return;
    }

    setSigningUp(true);
    try {
      const created = await signupGuest(signupForm);
      setSignupForm({
        ...defaultSignupForm,
        agreedTermIds: requiredTermIds
      });
      setLoginId(created.loginId);
      setPassword('');
      setCurrentPage('login');
      setBanner({
        tone: 'success',
        text: `Account ${created.loginId} was created. Sign in to continue.`
      });
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    } finally {
      setSigningUp(false);
    }
  }

  async function handleLogout() {
    try {
      await logoutGuest();
    } catch {
      // Session invalidation is best-effort here.
    }
    resetAfterLogout();
    setBanner({ tone: 'info', text: 'Signed out. Public browsing remains available.' });
  }

  async function handleSearchSubmit() {
    const validationMessage = validateSearchForm(searchForm);
    if (validationMessage) {
      setBanner({ tone: 'error', text: validationMessage });
      return;
    }

    try {
      await loadSearchResults(true);
      setCurrentPage('accommodations');
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    }
  }

  async function handleOpenAccommodation(accommodationId: number) {
    try {
      await loadAccommodationDetail(accommodationId, false);
      setCurrentPage('accommodation-detail');
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    }
  }

  async function handleSelectRoomType(roomTypeId: number) {
    if (selectedAccommodationId === null) {
      return;
    }
    try {
      await loadCalendar(selectedAccommodationId, roomTypeId, true);
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    }
  }

  function handleBeginReservation(roomTypeId: number) {
    const validationMessage = validateSearchForm(searchForm);
    if (validationMessage) {
      setBanner({ tone: 'error', text: validationMessage });
      return;
    }

    setSelectedRoomTypeId(roomTypeId);

    if (!user) {
      if (selectedAccommodationId !== null) {
        setPendingReservationIntent({
          accommodationId: selectedAccommodationId,
          roomTypeId
        });
      }
      setPostLoginTarget('reservation-request');
      setCurrentPage('login');
      setBanner({
        tone: 'info',
        text: 'Search/detail remain public, but reservation entry requires login.'
      });
      return;
    }

    setCurrentPage('reservation-request');
  }

  async function handleCreateReservation() {
    if (!selectedRoomType) {
      setBanner({ tone: 'error', text: 'Choose a room type before creating a reservation.' });
      return;
    }

    setCreatingReservation(true);
    try {
      const created = await createReservation(
        selectedRoomType.roomTypeId,
        Number(searchForm.guestCount),
        searchForm.checkInDate,
        searchForm.checkOutDate
      );
      setPendingReservationIntent(null);
      await Promise.all([loadReservations(false), refreshSearchContext(selectedAccommodationId, selectedRoomTypeId)]);
      await loadReservationDetail(created.reservationId, false);
      setCompleteContext({
        reservation: created,
        accommodationName: accommodationDetail?.accommodationName ?? 'Accommodation',
        roomTypeName: selectedRoomType.roomTypeName
      });
      setCurrentPage('reservation-complete');
      setBanner({
        tone: 'success',
        text: `Reservation ${created.reservationNo} was created in PENDING status.`
      });
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    } finally {
      setCreatingReservation(false);
    }
  }

  async function handleOpenReservationDetail(reservationId: number) {
    try {
      await loadReservationDetail(reservationId, false);
      setCurrentPage('reservation-detail');
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    }
  }

  async function handleCancelReservation() {
    if (!reservationDetail) {
      return;
    }

    setCancellingReservation(true);
    try {
      const cancelled = await cancelReservationRequest(reservationDetail.reservationId);
      await Promise.all([
        loadReservations(false),
        loadReservationDetail(reservationDetail.reservationId, false),
        refreshSearchContext(selectedAccommodationId, selectedRoomTypeId)
      ]);
      setBanner({
        tone: 'success',
        text: `Reservation ${cancelled.reservationNo} is now ${cancelled.status}.`
      });
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    } finally {
      setCancellingReservation(false);
    }
  }

  async function handleCreateHostRoleRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatingHostRoleRequest(true);
    try {
      const updatedState = await createHostRoleRequest(hostRoleRequestReason);
      setHostRoleRequestState(updatedState);
      setHostRoleRequestReason('');
      setBanner({
        tone: 'success',
        text: 'Host role request submitted. Approval takes effect on a fresh ops-web login.'
      });
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    } finally {
      setCreatingHostRoleRequest(false);
    }
  }

  async function handleProfileUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUpdatingProfile(true);
    try {
      const updatedProfile = await updateAccountProfile(accountProfileForm);
      setAccountProfile(updatedProfile);
      setAccountProfileForm({
        name: updatedProfile.name,
        email: updatedProfile.email ?? '',
        phone: updatedProfile.phone ?? ''
      });
      setUser((current) => (current ? { ...current, name: updatedProfile.name } : current));
      setBanner({ tone: 'success', text: 'Account profile updated.' });
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    } finally {
      setUpdatingProfile(false);
    }
  }

  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChangingPassword(true);
    try {
      const result = await changeGuestPassword(passwordForm);
      setPasswordForm(defaultPasswordForm);
      setBanner({
        tone: 'success',
        text: `Password updated at ${new Date(result.changedAt).toLocaleString('ko-KR')}.`
      });
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    } finally {
      setChangingPassword(false);
    }
  }

  function renderPage() {
    switch (activePage) {
      case 'login':
        return (
          <LoginPage
            loginId={loginId}
            password={password}
            pendingReservationIntent={pendingReservationIntent}
            loggingIn={loggingIn}
            onLogin={handleLogin}
            onLoginIdChange={setLoginId}
            onPasswordChange={setPassword}
            onNavigate={navigate}
          />
        );
      case 'signup':
        return (
          <SignupPage
            signupForm={signupForm}
            signupTerms={signupTerms}
            signingUp={signingUp}
            loadingSignupTerms={loadingSignupTerms}
            onSignup={handleSignup}
            onRefreshTerms={() => void loadSignupTerms(true)}
            onFormChange={(field, value) =>
              setSignupForm((current) => ({
                ...current,
                [field]: value
              }))
            }
            onToggleTerm={(termId) =>
              setSignupForm((current) => ({
                ...current,
                agreedTermIds: current.agreedTermIds.includes(termId)
                  ? current.agreedTermIds.filter((value) => value !== termId)
                  : [...current.agreedTermIds, termId]
              }))
            }
          />
        );
      case 'search':
        return (
          <SearchLandingPage
            searchForm={searchForm}
            searching={searching}
            onFormChange={(field, value) =>
              setSearchForm((current) => ({
                ...current,
                [field]: value
              }))
            }
            onSubmit={() => void handleSearchSubmit()}
            onNavigateToResults={() => navigate('accommodations')}
          />
        );
      case 'accommodations':
        return (
          <SearchResultsPage
            searchForm={searchForm}
            searchResults={searchResults}
            searchSort={searchSort}
            searching={searching}
            onFormChange={(field, value) =>
              setSearchForm((current) => ({
                ...current,
                [field]: value
              }))
            }
            onSortChange={setSearchSort}
            onSubmit={() => void handleSearchSubmit()}
            onOpenAccommodation={(accommodationId) => void handleOpenAccommodation(accommodationId)}
          />
        );
      case 'accommodation-detail':
        return (
          <AccommodationDetailPage
            user={user}
            searchForm={searchForm}
            accommodationDetail={accommodationDetail}
            selectedRoomTypeId={selectedRoomTypeId}
            calendar={calendar}
            loadingDetail={loadingDetail}
            loadingCalendar={loadingCalendar}
            onNavigate={navigate}
            onBackToResults={() => navigate('accommodations')}
            onRefreshDetail={() =>
              selectedAccommodationId !== null
                ? void loadAccommodationDetail(selectedAccommodationId, true, selectedRoomTypeId)
                : undefined
            }
            onSelectRoomType={(roomTypeId) => void handleSelectRoomType(roomTypeId)}
            onBeginReservation={handleBeginReservation}
            onRefreshCalendar={() =>
              selectedAccommodationId !== null && selectedRoomTypeId !== null
                ? void loadCalendar(selectedAccommodationId, selectedRoomTypeId, true)
                : undefined
            }
          />
        );
      case 'reservation-request':
        return (
          <ReservationRequestPage
            accommodationDetail={accommodationDetail}
            selectedRoomType={selectedRoomType}
            searchForm={searchForm}
            creatingReservation={creatingReservation}
            onBack={() => navigate('accommodation-detail')}
            onCreateReservation={() => void handleCreateReservation()}
          />
        );
      case 'reservation-complete':
        return (
          <ReservationCompletePage
            completeContext={completeContext}
            onOpenDetail={() =>
              selectedReservationId !== null ? void handleOpenReservationDetail(selectedReservationId) : navigate('reservation-list')
            }
            onOpenList={() => navigate('reservation-list')}
          />
        );
      case 'mypage':
        return user ? (
          <MyPage user={user} accountProfile={accountProfile} onNavigate={navigate} onLogout={() => void handleLogout()} />
        ) : null;
      case 'account':
        return user ? (
          <AccountPage
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
            onRefreshProfile={() => void loadAccountProfile(true)}
            onRefreshHostRoleState={() => void loadHostRoleRequestState(true)}
            onProfileChange={(field, value) =>
              setAccountProfileForm((current) => ({
                ...current,
                [field]: value
              }))
            }
            onPasswordChange={(field, value) =>
              setPasswordForm((current) => ({
                ...current,
                [field]: value
              }))
            }
            onHostRoleReasonChange={setHostRoleRequestReason}
            onSubmitProfile={handleProfileUpdate}
            onSubmitPassword={handlePasswordChange}
            onSubmitHostRoleRequest={handleCreateHostRoleRequest}
          />
        ) : null;
      case 'reservation-list':
        return (
          <ReservationListPage
            filter={reservationFilter}
            reservations={filteredReservations}
            refreshingReservations={refreshingReservations}
            onFilterChange={(field, value) =>
              setReservationFilter((current) => ({
                ...current,
                [field]: value
              }))
            }
            onRefresh={() => void loadReservations(true)}
            onOpenDetail={(reservationId) => void handleOpenReservationDetail(reservationId)}
          />
        );
      case 'reservation-detail':
        return (
          <ReservationDetailPage
            reservationDetail={reservationDetail}
            loadingReservationDetail={loadingReservationDetail}
            cancellingReservation={cancellingReservation}
            onRefresh={() =>
              selectedReservationId !== null ? void loadReservationDetail(selectedReservationId, true) : undefined
            }
            onCancelReservation={() => void handleCancelReservation()}
          />
        );
      case 'find-id':
        return (
          <RecoveryPlaceholderPage
            title="아이디 찾기"
            description="디자인 자리만 먼저 연결하고, 실제 계정 복구 API는 다음 milestone에서 붙입니다."
            onNavigate={navigate}
          />
        );
      case 'find-password':
        return (
          <RecoveryPlaceholderPage
            title="비밀번호 찾기"
            description="현재는 비밀번호 변경까지만 연결되어 있고, 복구 흐름은 추후 구현됩니다."
            onNavigate={navigate}
          />
        );
      default:
        return null;
    }
  }

  return (
    <GuestShell user={user} currentPage={activePage} onNavigate={navigate} onLogout={() => void handleLogout()}>
      <div className="page-frame">
        <section className="status-strip">
          <span>{user ? `Signed in as ${user.loginId}` : 'Anonymous browse mode'}</span>
          <span>Business date {getBusinessTodayIsoDate()}</span>
        </section>

        {banner ? <div className={`banner banner-${banner.tone}`}>{banner.text}</div> : null}

        {initializing ? (
          <SectionPlaceholder />
        ) : (
          renderPage()
        )}
      </div>
    </GuestShell>
  );
}

function SectionPlaceholder() {
  return (
    <section className="section-card">
      <p className="empty-state">Loading public browse and session state...</p>
    </section>
  );
}

export default App;
