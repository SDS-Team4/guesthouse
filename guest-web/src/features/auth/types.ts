export type GuestAuthState = 'logged-out' | 'logged-in';

export type GuestLoginForm = {
  loginId: string;
  password: string;
};

export type GuestSignupForm = {
  loginId: string;
  password: string;
  passwordConfirm: string;
  name: string;
  email: string;
  phone: string;
  agreedTermIds: number[];
};
