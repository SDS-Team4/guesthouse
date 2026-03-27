import { adminAuditLogs, adminProperties, adminRoleRequests, adminUsers } from '../../admin-core/mock';
import { AdminPage } from '../../admin-core/types';
import { SectionCard } from '../../../shared/ui/SectionCard';

type AdminDashboardPageProps = {
  onNavigate: (page: AdminPage) => void;
};

export function AdminDashboardPage({ onNavigate }: AdminDashboardPageProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
      <SectionCard title="Admin Dashboard" subtitle="Operational overview extracted from the admin draft.">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-slate-900 p-5 text-white">
            <div className="text-sm text-slate-300">Users</div>
            <div className="mt-2 text-3xl font-bold">{adminUsers.length}</div>
          </div>
          <div className="rounded-2xl bg-amber-100 p-5 text-amber-950">
            <div className="text-sm text-amber-700">Pending requests</div>
            <div className="mt-2 text-3xl font-bold">
              {adminRoleRequests.filter((item) => item.status === 'PENDING').length}
            </div>
          </div>
          <div className="rounded-2xl bg-emerald-100 p-5 text-emerald-950">
            <div className="text-sm text-emerald-700">Properties</div>
            <div className="mt-2 text-3xl font-bold">{adminProperties.length}</div>
          </div>
          <div className="rounded-2xl bg-sky-100 p-5 text-sky-950">
            <div className="text-sm text-sky-700">Audit logs</div>
            <div className="mt-2 text-3xl font-bold">{adminAuditLogs.length}</div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Shortcuts" subtitle="These are the first admin slices to connect later.">
        <div className="grid gap-3">
          {[
            ['users', 'Manage users'],
            ['role-requests', 'Review host role requests'],
            ['audit-logs', 'Browse audit logs'],
            ['system-logs', 'Inspect system logs'],
            ['properties', 'View properties'],
            ['terms', 'Manage terms']
          ].map(([page, label]) => (
            <button
              key={page}
              type="button"
              onClick={() => onNavigate(page as AdminPage)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm hover:bg-slate-50"
            >
              {label}
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
