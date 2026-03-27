import {
  AuditLog,
  PropertyRow,
  RoleRequest,
  SystemLog,
  TermsDoc,
  UserRow
} from './types';

export const adminUsers: UserRow[] = [
  {
    id: 1,
    loginId: 'admin_root',
    name: 'Admin Kim',
    email: 'admin@example.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    joinedAt: '2026-01-05'
  },
  {
    id: 2,
    loginId: 'host_moon',
    name: 'Host Moon',
    email: 'host1@example.com',
    role: 'HOST',
    status: 'ACTIVE',
    joinedAt: '2026-01-08'
  },
  {
    id: 3,
    loginId: 'guest_lee',
    name: 'Guest Lee',
    email: 'guest1@example.com',
    role: 'GUEST',
    status: 'ACTIVE',
    joinedAt: '2026-01-10'
  }
];

export const adminRoleRequests: RoleRequest[] = [
  {
    id: 101,
    userName: 'Kim Minsu',
    loginId: 'guest_kim',
    reason: 'I want to onboard and operate a new guesthouse.',
    status: 'PENDING',
    requestedAt: '2026-03-01 09:12'
  },
  {
    id: 102,
    userName: 'Choi Seo',
    loginId: 'guest_choi',
    reason: 'I already operate a property and need host access.',
    status: 'APPROVED',
    requestedAt: '2026-02-24 18:20',
    reviewedAt: '2026-02-25 10:30',
    reviewNote: 'Business details verified'
  }
];

export const adminAuditLogs: AuditLog[] = [
  {
    id: 1,
    actor: 'Admin Kim',
    target: 'host_role_request:101',
    action: 'APPROVE_HOST_ROLE',
    createdAt: '2026-03-01 10:00',
    beforeJson: '{"status":"PENDING"}',
    afterJson: '{"status":"APPROVED"}'
  },
  {
    id: 2,
    actor: 'Admin Kim',
    target: 'terms:3',
    action: 'UPDATE_TERMS',
    createdAt: '2026-02-27 15:12',
    beforeJson: '{"version":"v1.1"}',
    afterJson: '{"version":"v1.2"}'
  }
];

export const adminSystemLogs: SystemLog[] = [
  {
    id: 1,
    severity: 'ERROR',
    source: 'reservation-service',
    message: 'Failed to acquire reservation lock for property 23',
    createdAt: '2026-03-01 08:24'
  },
  {
    id: 2,
    severity: 'WARN',
    source: 'auth-service',
    message: 'Repeated failed login attempts detected for admin_root',
    createdAt: '2026-03-01 07:58'
  }
];

export const adminProperties: PropertyRow[] = [
  {
    id: 1,
    name: 'Aurora Guesthouse',
    host: 'Host Moon',
    region: 'Seoul Mapo',
    status: 'ACTIVE',
    roomTypeCount: 3,
    reservationCount: 18,
    pendingCount: 5
  },
  {
    id: 2,
    name: 'Blue Coast Stay',
    host: 'Host Park',
    region: 'Busan Haeundae',
    status: 'ACTIVE',
    roomTypeCount: 2,
    reservationCount: 11,
    pendingCount: 1
  }
];

export const adminTermsDocs: TermsDoc[] = [
  {
    id: 1,
    type: 'TERMS',
    version: 'v1.2',
    title: 'Service Terms',
    content: 'Basic service terms placeholder from the admin draft.',
    updatedAt: '2026-02-27 15:12'
  },
  {
    id: 2,
    type: 'PRIVACY',
    version: 'v1.4',
    title: 'Privacy Policy',
    content: 'Basic privacy policy placeholder from the admin draft.',
    updatedAt: '2026-02-11 09:40'
  }
];
