import { SectionCard } from '../../components/ops/SectionCard';
import { formatTimestamp } from '../../lib/format';
import type { AdminUserDetail, AdminUserSummary } from '../../lib/types';

type AdminUsersPageProps = {
  adminUsers: AdminUserSummary[];
  selectedAdminUserId: number | null;
  adminUserDetail: AdminUserDetail | null;
  loadingAdminUsers: boolean;
  loadingAdminUserDetail: boolean;
  onRefreshUsers: () => void;
  onOpenUser: (userId: number) => void;
  onOpenRoleRequestsForUser: (user: AdminUserSummary) => void;
};

export function AdminUsersPage({
  adminUsers,
  selectedAdminUserId,
  adminUserDetail,
  loadingAdminUsers,
  loadingAdminUserDetail,
  onRefreshUsers,
  onOpenUser,
  onOpenRoleRequestsForUser
}: AdminUsersPageProps) {
  const selectedAdminUserSummary =
    selectedAdminUserId === null ? null : adminUsers.find((adminUser) => adminUser.userId === selectedAdminUserId) ?? null;

  return (
    <SectionCard
      title="Admin user management"
      subtitle="Inspect account posture and jump directly into related host-role governance when needed."
      actions={
        <button type="button" className="secondary-button" onClick={onRefreshUsers} disabled={loadingAdminUsers}>
          {loadingAdminUsers ? 'Refreshing...' : 'Refresh users'}
        </button>
      }
    >
      <div className="admin-grid">
        <section className="detail-card">
          <h4>Users</h4>
          {adminUsers.length === 0 ? (
            <p className="empty-state">No users found.</p>
          ) : (
            <div className="admin-list">
              {adminUsers.map((adminUser) => (
                <button
                  key={adminUser.userId}
                  type="button"
                  className={`result-card ${adminUser.userId === selectedAdminUserId ? 'result-card-active' : ''}`}
                  onClick={() => onOpenUser(adminUser.userId)}
                >
                  <div className="result-card-header">
                    <div>
                      <strong>{adminUser.loginId}</strong>
                      <p>{adminUser.name}</p>
                    </div>
                    <span className={`status-pill status-${adminUser.role.toLowerCase()}`}>{adminUser.role}</span>
                  </div>
                  <div className="result-metrics">
                    <span>Status: {adminUser.status}</span>
                    <span>Failed logins: {adminUser.failedLoginCount}</span>
                    <span>Latest request: {adminUser.latestHostRoleRequestStatus ?? 'None'}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="detail-card">
          <h4>User detail</h4>
          {loadingAdminUserDetail ? <p className="empty-state">Loading user detail...</p> : null}
          {!loadingAdminUserDetail && !adminUserDetail ? (
            <p className="empty-state">Choose one user to inspect detail.</p>
          ) : adminUserDetail ? (
            <dl className="definition-list admin-definition-list">
              <div><dt>Login ID</dt><dd>{adminUserDetail.loginId}</dd></div>
              <div><dt>Name</dt><dd>{adminUserDetail.name}</dd></div>
              <div><dt>Role</dt><dd>{adminUserDetail.role}</dd></div>
              <div><dt>Status</dt><dd>{adminUserDetail.status}</dd></div>
              <div><dt>Email</dt><dd>{adminUserDetail.email ?? 'Not set'}</dd></div>
              <div><dt>Phone</dt><dd>{adminUserDetail.phone ?? 'Not set'}</dd></div>
              <div><dt>Created</dt><dd>{formatTimestamp(adminUserDetail.createdAt)}</dd></div>
              <div><dt>Updated</dt><dd>{formatTimestamp(adminUserDetail.updatedAt)}</dd></div>
              <div><dt>Last login</dt><dd>{formatTimestamp(adminUserDetail.lastLoginAt)}</dd></div>
              <div><dt>Failed count</dt><dd>{adminUserDetail.failedLoginCount}</dd></div>
              <div><dt>Last failed</dt><dd>{formatTimestamp(adminUserDetail.lastFailedAt)}</dd></div>
              <div><dt>Locked until</dt><dd>{formatTimestamp(adminUserDetail.lockedUntil)}</dd></div>
              <div><dt>Password changed</dt><dd>{formatTimestamp(adminUserDetail.passwordChangedAt)}</dd></div>
              <div><dt>Latest host request</dt><dd>{selectedAdminUserSummary?.latestHostRoleRequestStatus ?? 'None'}</dd></div>
            </dl>
          ) : null}
          {adminUserDetail && selectedAdminUserSummary?.latestHostRoleRequestStatus ? (
            <div className="action-group">
              <button
                type="button"
                className="secondary-button"
                onClick={() => onOpenRoleRequestsForUser(selectedAdminUserSummary)}
              >
                Open host requests
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </SectionCard>
  );
}
