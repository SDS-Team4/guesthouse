import { GuestLoginForm, GuestSignupForm } from './types';

export const guestLoginDraftDefaults: GuestLoginForm = {
  loginId: '',
  password: ''
};

export const guestSignupDraftDefaults: GuestSignupForm = {
  loginId: '',
  password: '',
  passwordConfirm: '',
  name: '',
  email: '',
  phone: '',
  agreedTermIds: []
};
