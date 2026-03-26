import { GuestPage } from './guestPages';
import { ReservationIntent } from './guestAppState';

export type GuestSidebarAction = {
  label: string;
  disabled?: boolean;
  onClick: () => void;
};

type BuildGuestSidebarActionsArgs = {
  currentPage: GuestPage;
  hasCompletedReservation: boolean;
  onOpenSearch: () => void;
  onOpenAccommodations: () => void;
  onOpenReservationList: () => void;
  onOpenCompletedReservationDetail: () => void;
};

const authRequiredPages: GuestPage[] = [
  'mypage',
  'account-profile',
  'account-password',
  'account-host-role-request',
  'reservation-request',
  'reservation-complete',
  'reservation-list',
  'reservation-detail'
];

export function resolveGuestPageForAccess(page: GuestPage, signedIn: boolean): GuestPage {
  if (!signedIn && authRequiredPages.includes(page)) {
    return 'login';
  }

  return page;
}

export function resolveGuestPageAfterLogin(pendingReservationIntent: ReservationIntent | null): GuestPage {
  return pendingReservationIntent ? 'reservation-request' : 'search';
}

export function resolveReservationRequestEntryPage(signedIn: boolean): GuestPage {
  return signedIn ? 'reservation-request' : 'login';
}

export function buildGuestSidebarActions({
  currentPage,
  hasCompletedReservation,
  onOpenSearch,
  onOpenAccommodations,
  onOpenReservationList,
  onOpenCompletedReservationDetail
}: BuildGuestSidebarActionsArgs): GuestSidebarAction[] {
  if (currentPage === 'accommodations') {
    return [{ label: '메인 검색으로 이동', onClick: onOpenSearch }];
  }

  if (currentPage === 'accommodation-detail') {
    return [
      { label: '숙소 목록으로 이동', onClick: onOpenAccommodations },
      { label: '메인 검색으로 이동', onClick: onOpenSearch }
    ];
  }

  if (currentPage === 'reservation-complete') {
    return [
      {
        label: '예약 상세로 이동',
        disabled: !hasCompletedReservation,
        onClick: onOpenCompletedReservationDetail
      },
      { label: '예약 목록으로 이동', onClick: onOpenReservationList }
    ];
  }

  return [];
}
