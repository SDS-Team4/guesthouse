import { FormEvent, useEffect, useMemo, useState } from 'react';

import { OpsShell } from './components/ops/OpsShell';
import { apiRequest } from './lib/api';
import {
  blockReasonOptions,
  buildAdminHostRoleRequestsEndpoint,
  buildDayOfWeekMask,
  buildHostAccommodationDetailEndpoint,
  buildPricePoliciesEndpoint,
  buildReservationCalendarEndpoint,
  buildRoomBlocksEndpoint,
  formatHostRoleRequestStatusFilter,
  formatStatusFilter,
  reservationDetailToSummary
} from './lib/format';
import type {
  AccommodationDetail,
  AccommodationSummary,
  AdminHostRoleRequest,
  AdminHostRoleRequestDecisionResponse,
  AdminTermDetail,
  AdminTermMutationResponse,
  AdminTermSummary,
  AdminPageKey,
  AdminUserDetail,
  AdminUserSummary,
  AssetMutationResponse,
  AuthenticatedUser,
  BannerState,
  HostPageKey,
  HostRoleRequestStatusFilter,
  OpsNavItem,
  OpsPageKey,
  PricePolicyManagement,
  PricePolicyMutationResponse,
  ReservationCalendarView,
  ReservationDecisionResponse,
  ReservationDetail,
  ReservationNightSwapResponse,
  ReservationReassignmentResponse,
  ReservationSummary,
  RoomBlockManagement,
  RoomBlockMutationResponse,
  RoomBlockReasonType,
  StatusFilter
} from './lib/types';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminRoleRequestsPage } from './pages/admin/AdminRoleRequestsPage';
import { AdminTermsPage } from './pages/admin/AdminTermsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { HostPropertiesPage } from './pages/host/HostPropertiesPage';
import { HostReservationCalendarPage } from './pages/host/HostReservationCalendarPage';
import { HostDashboardPage } from './pages/host/HostDashboardPage';
import { LoginPage } from './pages/ops/LoginPage';
import { PricingPage } from './pages/ops/PricingPage';
import { ReservationDetailPage } from './pages/ops/ReservationDetailPage';
import { ReservationsPage } from './pages/ops/ReservationsPage';
import { RoomBlocksPage } from './pages/ops/RoomBlocksPage';

const hostNavItems: OpsNavItem[] = [
  { key: 'reservation-calendar', label: 'Calendar' },
  { key: 'reservations', label: 'Reservations' },
  { key: 'properties', label: 'Properties' },
  { key: 'room-blocks', label: 'Room blocks' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'dashboard', label: 'Dashboard' }
];

const adminNavItems: OpsNavItem[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'users', label: 'Users' },
  { key: 'role-requests', label: 'Role requests' },
  { key: 'terms', label: 'Terms' },
  { key: 'reservations', label: 'Reservations' },
  { key: 'room-blocks', label: 'Room blocks' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'reservation-detail', label: 'Reservation detail' }
];

function App() {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [currentPage, setCurrentPage] = useState<OpsPageKey>('dashboard');
  const [accommodations, setAccommodations] = useState<AccommodationSummary[]>([]);
  const [selectedAccommodationId, setSelectedAccommodationId] = useState<number | null>(null);
  const [accommodationDetail, setAccommodationDetail] = useState<AccommodationDetail | null>(null);
  const [creatingAccommodation, setCreatingAccommodation] = useState(false);
  const [loadingAccommodations, setLoadingAccommodations] = useState(false);
  const [loadingAccommodationDetail, setLoadingAccommodationDetail] = useState(false);
  const [mutatingAssetId, setMutatingAssetId] = useState<string | null>(null);
  const [reservationCalendar, setReservationCalendar] = useState<ReservationCalendarView | null>(null);
  const [reservations, setReservations] = useState<ReservationSummary[]>([]);
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null);
  const [reservationDetail, setReservationDetail] = useState<ReservationDetail | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');
  const [banner, setBanner] = useState<BannerState>(null);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [initializing, setInitializing] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingReservationCalendar, setLoadingReservationCalendar] = useState(false);
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
  const [adminTerms, setAdminTerms] = useState<AdminTermSummary[]>([]);
  const [selectedAdminTermId, setSelectedAdminTermId] = useState<number | null>(null);
  const [adminTermDetail, setAdminTermDetail] = useState<AdminTermDetail | null>(null);
  const [loadingAdminTerms, setLoadingAdminTerms] = useState(false);
  const [loadingAdminTermDetail, setLoadingAdminTermDetail] = useState(false);
  const [creatingTermDraftId, setCreatingTermDraftId] = useState<number | null>(null);
  const [savingAdminTermId, setSavingAdminTermId] = useState<number | null>(null);
  const [publishingAdminTermId, setPublishingAdminTermId] = useState<number | null>(null);
  const [calendarStartDate, setCalendarStartDate] = useState(
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())
  );

  useEffect(() => {
    void bootstrapSession();
  }, []);

  const isAdmin = user?.role === 'ADMIN';
  const navItems = useMemo(() => (isAdmin ? adminNavItems : hostNavItems), [isAdmin]);
  const selectedReservationSummary =
    selectedReservationId === null
      ? null
      : reservations.find((reservation) => reservation.reservationId === selectedReservationId) ??
        (reservationDetail ? reservationDetailToSummary(reservationDetail) : null);
  const roomBlockReasonChoices = blockReasonOptions(user?.role);

  async function bootstrapSession() {
    setInitializing(true);
    try {
      const currentUser = await apiRequest<AuthenticatedUser>('/api/v1/auth/me', { method: 'GET' });
      setUser(currentUser);
      setCurrentPage(currentUser.role === 'ADMIN' ? 'dashboard' : 'reservation-calendar');
      await loadReservations(false, statusFilter);
      await loadRoomBlocks(false, null, null, currentUser);
      await loadPricePolicies(false, null, null);
      if (currentUser.role === 'ADMIN') {
        await Promise.all([loadAdminUsers(false), loadHostRoleRequests(false, hostRoleRequestFilter), loadAdminTerms(false)]);
      } else {
        await Promise.all([loadReservationCalendar(false, null, calendarStartDate), loadAccommodations(false)]);
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
    setCurrentPage('dashboard');
    setAccommodations([]);
    setSelectedAccommodationId(null);
    setAccommodationDetail(null);
    setCreatingAccommodation(false);
    setLoadingAccommodations(false);
    setLoadingAccommodationDetail(false);
    setMutatingAssetId(null);
    setReservationCalendar(null);
    setStatusFilter('PENDING');
    setReservations([]);
    setSelectedReservationId(null);
    setReservationDetail(null);
    setRefreshing(false);
    setLoadingReservationCalendar(false);
    setLoadingDetail(false);
    setRejectReasons({});
    setReassignmentSelections({});
    setDecisioningReservationId(null);
    setReassigningNightId(null);
    setRoomBlockManagement(null);
    setLoadingRoomBlocks(false);
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
    setAdminTerms([]);
    setSelectedAdminTermId(null);
    setAdminTermDetail(null);
    setLoadingAdminTerms(false);
    setLoadingAdminTermDetail(false);
    setCreatingTermDraftId(null);
    setSavingAdminTermId(null);
    setPublishingAdminTermId(null);
    setLoginId('');
    setPassword('');
    setCalendarStartDate(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date()));
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

  async function loadReservationDetail(reservationId: number, showBanner = false, navigateToDetail = true) {
    setLoadingDetail(true);
    try {
      const data = await apiRequest<ReservationDetail>(`/api/v1/reservations/${reservationId}`, { method: 'GET' });
      setSelectedReservationId(reservationId);
      setReservationDetail(data);
      if (navigateToDetail) {
        setCurrentPage('reservation-detail');
      }
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

  async function loadReservationCalendar(
    showBanner = true,
    accommodationId: number | null = reservationCalendar?.selectedAccommodationId ?? null,
    startDate = calendarStartDate,
    keepCurrentSelection = true
  ) {
    setLoadingReservationCalendar(true);
    try {
      const data = await apiRequest<ReservationCalendarView>(buildReservationCalendarEndpoint(accommodationId, startDate, 365), {
        method: 'GET'
      });
      setReservationCalendar(data);
      setCalendarStartDate(data.startDate);

      const nextSelectedReservationId =
        keepCurrentSelection && selectedReservationId !== null && data.reservations.some((item) => item.reservationId === selectedReservationId)
          ? selectedReservationId
          : data.reservations[0]?.reservationId ?? null;

      if (nextSelectedReservationId === null) {
        setSelectedReservationId(null);
        setReservationDetail(null);
      } else {
        await loadReservationDetail(nextSelectedReservationId, false, false);
      }

      if (showBanner) {
        setBanner({ tone: 'info', text: 'Reservation calendar refreshed.' });
      }
    } finally {
      setLoadingReservationCalendar(false);
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

  async function loadPricePolicies(showBanner = true, accommodationId: number | null = null, roomTypeId: number | null = null) {
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

  async function loadAccommodations(showBanner = true) {
    setLoadingAccommodations(true);
    try {
      const data = await apiRequest<AccommodationSummary[]>('/api/v1/host/accommodations', { method: 'GET' });
      setAccommodations(data);
      const nextAccommodationId =
        selectedAccommodationId !== null && data.some((item) => item.accommodationId === selectedAccommodationId)
          ? selectedAccommodationId
          : data[0]?.accommodationId ?? null;
      const selectionChanged = nextAccommodationId !== selectedAccommodationId;
      setSelectedAccommodationId(nextAccommodationId);
      if (nextAccommodationId !== null) {
        setCreatingAccommodation(false);
        if (selectionChanged) {
          setAccommodationDetail(null);
        }
        await loadAccommodationDetail(nextAccommodationId, false);
      } else {
        setAccommodationDetail(null);
      }
      if (showBanner) {
        setBanner({ tone: 'info', text: 'Properties refreshed.' });
      }
    } finally {
      setLoadingAccommodations(false);
    }
  }

  async function loadAccommodationDetail(accommodationId: number, showBanner = false) {
    setLoadingAccommodationDetail(true);
    try {
      const data = await apiRequest<AccommodationDetail>(buildHostAccommodationDetailEndpoint(accommodationId), { method: 'GET' });
      setSelectedAccommodationId(accommodationId);
      setAccommodationDetail(data);
      setCreatingAccommodation(false);
      if (showBanner) {
        setBanner({ tone: 'info', text: `Property ${data.name} refreshed.` });
      }
    } finally {
      setLoadingAccommodationDetail(false);
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
      const data = await apiRequest<AdminHostRoleRequest[]>(buildAdminHostRoleRequestsEndpoint(filter), { method: 'GET' });
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

  async function loadAdminTerms(showBanner = true) {
    setLoadingAdminTerms(true);
    try {
      const data = await apiRequest<AdminTermSummary[]>('/api/v1/admin/terms', { method: 'GET' });
      setAdminTerms(data);
      const nextSelectedTermId =
        selectedAdminTermId !== null && data.some((item) => item.termId === selectedAdminTermId)
          ? selectedAdminTermId
          : data[0]?.termId ?? null;
      if (nextSelectedTermId !== null) {
        await loadAdminTermDetail(nextSelectedTermId, false);
      } else {
        setSelectedAdminTermId(null);
        setAdminTermDetail(null);
      }
      if (showBanner) {
        setBanner({ tone: 'info', text: 'Admin terms refreshed.' });
      }
    } finally {
      setLoadingAdminTerms(false);
    }
  }

  async function loadAdminTermDetail(termId: number, showBanner = false) {
    setLoadingAdminTermDetail(true);
    try {
      const data = await apiRequest<AdminTermDetail>(`/api/v1/admin/terms/${termId}`, { method: 'GET' });
      setSelectedAdminTermId(termId);
      setAdminTermDetail(data);
      if (showBanner) {
        setBanner({ tone: 'info', text: `Term v${data.version} refreshed.` });
      }
    } finally {
      setLoadingAdminTermDetail(false);
    }
  }

  async function refreshListAndDetail(nextFilter = statusFilter) {
    await loadReservations(false, nextFilter);
    if (selectedReservationId !== null) {
      await loadReservationDetail(selectedReservationId, false, false);
    }
  }

  async function refreshHostCalendar(
    accommodationId: number | null = reservationCalendar?.selectedAccommodationId ?? null,
    startDate = calendarStartDate
  ) {
    if (isAdmin || !user) {
      return;
    }

    await loadReservationCalendar(false, accommodationId, startDate);
  }

  async function refreshRoomBlocksAndDetail(
    accommodationId: number | null = blockAccommodationId ? Number(blockAccommodationId) : null,
    roomId: number | null = blockRoomFilterId === 'ALL' ? null : Number(blockRoomFilterId)
  ) {
    await loadRoomBlocks(false, accommodationId, roomId);
    if (selectedReservationId !== null) {
      await loadReservationDetail(selectedReservationId, false, false);
    }
    await refreshHostCalendar(accommodationId, calendarStartDate);
  }

  async function refreshPricePoliciesAndDetail(
    accommodationId: number | null = pricingAccommodationId ? Number(pricingAccommodationId) : null,
    roomTypeId: number | null = pricingRoomTypeFilterId === 'ALL' ? null : Number(pricingRoomTypeFilterId)
  ) {
    await loadPricePolicies(false, accommodationId, roomTypeId);
    if (selectedReservationId !== null) {
      await loadReservationDetail(selectedReservationId, false, false);
    }
  }

  async function refreshAdminContext(nextFilter = hostRoleRequestFilter) {
    if (!isAdmin) {
      return;
    }

    await Promise.all([loadAdminUsers(false), loadHostRoleRequests(false, nextFilter), loadAdminTerms(false)]);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoggingIn(true);
    setBanner(null);

    try {
      const nextUser = await apiRequest<AuthenticatedUser>('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          loginId,
          password
        })
      });

      setUser(nextUser);
      setCurrentPage(nextUser.role === 'ADMIN' ? 'dashboard' : 'reservation-calendar');
      await loadReservations(false, statusFilter);
      await loadRoomBlocks(false, null, null, nextUser);
      await loadPricePolicies(false, null, null);
      if (nextUser.role === 'ADMIN') {
        await Promise.all([loadAdminUsers(false), loadHostRoleRequests(false, hostRoleRequestFilter), loadAdminTerms(false)]);
      } else {
        await Promise.all([loadReservationCalendar(false, null, calendarStartDate, false), loadAccommodations(false)]);
      }
      setBanner({
        tone: 'success',
        text: `${nextUser.role === 'ADMIN' ? 'Admin' : 'Host'} session ready for ${nextUser.name}.`
      });
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    try {
      await apiRequest('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      // Best-effort logout; local state should still clear.
    }

    resetOpsState();
    setBanner({ tone: 'info', text: 'Signed out.' });
  }

  async function handleHostRoleRequestFilterChange(filter: HostRoleRequestStatusFilter) {
    setHostRoleRequestFilter(filter);
    try {
      await loadHostRoleRequests(true, filter);
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    }
  }

  async function handleFilterChange(filter: StatusFilter) {
    setStatusFilter(filter);
    try {
      await loadReservations(true, filter);
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    }
  }

  async function handleOpenDetail(reservationId: number) {
    try {
      await loadReservationDetail(reservationId, true);
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    }
  }

  async function handleOpenReservationInCalendar(reservation: ReservationSummary) {
    setCurrentPage('reservation-calendar');
    setCalendarStartDate(reservation.checkInDate);

    try {
      await loadReservationCalendar(false, reservation.accommodationId, reservation.checkInDate, false);
      await loadReservationDetail(reservation.reservationId, false, false);
      setBanner({ tone: 'info', text: `Reservation ${reservation.reservationNo} opened in calendar.` });
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    }
  }

  async function handleApprove(reservation: ReservationSummary) {
    setDecisioningReservationId(reservation.reservationId);
    try {
      const data = await apiRequest<ReservationDecisionResponse>(`/api/v1/reservations/${reservation.reservationId}/approve`, {
        method: 'POST'
      });
      await refreshListAndDetail();
      await refreshHostCalendar();
      setBanner({ tone: 'success', text: `Reservation ${data.reservationNo} approved.` });
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    } finally {
      setDecisioningReservationId(null);
    }
  }

  async function handleReject(reservation: ReservationSummary) {
    setDecisioningReservationId(reservation.reservationId);
    try {
      const reasonText = (rejectReasons[reservation.reservationId] ?? '').trim();
      const data = await apiRequest<ReservationDecisionResponse>(`/api/v1/reservations/${reservation.reservationId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: reasonText ? JSON.stringify({ reasonText }) : undefined
      });
      setRejectReasons((current) => ({ ...current, [reservation.reservationId]: '' }));
      await refreshListAndDetail();
      await refreshHostCalendar();
      setBanner({ tone: 'success', text: `Reservation ${data.reservationNo} rejected.` });
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    } finally {
      setDecisioningReservationId(null);
    }
  }

  async function handleCancel(reservation: ReservationSummary, reasonText: string) {
    const normalizedReasonText = reasonText.trim();
    if (!normalizedReasonText) {
      setBanner({ tone: 'error', text: 'Enter a cancellation reason before cancelling the reservation.' });
      return;
    }
    if (!window.confirm(`Cancel reservation ${reservation.reservationNo}?`)) {
      return;
    }

    setDecisioningReservationId(reservation.reservationId);
    try {
      const data = await apiRequest<ReservationDecisionResponse>(`/api/v1/reservations/${reservation.reservationId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reasonText: normalizedReasonText })
      });
      await refreshListAndDetail();
      await refreshHostCalendar();
      setBanner({ tone: 'success', text: `Reservation ${data.reservationNo} cancelled.` });
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    } finally {
      setDecisioningReservationId(null);
    }
  }

  async function handleReassignNight(night: ReservationDetail['nights'][number]) {
    if (!reservationDetail) {
      return;
    }

    const assignedRoomId = reassignmentSelections[night.reservationNightId];
    if (!assignedRoomId) {
      setBanner({ tone: 'error', text: 'Choose one replacement room before reassigning.' });
      return;
    }

    setReassigningNightId(night.reservationNightId);
    try {
      const data = await apiRequest<ReservationReassignmentResponse>(`/api/v1/reservations/${reservationDetail.reservationId}/reassign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          changes: [
            {
              reservationNightId: night.reservationNightId,
              assignedRoomId: Number(assignedRoomId)
            }
          ]
        })
      });
      await refreshListAndDetail();
      await refreshHostCalendar();
      setBanner({
        tone: 'success',
        text: `${data.changedNightCount} night updated for reservation ${data.reservationNo}.`
      });
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    } finally {
      setReassigningNightId(null);
    }
  }

  async function handleCalendarReassignNight(
    assignmentCell: ReservationCalendarView['assignmentCells'][number],
    targetRoomId: number
  ) {
    setReassigningNightId(assignmentCell.reservationNightId);
    try {
      const data = await apiRequest<ReservationReassignmentResponse>(
        `/api/v1/reservations/${assignmentCell.reservationId}/reassign`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            changes: [
              {
                reservationNightId: assignmentCell.reservationNightId,
                assignedRoomId: targetRoomId
              }
            ]
          })
        }
      );
      await refreshListAndDetail();
      await refreshHostCalendar();
      setBanner({
        tone: 'success',
        text: `${data.changedNightCount} night updated for reservation ${data.reservationNo}.`
      });
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    } finally {
      setReassigningNightId(null);
    }
  }

  async function handleCalendarSwapNights(
    sourceCell: ReservationCalendarView['assignmentCells'][number],
    targetCell: ReservationCalendarView['assignmentCells'][number]
  ) {
    setReassigningNightId(sourceCell.reservationNightId);
    try {
      const data = await apiRequest<ReservationNightSwapResponse>('/api/v1/reservations/swap-nights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sourceReservationId: sourceCell.reservationId,
          sourceReservationNightId: sourceCell.reservationNightId,
          targetReservationId: targetCell.reservationId,
          targetReservationNightId: targetCell.reservationNightId
        })
      });
      await refreshListAndDetail();
      await refreshHostCalendar();
      setBanner({
        tone: 'success',
        text: `Swapped ${data.sourceReservationNo} and ${data.targetReservationNo} for ${data.stayDate}.`
      });
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    } finally {
      setReassigningNightId(null);
    }
  }

  async function handleCalendarAccommodationChange(value: string) {
    try {
      await loadReservationCalendar(true, Number(value), calendarStartDate, false);
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    }
  }

  async function handleCalendarStartDateChange(value: string) {
    setCalendarStartDate(value);
    try {
      await loadReservationCalendar(true, reservationCalendar?.selectedAccommodationId ?? null, value, false);
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    }
  }

  async function handleCalendarReservationSelect(reservationId: number) {
    try {
      await loadReservationDetail(reservationId, false, false);
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    }
  }

  async function handleSelectAccommodation(accommodationId: number) {
    setCreatingAccommodation(false);
    setSelectedAccommodationId(accommodationId);
    setAccommodationDetail(null);

    try {
      await loadAccommodationDetail(accommodationId, false);
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    }
  }

  function handleStartCreateAccommodation() {
    setCreatingAccommodation(true);
    setSelectedAccommodationId(null);
    setAccommodationDetail(null);
  }

  async function handleCreateAccommodation(form: {
    name: string;
    region: string;
    address: string;
    infoText: string;
    checkInTime: string;
    checkOutTime: string;
  }) {
    setMutatingAssetId('accommodation-new');
    try {
      const response = await apiRequest<AssetMutationResponse>('/api/v1/host/accommodations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      setCreatingAccommodation(false);
      await loadAccommodations(false);
      await loadAccommodationDetail(response.assetId, false);
      setCurrentPage('properties');
      setBanner({ tone: 'success', text: `Property ${response.assetName} created.` });
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    } finally {
      setMutatingAssetId(null);
    }
  }

  async function handleUpdateAccommodation(
    accommodationId: number,
    form: {
      name: string;
      region: string;
      address: string;
      infoText: string;
      checkInTime: string;
      checkOutTime: string;
    }
  ) {
    setMutatingAssetId(`accommodation-${accommodationId}`);
    try {
      const response = await apiRequest<AssetMutationResponse>(`/api/v1/host/accommodations/${accommodationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      await loadAccommodations(false);
      await loadAccommodationDetail(accommodationId, false);
      setBanner({ tone: 'success', text: `Property ${response.assetName} updated.` });
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    } finally {
      setMutatingAssetId(null);
    }
  }

  async function handleDeactivateAccommodation(accommodationId: number) {
    if (!window.confirm('Deactivate this property? Active reservations must already be cleared.')) {
      return;
    }

    setMutatingAssetId(`accommodation-${accommodationId}`);
    try {
      const response = await apiRequest<AssetMutationResponse>(`/api/v1/host/accommodations/${accommodationId}/deactivate`, {
        method: 'POST'
      });
      await loadAccommodations(false);
      setBanner({ tone: 'success', text: `Property ${response.assetName} deactivated.` });
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    } finally {
      setMutatingAssetId(null);
    }
  }

  async function handleCreateRoomType(
    accommodationId: number,
    form: { name: string; baseCapacity: string; maxCapacity: string; basePrice: string }
  ) {
    setMutatingAssetId(`room-type-new-${accommodationId}`);
    try {
      const response = await apiRequest<AssetMutationResponse>(`/api/v1/host/accommodations/${accommodationId}/room-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          baseCapacity: Number(form.baseCapacity),
          maxCapacity: Number(form.maxCapacity),
          basePrice: Number(form.basePrice)
        })
      });
      await loadAccommodationDetail(accommodationId, false);
      await loadAccommodations(false);
      setBanner({ tone: 'success', text: `Room type ${response.assetName} created.` });
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    } finally {
      setMutatingAssetId(null);
    }
  }

  async function handleUpdateRoomType(
    roomTypeId: number,
    form: { name: string; baseCapacity: string; maxCapacity: string; basePrice: string }
  ) {
    setMutatingAssetId(`room-type-${roomTypeId}`);
    try {
      const response = await apiRequest<AssetMutationResponse>(`/api/v1/host/room-types/${roomTypeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          baseCapacity: Number(form.baseCapacity),
          maxCapacity: Number(form.maxCapacity),
          basePrice: Number(form.basePrice)
        })
      });
      if (selectedAccommodationId !== null) {
        await loadAccommodationDetail(selectedAccommodationId, false);
      }
      await loadAccommodations(false);
      setBanner({ tone: 'success', text: `Room type ${response.assetName} updated.` });
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    } finally {
      setMutatingAssetId(null);
    }
  }

  async function handleDeactivateRoomType(roomTypeId: number) {
    if (!window.confirm('Deactivate this room type? Existing future reservations must already be resolved.')) {
      return;
    }

    setMutatingAssetId(`room-type-${roomTypeId}`);
    try {
      const response = await apiRequest<AssetMutationResponse>(`/api/v1/host/room-types/${roomTypeId}/deactivate`, {
        method: 'POST'
      });
      if (selectedAccommodationId !== null) {
        await loadAccommodationDetail(selectedAccommodationId, false);
      }
      await loadAccommodations(false);
      setBanner({ tone: 'success', text: `Room type ${response.assetName} deactivated.` });
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    } finally {
      setMutatingAssetId(null);
    }
  }

  async function handleCreateRoom(
    accommodationId: number,
    form: { roomTypeId: string; roomCode: string; status: string; memo: string }
  ) {
    setMutatingAssetId(`room-new-${accommodationId}`);
    try {
      const response = await apiRequest<AssetMutationResponse>(`/api/v1/host/accommodations/${accommodationId}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomTypeId: Number(form.roomTypeId),
          roomCode: form.roomCode,
          status: form.status,
          memo: form.memo
        })
      });
      await loadAccommodationDetail(accommodationId, false);
      await loadAccommodations(false);
      setBanner({ tone: 'success', text: `Room ${response.assetName} created.` });
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    } finally {
      setMutatingAssetId(null);
    }
  }

  async function handleUpdateRoom(
    roomId: number,
    form: { roomCode: string; status: string; memo: string }
  ) {
    setMutatingAssetId(`room-${roomId}`);
    try {
      const response = await apiRequest<AssetMutationResponse>(`/api/v1/host/rooms/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (selectedAccommodationId !== null) {
        await loadAccommodationDetail(selectedAccommodationId, false);
      }
      await loadAccommodations(false);
      await refreshHostCalendar();
      setBanner({ tone: 'success', text: `Room ${response.assetName} updated.` });
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    } finally {
      setMutatingAssetId(null);
    }
  }

  async function handleDeactivateRoom(roomId: number) {
    if (!window.confirm('Deactivate this room? Future nightly assignments must already be cleared.')) {
      return;
    }

    setMutatingAssetId(`room-${roomId}`);
    try {
      const response = await apiRequest<AssetMutationResponse>(`/api/v1/host/rooms/${roomId}/deactivate`, {
        method: 'POST'
      });
      if (selectedAccommodationId !== null) {
        await loadAccommodationDetail(selectedAccommodationId, false);
      }
      await loadAccommodations(false);
      await refreshHostCalendar();
      setBanner({ tone: 'success', text: `Room ${response.assetName} deactivated.` });
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    } finally {
      setMutatingAssetId(null);
    }
  }

  function openPropertyCalendar(accommodationId: number) {
    setCurrentPage('reservation-calendar');
    void loadReservationCalendar(false, accommodationId, calendarStartDate, false);
  }

  function openPropertyPricing(accommodationId: number) {
    setCurrentPage('pricing');
    setPricingAccommodationId(String(accommodationId));
    setPricingRoomTypeFilterId('ALL');
    void loadPricePolicies(false, accommodationId, null);
  }

  function openPropertyBlocks(accommodationId: number) {
    setCurrentPage('room-blocks');
    setBlockAccommodationId(String(accommodationId));
    setBlockRoomFilterId('ALL');
    void loadRoomBlocks(false, accommodationId, null);
  }

  async function handleAccommodationBlockFilterChange(value: string) {
    setBlockAccommodationId(value);
    setBlockRoomFilterId('ALL');
    try {
      await loadRoomBlocks(true, Number(value), null);
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    }
  }

  async function handleAccommodationPricingFilterChange(value: string) {
    setPricingAccommodationId(value);
    setPricingRoomTypeFilterId('ALL');
    try {
      await loadPricePolicies(true, Number(value), null);
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    }
  }

  async function handleRoomTypePricingFilterChange(value: string) {
    setPricingRoomTypeFilterId(value);
    try {
      await loadPricePolicies(true, pricingAccommodationId ? Number(pricingAccommodationId) : null, value === 'ALL' ? null : Number(value));
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    }
  }

  async function handleRoomBlockFilterChange(value: string) {
    setBlockRoomFilterId(value);
    try {
      await loadRoomBlocks(true, blockAccommodationId ? Number(blockAccommodationId) : null, value === 'ALL' ? null : Number(value));
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    }
  }

  async function handleCreateRoomBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatingRoomBlock(true);

    try {
      const data = await apiRequest<RoomBlockMutationResponse>('/api/v1/room-blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomId: Number(newBlockRoomId),
          startDate: newBlockStartDate,
          endDate: newBlockEndDate,
          reasonType: newBlockReasonType,
          reasonText: newBlockReasonText.trim() || null
        })
      });
      setNewBlockStartDate('');
      setNewBlockEndDate('');
      setNewBlockReasonText('');
      await refreshRoomBlocksAndDetail();
      setBanner({ tone: 'success', text: `Room block ${data.blockId} created for ${data.roomCode}.` });
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    } finally {
      setCreatingRoomBlock(false);
    }
  }

  async function handleDeactivateRoomBlock(blockId: number) {
    if (!window.confirm(`Deactivate room block ${blockId}?`)) {
      return;
    }

    setDeactivatingBlockId(blockId);
    try {
      const data = await apiRequest<RoomBlockMutationResponse>(`/api/v1/room-blocks/${blockId}/deactivate`, {
        method: 'POST'
      });
      await refreshRoomBlocksAndDetail();
      setBanner({ tone: 'success', text: `Room block ${data.blockId} deactivated.` });
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    } finally {
      setDeactivatingBlockId(null);
    }
  }

  function toggleNewPolicyDayBit(bit: number) {
    setNewPolicyDayBits((current) => (current.includes(bit) ? current.filter((item) => item !== bit) : [...current, bit].sort((a, b) => a - b)));
  }

  async function handleCreatePricePolicy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatingPricePolicy(true);

    try {
      const data = await apiRequest<PricePolicyMutationResponse>('/api/v1/price-policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomTypeId: Number(newPolicyRoomTypeId),
          policyName: newPolicyName,
          startDate: newPolicyStartDate,
          endDate: newPolicyEndDate,
          deltaAmount: Number(newPolicyDeltaAmount),
          dayOfWeekMask: buildDayOfWeekMask(newPolicyDayBits)
        })
      });
      setNewPolicyName('');
      setNewPolicyStartDate('');
      setNewPolicyEndDate('');
      setNewPolicyDeltaAmount('');
      setNewPolicyDayBits([]);
      await refreshPricePoliciesAndDetail();
      setBanner({ tone: 'success', text: `Price policy ${data.policyName} created.` });
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    } finally {
      setCreatingPricePolicy(false);
    }
  }

  async function handleApproveHostRoleRequest(request: AdminHostRoleRequest) {
    setReviewingHostRoleRequestId(request.requestId);
    try {
      const reviewReason = adminReviewReason.trim();
      const data = await apiRequest<AdminHostRoleRequestDecisionResponse>(
        `/api/v1/admin/host-role-requests/${request.requestId}/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: reviewReason ? JSON.stringify({ reviewReason }) : undefined
        }
      );
      setAdminReviewReason('');
      await refreshAdminContext();
      await loadHostRoleRequestDetail(request.requestId, false);
      setBanner({ tone: 'success', text: `Host role request ${data.requestId} approved.` });
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    } finally {
      setReviewingHostRoleRequestId(null);
    }
  }

  async function handleRejectHostRoleRequest(request: AdminHostRoleRequest) {
    const reviewReason = adminReviewReason.trim();
    if (!reviewReason) {
      setBanner({ tone: 'error', text: 'A review reason is required to reject a host role request.' });
      return;
    }

    setReviewingHostRoleRequestId(request.requestId);
    try {
      const data = await apiRequest<AdminHostRoleRequestDecisionResponse>(
        `/api/v1/admin/host-role-requests/${request.requestId}/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reviewReason })
        }
      );
      setAdminReviewReason('');
      await refreshAdminContext();
      await loadHostRoleRequestDetail(request.requestId, false);
      setBanner({ tone: 'success', text: `Host role request ${data.requestId} rejected.` });
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    } finally {
      setReviewingHostRoleRequestId(null);
    }
  }

  async function handleCreateAdminTermDraft(sourceTermId: number, version: string) {
    const nextVersion = version.trim();
    if (!nextVersion) {
      setBanner({ tone: 'error', text: 'A new version is required to create a draft.' });
      return;
    }

    setCreatingTermDraftId(sourceTermId);
    try {
      const data = await apiRequest<AdminTermMutationResponse>(`/api/v1/admin/terms/${sourceTermId}/drafts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ version: nextVersion })
      });
      await loadAdminTerms(false);
      await loadAdminTermDetail(data.termId, false);
      setBanner({ tone: 'success', text: `Draft v${data.version} created.` });
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    } finally {
      setCreatingTermDraftId(null);
    }
  }

  async function handleUpdateAdminTerm(
    termId: number,
    form: { title: string; content: string; version: string; required: boolean; effectiveAt: string }
  ) {
    if (!form.effectiveAt) {
      setBanner({ tone: 'error', text: 'An effective date and time is required.' });
      return;
    }

    setSavingAdminTermId(termId);
    try {
      const data = await apiRequest<AdminTermMutationResponse>(`/api/v1/admin/terms/${termId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          version: form.version,
          required: form.required,
          effectiveAt: toServerDateTime(form.effectiveAt)
        })
      });
      await loadAdminTerms(false);
      await loadAdminTermDetail(termId, false);
      setBanner({ tone: 'success', text: `Draft v${data.version} saved.` });
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    } finally {
      setSavingAdminTermId(null);
    }
  }

  async function handlePublishAdminTerm(termId: number) {
    setPublishingAdminTermId(termId);
    try {
      const data = await apiRequest<AdminTermMutationResponse>(`/api/v1/admin/terms/${termId}/publish`, {
        method: 'POST'
      });
      await loadAdminTerms(false);
      await loadAdminTermDetail(termId, false);
      setBanner({ tone: 'success', text: `Term v${data.version} published for signup.` });
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    } finally {
      setPublishingAdminTermId(null);
    }
  }

  async function handleDeactivatePricePolicy(policyId: number) {
    if (!window.confirm(`Deactivate price policy ${policyId}?`)) {
      return;
    }

    setDeactivatingPolicyId(policyId);
    try {
      const data = await apiRequest<PricePolicyMutationResponse>(`/api/v1/price-policies/${policyId}/deactivate`, {
        method: 'POST'
      });
      await refreshPricePoliciesAndDetail();
      setBanner({ tone: 'success', text: `Price policy ${data.policyName} deactivated.` });
    } catch (error) {
      setBanner({ tone: 'error', text: (error as Error).message });
    } finally {
      setDeactivatingPolicyId(null);
    }
  }

  function renderCurrentPage() {
    if (!user) {
      return null;
    }

    if (!isAdmin) {
      switch (currentPage as HostPageKey) {
        case 'reservation-calendar':
          return (
            <HostReservationCalendarPage
              reservationCalendar={reservationCalendar}
              loadingReservationCalendar={loadingReservationCalendar}
              selectedReservationId={selectedReservationId}
              selectedReservationSummary={selectedReservationSummary}
              reservationDetail={reservationDetail}
              loadingDetail={loadingDetail}
              decisioningReservationId={decisioningReservationId}
              rejectReasons={rejectReasons}
              reassigningNightId={reassigningNightId}
              onRefresh={() => void loadReservationCalendar(true)}
              onAccommodationChange={(value) => void handleCalendarAccommodationChange(value)}
              onStartDateChange={(value) => void handleCalendarStartDateChange(value)}
              onSelectReservation={(reservationId) => void handleCalendarReservationSelect(reservationId)}
              onOpenFallbackDetail={() => {
                if (selectedReservationId !== null) {
                  void loadReservationDetail(selectedReservationId, true, true);
                }
              }}
              onRejectReasonChange={(reservationId, value) =>
                setRejectReasons((current) => ({ ...current, [reservationId]: value }))
              }
              onApprove={(reservation) => void handleApprove(reservation)}
              onReject={(reservation) => void handleReject(reservation)}
              onCancel={(reservation, reasonText) => void handleCancel(reservation, reasonText)}
              onReassignNight={(assignmentCell, targetRoomId) => void handleCalendarReassignNight(assignmentCell, targetRoomId)}
              onSwapNights={(sourceCell, targetCell) => void handleCalendarSwapNights(sourceCell, targetCell)}
            />
          );
        case 'properties':
          return (
            <HostPropertiesPage
              accommodations={accommodations}
              selectedAccommodationId={selectedAccommodationId}
              accommodationDetail={accommodationDetail}
              creatingAccommodation={creatingAccommodation}
              loadingAccommodations={loadingAccommodations}
              loadingAccommodationDetail={loadingAccommodationDetail}
              mutatingAssetId={mutatingAssetId}
              onRefresh={() => void loadAccommodations(true)}
              onStartCreateAccommodation={handleStartCreateAccommodation}
              onSelectAccommodation={(accommodationId) => void handleSelectAccommodation(accommodationId)}
              onCreateAccommodation={(form) => void handleCreateAccommodation(form)}
              onUpdateAccommodation={(accommodationId, form) => void handleUpdateAccommodation(accommodationId, form)}
              onDeactivateAccommodation={(accommodationId) => void handleDeactivateAccommodation(accommodationId)}
              onCreateRoomType={(accommodationId, form) => void handleCreateRoomType(accommodationId, form)}
              onUpdateRoomType={(roomTypeId, form) => void handleUpdateRoomType(roomTypeId, form)}
              onDeactivateRoomType={(roomTypeId) => void handleDeactivateRoomType(roomTypeId)}
              onCreateRoom={(accommodationId, form) => void handleCreateRoom(accommodationId, form)}
              onUpdateRoom={(roomId, form) => void handleUpdateRoom(roomId, form)}
              onDeactivateRoom={(roomId) => void handleDeactivateRoom(roomId)}
              onOpenCalendar={openPropertyCalendar}
              onOpenPricing={openPropertyPricing}
              onOpenBlocks={openPropertyBlocks}
            />
          );
        case 'dashboard':
          return (
            <HostDashboardPage
              reservations={reservations}
              pendingCount={reservations.filter((reservation) => reservation.status === 'PENDING').length}
              blockCount={roomBlockManagement?.blocks.filter((block) => block.status === 'ACTIVE').length ?? 0}
              pricingCount={pricePolicyManagement?.policies.filter((policy) => policy.status === 'ACTIVE').length ?? 0}
              onNavigate={setCurrentPage}
              onOpenReservation={(reservationId) => {
                setCurrentPage('reservation-calendar');
                void handleCalendarReservationSelect(reservationId);
              }}
            />
          );
        case 'reservation-detail':
          return (
            <ReservationDetailPage
              selectedReservationId={selectedReservationId}
              reservationDetail={reservationDetail}
              loadingDetail={loadingDetail}
              selectedReservationSummary={selectedReservationSummary}
              showCalendarAction
              rejectReasons={rejectReasons}
              decisioningReservationId={decisioningReservationId}
              reassignmentSelections={reassignmentSelections}
              reassigningNightId={reassigningNightId}
              onRefresh={() => {
                if (selectedReservationId !== null) {
                  void loadReservationDetail(selectedReservationId, true);
                }
              }}
              onOpenCalendar={(reservation) => void handleOpenReservationInCalendar(reservation)}
              onRejectReasonChange={(reservationId, value) =>
                setRejectReasons((current) => ({ ...current, [reservationId]: value }))
              }
              onApprove={(reservation) => void handleApprove(reservation)}
              onReject={(reservation) => void handleReject(reservation)}
              onCancel={(reservation, reasonText) => void handleCancel(reservation, reasonText)}
              onReassignmentSelectionChange={(reservationNightId, value) =>
                setReassignmentSelections((current) => ({ ...current, [reservationNightId]: value }))
              }
              onReassignNight={(night) => void handleReassignNight(night)}
            />
          );
        case 'room-blocks':
          return (
            <RoomBlocksPage
              roomBlockManagement={roomBlockManagement}
              loadingRoomBlocks={loadingRoomBlocks}
              creatingRoomBlock={creatingRoomBlock}
              deactivatingBlockId={deactivatingBlockId}
              blockAccommodationId={blockAccommodationId}
              blockRoomFilterId={blockRoomFilterId}
              newBlockRoomId={newBlockRoomId}
              newBlockStartDate={newBlockStartDate}
              newBlockEndDate={newBlockEndDate}
              newBlockReasonType={newBlockReasonType}
              newBlockReasonText={newBlockReasonText}
              roomBlockReasonChoices={roomBlockReasonChoices}
              onRefresh={() => void loadRoomBlocks(true)}
              onAccommodationChange={(value) => void handleAccommodationBlockFilterChange(value)}
              onRoomFilterChange={(value) => void handleRoomBlockFilterChange(value)}
              onNewBlockRoomIdChange={setNewBlockRoomId}
              onNewBlockStartDateChange={setNewBlockStartDate}
              onNewBlockEndDateChange={setNewBlockEndDate}
              onNewBlockReasonTypeChange={setNewBlockReasonType}
              onNewBlockReasonTextChange={setNewBlockReasonText}
              onSubmit={(event) => void handleCreateRoomBlock(event)}
              onDeactivate={(blockId) => void handleDeactivateRoomBlock(blockId)}
            />
          );
        case 'pricing':
          return (
            <PricingPage
              pricePolicyManagement={pricePolicyManagement}
              loadingPricePolicies={loadingPricePolicies}
              creatingPricePolicy={creatingPricePolicy}
              deactivatingPolicyId={deactivatingPolicyId}
              pricingAccommodationId={pricingAccommodationId}
              pricingRoomTypeFilterId={pricingRoomTypeFilterId}
              newPolicyRoomTypeId={newPolicyRoomTypeId}
              newPolicyName={newPolicyName}
              newPolicyStartDate={newPolicyStartDate}
              newPolicyEndDate={newPolicyEndDate}
              newPolicyDeltaAmount={newPolicyDeltaAmount}
              newPolicyDayBits={newPolicyDayBits}
              onRefresh={() => void loadPricePolicies(true)}
              onAccommodationChange={(value) => void handleAccommodationPricingFilterChange(value)}
              onRoomTypeFilterChange={(value) => void handleRoomTypePricingFilterChange(value)}
              onNewPolicyRoomTypeIdChange={setNewPolicyRoomTypeId}
              onNewPolicyNameChange={setNewPolicyName}
              onNewPolicyStartDateChange={setNewPolicyStartDate}
              onNewPolicyEndDateChange={setNewPolicyEndDate}
              onNewPolicyDeltaAmountChange={setNewPolicyDeltaAmount}
              onToggleDayBit={toggleNewPolicyDayBit}
              onSubmit={(event) => void handleCreatePricePolicy(event)}
              onDeactivate={(policyId) => void handleDeactivatePricePolicy(policyId)}
            />
          );
        case 'reservations':
        default:
          return (
            <ReservationsPage
              reservations={reservations}
              statusFilter={statusFilter}
              selectedReservationId={selectedReservationId}
              showCalendarAction
              refreshing={refreshing}
              decisioningReservationId={decisioningReservationId}
              rejectReasons={rejectReasons}
              onFilterChange={(filter) => void handleFilterChange(filter)}
              onRefresh={() => void loadReservations(true)}
              onOpenDetail={(reservationId) => void handleOpenDetail(reservationId)}
              onOpenCalendar={(reservation) => void handleOpenReservationInCalendar(reservation)}
              onApprove={(reservation) => void handleApprove(reservation)}
              onReject={(reservation) => void handleReject(reservation)}
              onRejectReasonChange={(reservationId, value) =>
                setRejectReasons((current) => ({ ...current, [reservationId]: value }))
              }
            />
          );
      }
    }

    switch (currentPage as AdminPageKey) {
      case 'dashboard':
        return (
          <AdminDashboardPage
            reservations={reservations}
            adminUsers={adminUsers}
            hostRoleRequests={adminHostRoleRequests}
            termCount={adminTerms.length}
            blockCount={roomBlockManagement?.blocks.filter((block) => block.status === 'ACTIVE').length ?? 0}
            pricingCount={pricePolicyManagement?.policies.filter((policy) => policy.status === 'ACTIVE').length ?? 0}
            onNavigate={setCurrentPage}
          />
        );
      case 'users':
        return (
          <AdminUsersPage
            adminUsers={adminUsers}
            selectedAdminUserId={selectedAdminUserId}
            adminUserDetail={adminUserDetail}
            loadingAdminUsers={loadingAdminUsers}
            loadingAdminUserDetail={loadingAdminUserDetail}
            onRefreshUsers={() => void loadAdminUsers(true)}
            onOpenUser={(userId) => void loadAdminUserDetail(userId, true)}
            onOpenRoleRequestsForUser={(adminUser) => {
              const nextFilter = adminUser.latestHostRoleRequestStatus ?? 'ALL';
              setCurrentPage('role-requests');
              setHostRoleRequestFilter(nextFilter);
              void loadHostRoleRequests(false, nextFilter);
            }}
          />
        );
      case 'role-requests':
        return (
          <AdminRoleRequestsPage
            hostRoleRequestFilter={hostRoleRequestFilter}
            adminHostRoleRequests={adminHostRoleRequests}
            selectedHostRoleRequestId={selectedHostRoleRequestId}
            hostRoleRequestDetail={hostRoleRequestDetail}
            loadingHostRoleRequests={loadingHostRoleRequests}
            loadingHostRoleRequestDetail={loadingHostRoleRequestDetail}
            reviewingHostRoleRequestId={reviewingHostRoleRequestId}
            adminReviewReason={adminReviewReason}
            onRefreshRequests={() => void loadHostRoleRequests(true)}
            onFilterChange={(filter) => void handleHostRoleRequestFilterChange(filter)}
            onOpenRequest={(requestId) => void loadHostRoleRequestDetail(requestId, true)}
            onReviewReasonChange={setAdminReviewReason}
            onApprove={(request) => void handleApproveHostRoleRequest(request)}
            onReject={(request) => void handleRejectHostRoleRequest(request)}
          />
        );
      case 'terms':
        return (
          <AdminTermsPage
            adminTerms={adminTerms}
            selectedAdminTermId={selectedAdminTermId}
            adminTermDetail={adminTermDetail}
            loadingAdminTerms={loadingAdminTerms}
            loadingAdminTermDetail={loadingAdminTermDetail}
            creatingTermDraftId={creatingTermDraftId}
            savingAdminTermId={savingAdminTermId}
            publishingAdminTermId={publishingAdminTermId}
            onRefreshTerms={() => void loadAdminTerms(true)}
            onOpenTerm={(termId) => void loadAdminTermDetail(termId, true)}
            onCreateDraft={(termId, version) => void handleCreateAdminTermDraft(termId, version)}
            onUpdateDraft={(termId, form) => void handleUpdateAdminTerm(termId, form)}
            onPublish={(termId) => void handlePublishAdminTerm(termId)}
          />
        );
      case 'reservation-detail':
        return (
          <ReservationDetailPage
            selectedReservationId={selectedReservationId}
            reservationDetail={reservationDetail}
            loadingDetail={loadingDetail}
            selectedReservationSummary={selectedReservationSummary}
            showCalendarAction={false}
            rejectReasons={rejectReasons}
            decisioningReservationId={decisioningReservationId}
            reassignmentSelections={reassignmentSelections}
            reassigningNightId={reassigningNightId}
            onRefresh={() => {
              if (selectedReservationId !== null) {
                void loadReservationDetail(selectedReservationId, true);
              }
            }}
            onOpenCalendar={() => undefined}
            onRejectReasonChange={(reservationId, value) =>
              setRejectReasons((current) => ({ ...current, [reservationId]: value }))
            }
            onApprove={(reservation) => void handleApprove(reservation)}
            onReject={(reservation) => void handleReject(reservation)}
            onCancel={(reservation, reasonText) => void handleCancel(reservation, reasonText)}
            onReassignmentSelectionChange={(reservationNightId, value) =>
              setReassignmentSelections((current) => ({ ...current, [reservationNightId]: value }))
            }
            onReassignNight={(night) => void handleReassignNight(night)}
          />
        );
      case 'room-blocks':
        return (
          <RoomBlocksPage
            roomBlockManagement={roomBlockManagement}
            loadingRoomBlocks={loadingRoomBlocks}
            creatingRoomBlock={creatingRoomBlock}
            deactivatingBlockId={deactivatingBlockId}
            blockAccommodationId={blockAccommodationId}
            blockRoomFilterId={blockRoomFilterId}
            newBlockRoomId={newBlockRoomId}
            newBlockStartDate={newBlockStartDate}
            newBlockEndDate={newBlockEndDate}
            newBlockReasonType={newBlockReasonType}
            newBlockReasonText={newBlockReasonText}
            roomBlockReasonChoices={roomBlockReasonChoices}
            onRefresh={() => void loadRoomBlocks(true)}
            onAccommodationChange={(value) => void handleAccommodationBlockFilterChange(value)}
            onRoomFilterChange={(value) => void handleRoomBlockFilterChange(value)}
            onNewBlockRoomIdChange={setNewBlockRoomId}
            onNewBlockStartDateChange={setNewBlockStartDate}
            onNewBlockEndDateChange={setNewBlockEndDate}
            onNewBlockReasonTypeChange={setNewBlockReasonType}
            onNewBlockReasonTextChange={setNewBlockReasonText}
            onSubmit={(event) => void handleCreateRoomBlock(event)}
            onDeactivate={(blockId) => void handleDeactivateRoomBlock(blockId)}
          />
        );
      case 'pricing':
        return (
          <PricingPage
            pricePolicyManagement={pricePolicyManagement}
            loadingPricePolicies={loadingPricePolicies}
            creatingPricePolicy={creatingPricePolicy}
            deactivatingPolicyId={deactivatingPolicyId}
            pricingAccommodationId={pricingAccommodationId}
            pricingRoomTypeFilterId={pricingRoomTypeFilterId}
            newPolicyRoomTypeId={newPolicyRoomTypeId}
            newPolicyName={newPolicyName}
            newPolicyStartDate={newPolicyStartDate}
            newPolicyEndDate={newPolicyEndDate}
            newPolicyDeltaAmount={newPolicyDeltaAmount}
            newPolicyDayBits={newPolicyDayBits}
            onRefresh={() => void loadPricePolicies(true)}
            onAccommodationChange={(value) => void handleAccommodationPricingFilterChange(value)}
            onRoomTypeFilterChange={(value) => void handleRoomTypePricingFilterChange(value)}
            onNewPolicyRoomTypeIdChange={setNewPolicyRoomTypeId}
            onNewPolicyNameChange={setNewPolicyName}
            onNewPolicyStartDateChange={setNewPolicyStartDate}
            onNewPolicyEndDateChange={setNewPolicyEndDate}
            onNewPolicyDeltaAmountChange={setNewPolicyDeltaAmount}
            onToggleDayBit={toggleNewPolicyDayBit}
            onSubmit={(event) => void handleCreatePricePolicy(event)}
            onDeactivate={(policyId) => void handleDeactivatePricePolicy(policyId)}
          />
        );
      case 'reservations':
      default:
        return (
          <ReservationsPage
            reservations={reservations}
            statusFilter={statusFilter}
            selectedReservationId={selectedReservationId}
            showCalendarAction={false}
            refreshing={refreshing}
            decisioningReservationId={decisioningReservationId}
            rejectReasons={rejectReasons}
            onFilterChange={(filter) => void handleFilterChange(filter)}
            onRefresh={() => void loadReservations(true)}
            onOpenDetail={(reservationId) => void handleOpenDetail(reservationId)}
            onOpenCalendar={() => undefined}
            onApprove={(reservation) => void handleApprove(reservation)}
            onReject={(reservation) => void handleReject(reservation)}
            onRejectReasonChange={(reservationId, value) =>
              setRejectReasons((current) => ({ ...current, [reservationId]: value }))
            }
          />
        );
    }
  }

  if (initializing) {
    return (
      <div className="app-shell">
        {banner ? <div className={`banner banner-${banner.tone}`}>{banner.text}</div> : null}
        <section className="panel narrow">
          <h2>Preparing operations</h2>
          <p className="muted">Restoring your sign-in session.</p>
        </section>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-shell">
        {banner ? <div className={`banner banner-${banner.tone}`}>{banner.text}</div> : null}
        <LoginPage
          loginId={loginId}
          password={password}
          loggingIn={loggingIn}
          onLoginIdChange={setLoginId}
          onPasswordChange={setPassword}
          onSubmit={(event) => void handleLogin(event)}
        />
      </div>
    );
  }

  return (
    <OpsShell
      user={user}
      currentPage={currentPage}
      navItems={navItems}
      banner={banner}
      onNavigate={setCurrentPage}
      onLogout={() => void handleLogout()}
    >
      {renderCurrentPage()}
    </OpsShell>
  );
}

function toServerDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

export default App;
