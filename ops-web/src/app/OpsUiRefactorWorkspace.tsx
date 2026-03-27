import { useMemo, useState } from 'react';
import { AdminAuditLogsPage } from '../features/admin-audit-logs/pages/AdminAuditLogsPage';
import { AdminLoginPage } from '../features/admin-auth/pages/AdminLoginPage';
import { AdminDashboardPage } from '../features/admin-dashboard/pages/AdminDashboardPage';
import { AdminPropertiesPage } from '../features/admin-properties/pages/AdminPropertiesPage';
import { AdminRoleRequestsPage } from '../features/admin-role-requests/pages/AdminRoleRequestsPage';
import { AdminSystemLogsPage } from '../features/admin-system-logs/pages/AdminSystemLogsPage';
import { AdminTermsPage } from '../features/admin-terms/pages/AdminTermsPage';
import { AdminUsersPage } from '../features/admin-users/pages/AdminUsersPage';
import { AdminPage } from '../features/admin-core/types';
import { HostAccountPage } from '../features/host-account/pages/HostAccountPage';
import { HostLoginPage } from '../features/host-auth/pages/HostLoginPage';
import { HostDashboardPage } from '../features/host-dashboard/pages/HostDashboardPage';
import { HostPropertyDetailPage } from '../features/host-properties/pages/HostPropertyDetailPage';
import { HostPropertyFormPage } from '../features/host-properties/pages/HostPropertyFormPage';
import { HostPropertiesPage } from '../features/host-properties/pages/HostPropertiesPage';
import { HostReservationDetailPage } from '../features/host-reservations/pages/HostReservationDetailPage';
import { HostReservationListPage } from '../features/host-reservations/pages/HostReservationListPage';
import { HostRoomTypeFormPage } from '../features/host-room-types/pages/HostRoomTypeFormPage';
import { HostRoomTypesPage } from '../features/host-room-types/pages/HostRoomTypesPage';
import { HostPage } from '../features/host-core/types';
import { cn } from '../shared/lib/cn';

type WorkspaceMode = 'host' | 'admin';

const hostPages: HostPage[] = [
  'login',
  'dashboard',
  'properties',
  'property-form',
  'property-detail',
  'room-types',
  'room-type-form',
  'reservation-list',
  'reservation-detail',
  'account'
];

const adminPages: AdminPage[] = [
  'login',
  'dashboard',
  'users',
  'role-requests',
  'audit-logs',
  'system-logs',
  'properties',
  'terms'
];

export function OpsUiRefactorWorkspace() {
  const [mode, setMode] = useState<WorkspaceMode>('host');
  const [hostPage, setHostPage] = useState<HostPage>('dashboard');
  const [adminPage, setAdminPage] = useState<AdminPage>('dashboard');

  const pageButtons = useMemo(() => (mode === 'host' ? hostPages : adminPages), [mode]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
        <div className="mb-3">
          <h1 className="text-lg font-bold text-slate-900">Ops UI Refactor Workspace</h1>
          <p className="mt-1 text-sm text-slate-500">
            Host and admin drafts are preserved as originals. This workspace is the split implementation surface.
          </p>
        </div>

        <div className="mb-4 flex gap-2">
          {(['host', 'admin'] as WorkspaceMode[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={cn(
                'rounded-full border px-3 py-2 text-sm font-medium',
                mode === item
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
              )}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {pageButtons.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => (mode === 'host' ? setHostPage(item as HostPage) : setAdminPage(item as AdminPage))}
              className={cn(
                'rounded-full border px-3 py-2 text-sm font-medium',
                (mode === 'host' ? hostPage === item : adminPage === item)
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {mode === 'host' ? (
        <>
          {hostPage === 'login' ? <HostLoginPage onLogin={() => setHostPage('dashboard')} /> : null}
          {hostPage === 'dashboard' ? <HostDashboardPage onNavigate={setHostPage} /> : null}
          {hostPage === 'properties' ? <HostPropertiesPage onNavigate={setHostPage} /> : null}
          {hostPage === 'property-form' ? <HostPropertyFormPage /> : null}
          {hostPage === 'property-detail' ? <HostPropertyDetailPage onNavigate={setHostPage} /> : null}
          {hostPage === 'room-types' ? <HostRoomTypesPage onNavigate={setHostPage} /> : null}
          {hostPage === 'room-type-form' ? <HostRoomTypeFormPage /> : null}
          {hostPage === 'reservation-list' ? <HostReservationListPage onNavigate={setHostPage} /> : null}
          {hostPage === 'reservation-detail' ? <HostReservationDetailPage /> : null}
          {hostPage === 'account' ? <HostAccountPage /> : null}
        </>
      ) : null}

      {mode === 'admin' ? (
        <>
          {adminPage === 'login' ? <AdminLoginPage onLogin={() => setAdminPage('dashboard')} /> : null}
          {adminPage === 'dashboard' ? <AdminDashboardPage onNavigate={setAdminPage} /> : null}
          {adminPage === 'users' ? <AdminUsersPage /> : null}
          {adminPage === 'role-requests' ? <AdminRoleRequestsPage /> : null}
          {adminPage === 'audit-logs' ? <AdminAuditLogsPage /> : null}
          {adminPage === 'system-logs' ? <AdminSystemLogsPage /> : null}
          {adminPage === 'properties' ? <AdminPropertiesPage /> : null}
          {adminPage === 'terms' ? <AdminTermsPage /> : null}
        </>
      ) : null}
    </div>
  );
}
