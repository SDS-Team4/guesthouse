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
  userId: number;
  loginId: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: 'GUEST';
  status: 'ACTIVE';
  createdAt: string;
};
