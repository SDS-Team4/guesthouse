export type BannerState = {
  tone: 'success' | 'error' | 'info';
  text: string;
} | null;

export type SearchFormState = {
  regions: string[];
  guestCount: string;
  checkInDate: string;
  checkOutDate: string;
};

export const guestSearchRegionOptions = ['SEOUL', 'BUSAN', 'JEONJU'] as const;

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

export type ReservationCompleteState = {
  reservationId: number;
  reservationNo: string;
  accommodationName: string;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
};

function getBusinessTodayDate() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === 'year')?.value ?? '0');
  const month = Number(parts.find((part) => part.type === 'month')?.value ?? '1');
  const day = Number(parts.find((part) => part.type === 'day')?.value ?? '1');
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildDefaultSearchForm(): SearchFormState {
  const today = getBusinessTodayDate();
  return {
    regions: [],
    guestCount: '2',
    checkInDate: formatIsoDate(addDays(today, 1)),
    checkOutDate: formatIsoDate(addDays(today, 3))
  };
}

export const defaultSearchForm: SearchFormState = buildDefaultSearchForm();

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
