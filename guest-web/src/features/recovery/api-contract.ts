export type FindIdRequestContract = {
  name: string;
  emailOrPhone: string;
};

export type FindPasswordRequestContract = {
  loginIdOrEmail: string;
  verificationInfo: string;
};
