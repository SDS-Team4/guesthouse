import { FormEvent, useEffect, useState } from 'react';

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error: { code: string; message: string } | null;
  timestamp: string;
};

type AuthenticatedUser = {
  userId: number;
  loginId: string;
  name: string;
  role: 'GUEST';
};

type GuestSignupResponse = {
  userId: number;
  loginId: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: 'GUEST';
  status: 'ACTIVE';
  createdAt: string;
};

type HostRoleRequestStatus = 'PENDING' | 'APPROVED' | 'DENIED';

type HostRoleRequestState = {
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

type AccommodationAvailabilityCategory = 'AVAILABLE' | 'CONDITION_MISMATCH' | 'SOLD_OUT';

type AccommodationSearchResult = {
  accommodationId: number;
  accommodationName: string;
  region: string;
  availabilityCategory: AccommodationAvailabilityCategory;
  matchingRoomTypeCount: number;
  availableRoomTypeCount: number;
  lowestBasePrice: number | null;
  lowestPreviewPrice: number | null;
};

type RoomTypeAvailability = {
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

type AccommodationDetail = {
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

type RoomTypeCalendarDay = {
  date: string;
  availableRoomCount: number;
  soldOut: boolean;
};

type RoomTypeCalendar = {
  accommodationId: number;
  roomTypeId: number;
  roomTypeName: string;
  startDate: string;
  endDate: string;
  days: RoomTypeCalendarDay[];
};

type ReservationSummary = {
  reservationId: number;
  reservationNo: string;
  accommodationId: number;
  accommodationName: string;
  roomTypeId: number;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  requestedAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
};

type ReservationDetail = {
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

type ReservationCreateResponse = {
  reservationId: number;
  reservationNo: string;
  accommodationId: number;
  roomTypeId: number;
  checkInDate: string;
  checkOutDate: string;
  status: 'PENDING';
  requestedAt: string;
};

type ReservationCancellationResponse = {
  reservationId: number;
  reservationNo: string;
  status: 'CANCELLED';
  cancelledAt: string;
};

type BannerState = {
  tone: 'success' | 'error' | 'info';
  text: string;
} | null;

type SearchFormState = {
  region: string;
  guestCount: string;
  checkInDate: string;
  checkOutDate: string;
};

type SignupFormState = {
  loginId: string;
  password: string;
  name: string;
  email: string;
  phone: string;
};

const currencyFormatter = new Intl.NumberFormat('ko-KR');
const defaultSearchForm: SearchFormState = {
  region: 'SEOUL',
  guestCount: '2',
  checkInDate: '2026-04-16',
  checkOutDate: '2026-04-18'
};

const defaultSignupForm: SignupFormState = {
  loginId: '',
  password: '',
  name: '',
  email: '',
  phone: ''
};

function getBusinessTodayIsoDate() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
}

function validateSearchForm(searchForm: SearchFormState) {
  const businessToday = getBusinessTodayIsoDate();
  if (searchForm.checkInDate < businessToday) {
    return 'Check-in date must not be in the past.';
  }
  if (searchForm.checkOutDate <= searchForm.checkInDate) {
    return 'Check-out date must be after check-in date.';
  }
  if (Number(searchForm.guestCount) <= 0) {
    return 'Guest count must be positive.';
  }
  return null;
}

async function apiRequest<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  });

  let envelope: ApiEnvelope<T> | null = null;
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    envelope = null;
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

function buildSearchParams(searchForm: SearchFormState) {
  const params = new URLSearchParams({
    checkInDate: searchForm.checkInDate,
    checkOutDate: searchForm.checkOutDate,
    guestCount: searchForm.guestCount
  });

  if (searchForm.region.trim()) {
    params.set('region', searchForm.region.trim().toUpperCase());
  }

  return params;
}

function formatCurrency(amount: number | null) {
  if (amount === null) {
    return 'N/A';
  }
  return `KRW ${currencyFormatter.format(amount)}`;
}

function formatClassification(category: AccommodationAvailabilityCategory) {
  switch (category) {
    case 'AVAILABLE':
      return 'Available';
    case 'CONDITION_MISMATCH':
      return 'Condition mismatch';
    case 'SOLD_OUT':
      return 'Sold out';
  }
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return 'Not yet';
  }
  return new Date(value).toLocaleString('ko-KR');
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

function formatHostRoleRequestStatus(status: HostRoleRequestStatus) {
  switch (status) {
    case 'PENDING':
      return 'Pending review';
    case 'APPROVED':
      return 'Approved';
    case 'DENIED':
      return 'Denied';
  }
}

function App() {
  const businessToday = getBusinessTodayIsoDate();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [reservations, setReservations] = useState<ReservationSummary[]>([]);
  const [banner, setBanner] = useState<BannerState>(null);
  const [loginId, setLoginId] = useState('guest.demo');
  const [password, setPassword] = useState('guestpass123!');
  const [signupForm, setSignupForm] = useState<SignupFormState>(defaultSignupForm);
  const [searchForm, setSearchForm] = useState<SearchFormState>(defaultSearchForm);
  const [searchResults, setSearchResults] = useState<AccommodationSearchResult[]>([]);
  const [selectedAccommodationId, setSelectedAccommodationId] = useState<number | null>(null);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<number | null>(null);
  const [accommodationDetail, setAccommodationDetail] = useState<AccommodationDetail | null>(null);
  const [calendar, setCalendar] = useState<RoomTypeCalendar | null>(null);
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null);
  const [reservationDetail, setReservationDetail] = useState<ReservationDetail | null>(null);
  const [hostRoleRequestState, setHostRoleRequestState] = useState<HostRoleRequestState | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [signingUp, setSigningUp] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [refreshingReservations, setRefreshingReservations] = useState(false);
  const [loadingReservationDetail, setLoadingReservationDetail] = useState(false);
  const [loadingHostRoleRequestState, setLoadingHostRoleRequestState] = useState(false);
  const [creatingHostRoleRequest, setCreatingHostRoleRequest] = useState(false);
  const [hostRoleRequestReason, setHostRoleRequestReason] = useState('');
  const [cancellingReservation, setCancellingReservation] = useState(false);
  const [creatingReservation, setCreatingReservation] = useState<number | null>(null);

  useEffect(() => {
    void bootstrapSession();
  }, []);

  async function bootstrapSession() {
    setInitializing(true);
    try {
      const currentUser = await apiRequest<AuthenticatedUser>('/api/v1/auth/me', {
        method: 'GET'
      });
      setUser(currentUser);
      await Promise.all([loadReservations(false), loadSearchResults(false), loadHostRoleRequestState(false)]);
    } catch (error) {
      const apiError = error as Error & { status?: number };
      if (apiError.status !== 401) {
        setBanner({ tone: 'error', text: apiError.message });
      }
      resetGuestState();
    } finally {
      setInitializing(false);
    }
  }

  function resetGuestState() {
    setUser(null);
    setReservations([]);
    setSearchResults([]);
    setSelectedAccommodationId(null);
    setSelectedRoomTypeId(null);
    setAccommodationDetail(null);
    setCalendar(null);
    setSelectedReservationId(null);
    setReservationDetail(null);
    setHostRoleRequestState(null);
    setHostRoleRequestReason('');
    setCancellingReservation(false);
  }

  async function loadReservations(showBanner = true) {
    setRefreshingReservations(true);
    try {
      const data = await apiRequest<ReservationSummary[]>('/api/v1/reservations/my', {
        method: 'GET'
      });
      setReservations(data);
      if (showBanner) {
        setBanner({ tone: 'info', text: 'My reservations refreshed.' });
      }
    } finally {
      setRefreshingReservations(false);
    }
  }

  async function loadReservationDetail(reservationId: number, showBanner = false) {
    setLoadingReservationDetail(true);
    try {
      const data = await apiRequest<ReservationDetail>(`/api/v1/reservations/${reservationId}`, {
        method: 'GET'
      });
      setSelectedReservationId(reservationId);
      setReservationDetail(data);
      if (showBanner) {
        setBanner({ tone: 'info', text: 'Reservation detail refreshed.' });
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
      const data = await apiRequest<HostRoleRequestState>('/api/v1/account/host-role-request', {
        method: 'GET'
      });
      setHostRoleRequestState(data);
      if (showBanner) {
        setBanner({ tone: 'info', text: 'Host role request status refreshed.' });
      }
    } finally {
      setLoadingHostRoleRequestState(false);
    }
  }

  async function handleRefreshReservations() {
    try {
      await loadReservations(true);
      if (selectedReservationId !== null) {
        await loadReservationDetail(selectedReservationId, false);
      }
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    }
  }

  async function handleOpenReservationDetail(reservationId: number, showBanner = true) {
    try {
      await loadReservationDetail(reservationId, showBanner);
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
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
      const params = buildSearchParams(searchForm);
      const data = await apiRequest<AccommodationSearchResult[]>(
        `/api/v1/accommodations/search?${params.toString()}`,
        { method: 'GET' }
      );
      setSearchResults(data);

      const nextAccommodationId =
        preferredAccommodationId && data.some((item) => item.accommodationId === preferredAccommodationId)
          ? preferredAccommodationId
          : data[0]?.accommodationId ?? null;

      if (nextAccommodationId !== null) {
        await loadAccommodationDetail(nextAccommodationId, false, preferredRoomTypeId);
      } else {
        setSelectedAccommodationId(null);
        setSelectedRoomTypeId(null);
        setAccommodationDetail(null);
        setCalendar(null);
      }

      if (showBanner) {
        setBanner({ tone: 'info', text: 'Accommodation search refreshed.' });
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
      const params = buildSearchParams(searchForm);
      const detail = await apiRequest<AccommodationDetail>(
        `/api/v1/accommodations/${accommodationId}?${params.toString()}`,
        { method: 'GET' }
      );
      setSelectedAccommodationId(accommodationId);
      setAccommodationDetail(detail);

      const nextRoomTypeId =
        preferredRoomTypeId && detail.roomTypes.some((item) => item.roomTypeId === preferredRoomTypeId)
          ? preferredRoomTypeId
          : detail.roomTypes[0]?.roomTypeId ?? null;

      setSelectedRoomTypeId(nextRoomTypeId);

      if (nextRoomTypeId !== null) {
        await loadCalendar(accommodationId, nextRoomTypeId, false);
      } else {
        setCalendar(null);
      }

      if (showBanner) {
        setBanner({ tone: 'info', text: 'Accommodation detail refreshed.' });
      }
    } finally {
      setLoadingDetail(false);
    }
  }

  async function loadCalendar(
    accommodationId: number,
    roomTypeId: number,
    showBanner = false
  ) {
    setLoadingCalendar(true);
    try {
      const params = new URLSearchParams({
        startDate: searchForm.checkInDate,
        endDate: searchForm.checkOutDate
      });
      const data = await apiRequest<RoomTypeCalendar>(
        `/api/v1/accommodations/${accommodationId}/room-types/${roomTypeId}/calendar?${params.toString()}`,
        { method: 'GET' }
      );
      setSelectedRoomTypeId(roomTypeId);
      setCalendar(data);
      if (showBanner) {
        setBanner({ tone: 'info', text: 'Daily availability refreshed.' });
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
      const loggedInUser = await apiRequest<AuthenticatedUser>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ loginId, password })
      });
      setUser(loggedInUser);
      await Promise.all([loadReservations(false), loadSearchResults(false), loadHostRoleRequestState(false)]);
      setBanner({ tone: 'success', text: `Signed in as ${loggedInUser.loginId}.` });
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSigningUp(true);
    try {
      const created = await apiRequest<GuestSignupResponse>('/api/v1/auth/signup', {
        method: 'POST',
        body: JSON.stringify(signupForm)
      });
      setSignupForm(defaultSignupForm);
      setLoginId(created.loginId);
      setPassword('');
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
      await apiRequest('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      // Session invalidation is best-effort during logout.
    }
    resetGuestState();
    setBanner({ tone: 'info', text: 'Signed out.' });
  }

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationMessage = validateSearchForm(searchForm);
    if (validationMessage) {
      setBanner({ tone: 'error', text: validationMessage });
      return;
    }
    try {
      await loadSearchResults(true);
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    }
  }

  async function handleReserve(roomTypeId: number) {
    setCreatingReservation(roomTypeId);
    try {
      const created = await apiRequest<ReservationCreateResponse>('/api/v1/reservations', {
        method: 'POST',
        body: JSON.stringify({
          roomTypeId,
          checkInDate: searchForm.checkInDate,
          checkOutDate: searchForm.checkOutDate
        })
      });
      await Promise.all([loadReservations(false), refreshSearchContext(selectedAccommodationId, roomTypeId)]);
      await loadReservationDetail(created.reservationId, false);
      setBanner({
        tone: 'success',
        text: `Reservation ${created.reservationNo} was created in PENDING status.`
      });
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    } finally {
      setCreatingReservation(null);
    }
  }

  async function handleCancelReservation() {
    if (!reservationDetail) {
      return;
    }

    setCancellingReservation(true);
    try {
      const cancelled = await apiRequest<ReservationCancellationResponse>(
        `/api/v1/reservations/${reservationDetail.reservationId}/cancel`,
        { method: 'POST' }
      );
      await Promise.all([
        loadReservations(false),
        loadReservationDetail(reservationDetail.reservationId, false),
        refreshSearchContext(selectedAccommodationId, selectedRoomTypeId)
      ]);
      setBanner({
        tone: 'success',
        text: `Reservation ${cancelled.reservationNo} was cancelled successfully.`
      });
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    } finally {
      setCancellingReservation(false);
    }
  }

  async function handleCreateHostRoleRequest() {
    setCreatingHostRoleRequest(true);
    try {
      const data = await apiRequest<HostRoleRequestState>('/api/v1/account/host-role-request', {
        method: 'POST',
        body: JSON.stringify({ requestReason: hostRoleRequestReason })
      });
      setHostRoleRequestState(data);
      setHostRoleRequestReason('');
      setBanner({
        tone: 'success',
        text: 'Host role request was submitted for admin review.'
      });
    } catch (error) {
      const apiError = error as Error;
      setBanner({ tone: 'error', text: apiError.message });
    } finally {
      setCreatingHostRoleRequest(false);
    }
  }

  const selectedRoomType =
    accommodationDetail?.roomTypes.find((roomType) => roomType.roomTypeId === selectedRoomTypeId) ?? null;

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">guest-web / M4 cancellation flow</p>
          <h1>Search, request, inspect reservation detail, and cancel before cutoff</h1>
          <p className="hero-copy">
            This minimal guest UI now covers search/detail reads, reservation requests, guest
            reservation detail, and guest cancellation before the effective check-in cutoff.
          </p>
        </div>
        <div className="hero-meta">
          <span>Search by region/date/headcount</span>
          <span>PENDING + CONFIRMED consume inventory</span>
          <span>Guest cancellation blocked at check-in time</span>
        </div>
      </header>

      {banner ? <div className={`banner banner-${banner.tone}`}>{banner.text}</div> : null}

      {initializing ? (
        <section className="panel">
          <h2>Checking session</h2>
          <p className="muted">Looking for an existing guest session.</p>
        </section>
      ) : null}

      {!initializing && !user ? (
        <section className="auth-grid">
          <section className="panel narrow">
            <h2>Guest login</h2>
            <p className="muted">Seed account: guest.demo / guestpass123!</p>
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

          <section className="panel narrow">
            <h2>Guest signup</h2>
            <p className="muted">Create a new guest account, then sign in with the new login ID.</p>
            <form className="stack" onSubmit={handleSignup}>
              <label>
                Login ID
                <input
                  value={signupForm.loginId}
                  onChange={(event) =>
                    setSignupForm((current) => ({ ...current, loginId: event.target.value }))
                  }
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={signupForm.password}
                  onChange={(event) =>
                    setSignupForm((current) => ({ ...current, password: event.target.value }))
                  }
                />
              </label>
              <label>
                Name
                <input
                  value={signupForm.name}
                  onChange={(event) =>
                    setSignupForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={signupForm.email}
                  onChange={(event) =>
                    setSignupForm((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </label>
              <label>
                Phone
                <input
                  value={signupForm.phone}
                  onChange={(event) =>
                    setSignupForm((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </label>
              <button type="submit" disabled={signingUp}>
                {signingUp ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          </section>
        </section>
      ) : null}

      {user ? (
        <main className="stack-layout">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Current session</h2>
                  <p className="muted">Authenticated guest context from the Redis-backed session.</p>
              </div>
              <button type="button" className="secondary-button" onClick={handleLogout}>
                Sign out
              </button>
            </div>
            <dl className="definition-list">
              <div>
                <dt>User ID</dt>
                <dd>{user.userId}</dd>
              </div>
              <div>
                <dt>Login ID</dt>
                <dd>{user.loginId}</dd>
              </div>
              <div>
                <dt>Name</dt>
                <dd>{user.name}</dd>
              </div>
                <div>
                  <dt>Role</dt>
                  <dd>{user.role}</dd>
                </div>
              </dl>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Host role request</h2>
                  <p className="muted">
                    Submit a host-role request from the guest account, then wait for admin review in
                    ops-web.
                  </p>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => void loadHostRoleRequestState(true)}
                  disabled={loadingHostRoleRequestState}
                >
                  {loadingHostRoleRequestState ? 'Refreshing...' : 'Refresh request'}
                </button>
              </div>

              <div className="host-role-request-grid">
                <section className="detail-card">
                  <h4>Current state</h4>
                  <p className="detail-line">DB role: {hostRoleRequestState?.currentUserRole ?? user.role}</p>
                  <p
                    className={`cancellation-state ${
                      hostRoleRequestState?.canSubmitNewRequest
                        ? 'cancellation-state-allowed'
                        : 'cancellation-state-blocked'
                    }`}
                  >
                    {hostRoleRequestState?.canSubmitNewRequest
                      ? 'A new host role request can be submitted.'
                      : hostRoleRequestState?.blockedReason ?? 'Host role request is currently blocked.'}
                  </p>
                  <p className="muted">
                    After approval, access should be rechecked with a fresh ops-web login because the
                    current guest session may still hold the old role snapshot.
                  </p>
                </section>

                <section className="detail-card">
                  <h4>Submit request</h4>
                  <label>
                    Request reason
                    <textarea
                      rows={4}
                      value={hostRoleRequestReason}
                      placeholder="Explain why this account needs host access."
                      onChange={(event) => setHostRoleRequestReason(event.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => void handleCreateHostRoleRequest()}
                    disabled={!hostRoleRequestState?.canSubmitNewRequest || creatingHostRoleRequest}
                  >
                    {creatingHostRoleRequest ? 'Submitting...' : 'Request host role'}
                  </button>
                </section>

                <section className="detail-card detail-card-wide">
                  <h4>Latest request</h4>
                  {!hostRoleRequestState?.latestRequest ? (
                    <p className="empty-state">No host role request has been recorded for this account yet.</p>
                  ) : (
                    <div className="history-list">
                      <article className="history-item">
                        <div className="history-header">
                          <strong>
                            {formatHostRoleRequestStatus(hostRoleRequestState.latestRequest.status)}
                          </strong>
                          <span>{formatTimestamp(hostRoleRequestState.latestRequest.createdAt)}</span>
                        </div>
                        <p className="detail-line">{hostRoleRequestState.latestRequest.requestReason}</p>
                        {hostRoleRequestState.latestRequest.reviewedAt ? (
                          <p className="detail-line">
                            Reviewed at {formatTimestamp(hostRoleRequestState.latestRequest.reviewedAt)}
                          </p>
                        ) : null}
                        {hostRoleRequestState.latestRequest.reviewedByLoginId ? (
                          <p className="detail-line">
                            Reviewer {hostRoleRequestState.latestRequest.reviewedByName} (
                            {hostRoleRequestState.latestRequest.reviewedByLoginId})
                          </p>
                        ) : null}
                        {hostRoleRequestState.latestRequest.reviewReason ? (
                          <p className="detail-line history-reason">
                            {hostRoleRequestState.latestRequest.reviewReason}
                          </p>
                        ) : null}
                      </article>
                    </div>
                  )}
                </section>
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Search stays</h2>
                <p className="muted">
                  Minimal SRS read flow for accommodation search, room-type availability, and
                  calendar inspection.
                </p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => void loadSearchResults()}
                disabled={searching}
              >
                {searching ? 'Refreshing...' : 'Refresh search'}
              </button>
            </div>
            <form className="search-form" onSubmit={handleSearchSubmit}>
              <label>
                Region
                <input
                  value={searchForm.region}
                  onChange={(event) =>
                    setSearchForm((current) => ({ ...current, region: event.target.value }))
                  }
                />
              </label>
              <label>
                Guests
                <input
                  type="number"
                  min="1"
                  value={searchForm.guestCount}
                  onChange={(event) =>
                    setSearchForm((current) => ({ ...current, guestCount: event.target.value }))
                  }
                />
              </label>
              <label>
                Check-in
                <input
                  type="date"
                  min={businessToday}
                  value={searchForm.checkInDate}
                  onChange={(event) =>
                    setSearchForm((current) => ({ ...current, checkInDate: event.target.value }))
                  }
                />
              </label>
              <label>
                Check-out
                <input
                  type="date"
                  min={searchForm.checkInDate || businessToday}
                  value={searchForm.checkOutDate}
                  onChange={(event) =>
                    setSearchForm((current) => ({ ...current, checkOutDate: event.target.value }))
                  }
                />
              </label>
              <button type="submit" disabled={searching}>
                {searching ? 'Searching...' : 'Search accommodations'}
              </button>
            </form>
          </section>

          <section className="content-grid">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Search results</h2>
                  <p className="muted">Results are classified to match the frozen baseline and show check-in price preview.</p>
                </div>
              </div>
              {searchResults.length === 0 ? (
                <p className="empty-state">No accommodations match the current search.</p>
              ) : (
                <div className="result-list">
                  {searchResults.map((result) => (
                    <button
                      key={result.accommodationId}
                      type="button"
                      className={`result-card ${
                        result.accommodationId === selectedAccommodationId ? 'result-card-active' : ''
                      }`}
                      onClick={() => void loadAccommodationDetail(result.accommodationId, true)}
                    >
                      <div className="result-card-header">
                        <div>
                          <strong>{result.accommodationName}</strong>
                          <p>{result.region}</p>
                        </div>
                        <span
                          className={`status-pill status-${result.availabilityCategory.toLowerCase()}`}
                        >
                          {formatClassification(result.availabilityCategory)}
                        </span>
                      </div>
                      <div className="result-metrics">
                        <span>Matching room types: {result.matchingRoomTypeCount}</span>
                        <span>Available room types: {result.availableRoomTypeCount}</span>
                        <span>Base from {formatCurrency(result.lowestBasePrice)}</span>
                        <span>Check-in preview from {formatCurrency(result.lowestPreviewPrice)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="panel detail-panel">
              <div className="panel-header">
                <div>
                  <h2>Accommodation detail</h2>
                  <p className="muted">Room-type availability is evaluated for the full stay. Pricing preview uses the check-in night.</p>
                </div>
                {selectedAccommodationId ? (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => void loadAccommodationDetail(selectedAccommodationId, true)}
                    disabled={loadingDetail}
                  >
                    {loadingDetail ? 'Refreshing...' : 'Refresh detail'}
                  </button>
                ) : null}
              </div>

              {!accommodationDetail ? (
                <p className="empty-state">Choose a search result to inspect room types.</p>
              ) : (
                <div className="detail-stack">
                  <div className="detail-summary">
                    <div>
                      <h3>{accommodationDetail.accommodationName}</h3>
                      <p>{accommodationDetail.address}</p>
                      <p>{accommodationDetail.infoText ?? 'No additional property description.'}</p>
                    </div>
                    <div className="summary-meta">
                      <span
                        className={`status-pill status-${accommodationDetail.availabilityCategory.toLowerCase()}`}
                      >
                        {formatClassification(accommodationDetail.availabilityCategory)}
                      </span>
                      <span>Check-in {accommodationDetail.checkInTime}</span>
                      <span>Check-out {accommodationDetail.checkOutTime}</span>
                    </div>
                  </div>

                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Room type</th>
                          <th>Capacity</th>
                          <th>Base price</th>
                          <th>Check-in preview</th>
                          <th>Total rooms</th>
                          <th>Available for stay</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accommodationDetail.roomTypes.map((roomType) => {
                          const canReserve =
                            roomType.matchesGuestCount &&
                            roomType.availabilityCategory === 'AVAILABLE';

                          return (
                            <tr key={roomType.roomTypeId}>
                              <td>{roomType.roomTypeName}</td>
                              <td>
                                {roomType.baseCapacity} - {roomType.maxCapacity} guests
                              </td>
                              <td>{formatCurrency(roomType.basePrice)}</td>
                              <td>{formatCurrency(roomType.previewPrice)}</td>
                              <td>{roomType.totalRoomCount}</td>
                              <td>{roomType.availableRoomCount}</td>
                              <td>
                                <span
                                  className={`status-pill status-${roomType.availabilityCategory.toLowerCase()}`}
                                >
                                  {formatClassification(roomType.availabilityCategory)}
                                </span>
                              </td>
                              <td>
                                <div className="action-row">
                                  <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() =>
                                      void loadCalendar(
                                        accommodationDetail.accommodationId,
                                        roomType.roomTypeId,
                                        true
                                      )
                                    }
                                  >
                                    View calendar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleReserve(roomType.roomTypeId)}
                                    disabled={!canReserve || creatingReservation === roomType.roomTypeId}
                                  >
                                    {creatingReservation === roomType.roomTypeId
                                      ? 'Creating...'
                                      : 'Reserve this room type'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="calendar-panel">
                    <div className="panel-header">
                      <div>
                        <h3>Availability calendar</h3>
                        <p className="muted">
                          {selectedRoomType
                            ? `${selectedRoomType.roomTypeName} for ${searchForm.checkInDate} to ${searchForm.checkOutDate}`
                            : 'Select a room type to inspect daily availability.'}
                        </p>
                      </div>
                      {selectedAccommodationId && selectedRoomTypeId ? (
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            void loadCalendar(selectedAccommodationId, selectedRoomTypeId, true)
                          }
                          disabled={loadingCalendar}
                        >
                          {loadingCalendar ? 'Refreshing...' : 'Refresh calendar'}
                        </button>
                      ) : null}
                    </div>

                    {!calendar ? (
                      <p className="empty-state">No calendar data loaded yet.</p>
                    ) : (
                      <div className="calendar-grid">
                        {calendar.days.map((day) => (
                          <article
                            key={day.date}
                            className={`calendar-card ${day.soldOut ? 'calendar-card-soldout' : ''}`}
                          >
                            <strong>{day.date}</strong>
                            <span>{day.availableRoomCount} rooms free</span>
                            <span>{day.soldOut ? 'Sold out' : 'Available'}</span>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>My reservations</h2>
                <p className="muted">
                  Refresh this list after host review to confirm status reflection in the guest UI.
                </p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => void handleRefreshReservations()}
              >
                {refreshingReservations ? 'Refreshing...' : 'Refresh list'}
              </button>
            </div>
            {reservations.length === 0 ? (
              <p className="empty-state">No reservations yet.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Reservation No</th>
                      <th>Accommodation</th>
                      <th>Room type</th>
                      <th>Stay</th>
                      <th>Status</th>
                      <th>Requested</th>
                      <th>Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((reservation) => (
                      <tr key={reservation.reservationId}>
                        <td>{reservation.reservationNo}</td>
                        <td>{reservation.accommodationName}</td>
                        <td>{reservation.roomTypeName}</td>
                        <td>
                          {reservation.checkInDate} to {reservation.checkOutDate}
                        </td>
                        <td>
                          <span className={`status-pill status-${reservation.status.toLowerCase()}`}>
                            {reservation.status}
                          </span>
                        </td>
                        <td>{new Date(reservation.requestedAt).toLocaleString('ko-KR')}</td>
                        <td>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => void handleOpenReservationDetail(reservation.reservationId, true)}
                          >
                            Open detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="reservation-detail-shell">
              <div className="panel-header">
                <div>
                  <h3>Reservation detail</h3>
                  <p className="muted">
                    M4 guest detail + cancellation slice with guest-safe nightly info and cutoff checks.
                  </p>
                </div>
                {selectedReservationId ? (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => void handleOpenReservationDetail(selectedReservationId, true)}
                    disabled={loadingReservationDetail}
                  >
                    {loadingReservationDetail ? 'Refreshing...' : 'Refresh detail'}
                  </button>
                ) : null}
              </div>

              {!reservationDetail ? (
                <p className="empty-state">Open one reservation from the list to inspect the detail view.</p>
              ) : (
                <div className="reservation-detail-grid">
                  <section className="detail-card">
                    <h4>Core fields</h4>
                    <dl className="definition-list reservation-definition-list">
                      <div>
                        <dt>Reservation No</dt>
                        <dd>{reservationDetail.reservationNo}</dd>
                      </div>
                      <div>
                        <dt>Status</dt>
                        <dd>
                          <span className={`status-pill status-${reservationDetail.status.toLowerCase()}`}>
                            {reservationDetail.status}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt>Check-in</dt>
                        <dd>{reservationDetail.checkInDate}</dd>
                      </div>
                      <div>
                        <dt>Check-out</dt>
                        <dd>{reservationDetail.checkOutDate}</dd>
                      </div>
                      <div>
                        <dt>Requested</dt>
                        <dd>{formatTimestamp(reservationDetail.requestedAt)}</dd>
                      </div>
                      <div>
                        <dt>Confirmed</dt>
                        <dd>{formatTimestamp(reservationDetail.confirmedAt)}</dd>
                      </div>
                      <div>
                        <dt>Cancelled</dt>
                        <dd>{formatTimestamp(reservationDetail.cancelledAt)}</dd>
                      </div>
                    </dl>
                  </section>

                  <section className="detail-card">
                    <h4>Accommodation summary</h4>
                    <p className="detail-line">
                      <strong>{reservationDetail.accommodation.accommodationName}</strong>
                    </p>
                    <p className="detail-line">{reservationDetail.accommodation.region}</p>
                    <p className="detail-line">{reservationDetail.accommodation.address}</p>
                    <h4>Room type summary</h4>
                    <p className="detail-line">{reservationDetail.roomType.roomTypeName}</p>
                  </section>

                  <section className="detail-card">
                    <h4>Nightly stay rows</h4>
                    <div className="night-chip-list">
                      {reservationDetail.nights.map((night) => (
                        <span key={night.reservationNightId} className="night-chip">
                          {night.stayDate}
                        </span>
                      ))}
                    </div>
                    <p className="muted">
                      Actual room number stays hidden in the guest view per the frozen baseline.
                    </p>
                  </section>

                  <section className="detail-card">
                    <h4>Cancellation</h4>
                    <p className="detail-line">
                      Effective cutoff: {formatTimestamp(reservationDetail.cancellationCutoffAt)}
                    </p>
                    <p
                      className={`cancellation-state ${
                        reservationDetail.cancellationAllowed
                          ? 'cancellation-state-allowed'
                          : 'cancellation-state-blocked'
                      }`}
                    >
                      {reservationDetail.cancellationAllowed
                        ? 'Cancellation is currently allowed.'
                        : reservationDetail.cancellationBlockedReason ?? 'Cancellation is currently blocked.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleCancelReservation()}
                      disabled={!reservationDetail.cancellationAllowed || cancellingReservation}
                    >
                      {cancellingReservation ? 'Cancelling...' : 'Cancel reservation'}
                    </button>
                  </section>

                  <section className="detail-card detail-card-wide">
                    <h4>Status history</h4>
                    {reservationDetail.statusHistory.length === 0 ? (
                      <p className="empty-state">No status events recorded yet.</p>
                    ) : (
                      <div className="history-list">
                        {reservationDetail.statusHistory.map((event) => (
                          <article key={`${event.actionType}-${event.changedAt}`} className="history-item">
                            <div className="history-header">
                              <strong>{formatReservationAction(event.actionType)}</strong>
                              <span>{formatTimestamp(event.changedAt)}</span>
                            </div>
                            <p className="detail-line">
                              {event.fromStatus ? `${event.fromStatus} -> ${event.toStatus}` : event.toStatus}
                            </p>
                            {event.reasonText ? (
                              <p className="detail-line history-reason">{event.reasonText}</p>
                            ) : null}
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              )}
            </div>
          </section>
        </main>
      ) : null}
    </div>
  );
}

export default App;
