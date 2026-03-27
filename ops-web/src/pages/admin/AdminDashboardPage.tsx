import { SectionCard } from '../../components/ops/SectionCard';
import { StatusPill } from '../../components/ops/StatusPill';
import type { AdminHostRoleRequest, AdminUserSummary, OpsPageKey, ReservationSummary } from '../../lib/types';

type AdminDashboardPageProps = {
  reservations: ReservationSummary[];
  adminUsers: AdminUserSummary[];
  hostRoleRequests: AdminHostRoleRequest[];
  termCount: number;
  blockCount: number;
  pricingCount: number;
  onNavigate: (page: OpsPageKey) => void;
};

export function AdminDashboardPage({
  reservations,
  adminUsers,
  hostRoleRequests,
  termCount,
  blockCount,
  pricingCount,
  onNavigate
}: AdminDashboardPageProps) {
  const pendingRequests = hostRoleRequests.filter((request) => request.status === 'PENDING').length;
  const statItems = [
    { label: 'Tracked reservations', value: reservations.length, tone: 'info' as const },
    { label: 'Users in view', value: adminUsers.length, tone: 'brand' as const },
    { label: 'Pending host requests', value: pendingRequests, tone: 'warning' as const },
    { label: 'Governance assets', value: blockCount + pricingCount + termCount, tone: 'danger' as const }
  ];

  return (
    <div className="ops-page-grid">
      <div className="ops-stat-grid">
        {statItems.map((item) => (
          <SectionCard
            key={item.label}
            title={item.label}
            actions={<StatusPill tone={item.tone}>Live</StatusPill>}
            className="ops-stat-card"
          >
            <div className="ops-stat-value">{item.value}</div>
          </SectionCard>
        ))}
      </div>

      <div className="ops-two-column">
        <SectionCard title="Operational shortcuts" subtitle="Admin keeps the shared ops surfaces plus governance pages.">
          <div className="ops-shortcut-grid">
            <button type="button" className="ops-shortcut" onClick={() => onNavigate('reservations')}>
              <strong>Reservations</strong>
              <span>Shared live reservation operations</span>
            </button>
            <button type="button" className="ops-shortcut" onClick={() => onNavigate('room-blocks')}>
              <strong>Room blocks</strong>
              <span>Shared live room-level block management</span>
            </button>
            <button type="button" className="ops-shortcut" onClick={() => onNavigate('pricing')}>
              <strong>Pricing</strong>
              <span>Shared live additive pricing management</span>
            </button>
            <button type="button" className="ops-shortcut" onClick={() => onNavigate('users')}>
              <strong>Users</strong>
              <span>Admin-only governance page</span>
            </button>
            <button type="button" className="ops-shortcut" onClick={() => onNavigate('terms')}>
              <strong>Terms</strong>
              <span>Edit and publish signup terms safely</span>
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Governance shortcuts" subtitle="Keep user governance close to the shared reservation operations.">
          <div className="ops-shortcut-grid">
            <button type="button" className="ops-shortcut" onClick={() => onNavigate('role-requests')}>
              <strong>Host requests</strong>
              <span>Review pending host-role approvals and rejections</span>
            </button>
            <button type="button" className="ops-shortcut" onClick={() => onNavigate('users')}>
              <strong>Users</strong>
              <span>Inspect account posture and role status</span>
            </button>
            <button type="button" className="ops-shortcut" onClick={() => onNavigate('terms')}>
              <strong>Signup terms</strong>
              <span>Draft and publish the documents shown during signup</span>
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
