export type GuestAccountProfileContract = {
  userId: number;
  loginId: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: 'GUEST';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
};
