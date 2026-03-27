export type AdminPage =
  | 'login'
  | 'dashboard'
  | 'users'
  | 'role-requests'
  | 'audit-logs'
  | 'system-logs'
  | 'properties'
  | 'terms';

export type RoleRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type LogSeverity = 'INFO' | 'WARN' | 'ERROR';

export type UserRow = {
  id: number;
  loginId: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'HOST' | 'GUEST';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  joinedAt: string;
};

export type RoleRequest = {
  id: number;
  userName: string;
  loginId: string;
  reason: string;
  status: RoleRequestStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
};

export type AuditLog = {
  id: number;
  actor: string;
  target: string;
  action: string;
  createdAt: string;
  beforeJson: string;
  afterJson: string;
};

export type SystemLog = {
  id: number;
  severity: LogSeverity;
  source: string;
  message: string;
  createdAt: string;
};

export type PropertyRow = {
  id: number;
  name: string;
  host: string;
  region: string;
  status: 'ACTIVE' | 'INACTIVE';
  roomTypeCount: number;
  reservationCount: number;
  pendingCount: number;
};

export type TermsDoc = {
  id: number;
  type: 'TERMS' | 'PRIVACY';
  version: string;
  title: string;
  content: string;
  updatedAt: string;
};
