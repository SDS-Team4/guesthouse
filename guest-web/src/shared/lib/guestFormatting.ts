import {
  AccommodationAvailabilityCategory,
  HostRoleRequestStatus,
  ReservationDetail
} from '../../features/guest-api-types';
import { SearchFormState } from '../../app/guestAppState';

const currencyFormatter = new Intl.NumberFormat('ko-KR');

export function getBusinessTodayIsoDate() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
}

export function validateSearchForm(searchForm: SearchFormState) {
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

export function formatCurrency(amount: number | null) {
  if (amount === null) {
    return 'N/A';
  }
  return `KRW ${currencyFormatter.format(amount)}`;
}

export function formatClassification(category: AccommodationAvailabilityCategory) {
  switch (category) {
    case 'AVAILABLE':
      return 'Available';
    case 'CONDITION_MISMATCH':
      return 'Condition mismatch';
    case 'SOLD_OUT':
      return 'Sold out';
  }
}

export function formatTimestamp(value: string | null) {
  if (!value) {
    return 'Not yet';
  }
  return new Date(value).toLocaleString('ko-KR');
}

export function formatReservationAction(
  actionType: ReservationDetail['statusHistory'][number]['actionType']
) {
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

export function formatHostRoleRequestStatus(status: HostRoleRequestStatus) {
  switch (status) {
    case 'PENDING':
      return 'Pending review';
    case 'APPROVED':
      return 'Approved';
    case 'DENIED':
      return 'Denied';
  }
}
