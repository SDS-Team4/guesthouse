import { SearchFormState } from './types';

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

export function formatTimestamp(value: string | null) {
  if (!value) {
    return 'Not yet';
  }
  return new Date(value).toLocaleString('ko-KR');
}

export function formatDateRange(startDate: string, endDate: string) {
  return `${startDate} ~ ${endDate}`;
}
