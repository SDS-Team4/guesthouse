export type GuestLoginRequestContract = {
  loginId: string;
  password: string;
};

export type GuestLoginResponseContract = {
  userId: number;
  loginId: string;
  name: string;
  role: 'GUEST';
};

export type GuestSignupRequestContract = {
  loginId: string;
  password: string;
  passwordConfirm: string;
  name: string;
  email: string;
  phone: string;
  agreedTermIds: number[];
};

export type GuestSignupResponseContract = {
  registered: true;
};

export type SignupLoginIdAvailabilityContract = {
  loginId: string;
  available: boolean;
};

export type SignupFieldAvailabilityContract = {
  loginId: string | null;
  loginIdAvailable: boolean | null;
  email: string | null;
  emailAvailable: boolean | null;
  phone: string | null;
  phoneAvailable: boolean | null;
};
