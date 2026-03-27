import { adminAuditLogs } from '../../admin-core/mock';
import { SectionCard } from '../../../shared/ui/SectionCard';

export function AdminAuditLogsPage() {
  return (
    <SectionCard title="Audit Logs" subtitle="Audit browsing slice from the admin draft.">
      <div className="grid gap-4">
        {adminAuditLogs.map((log) => (
          <div key={log.id} className="rounded-2xl border border-slate-200 p-5">
            <div className="text-sm font-medium text-slate-900">
              {log.actor} · {log.action}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {log.target} · {log.createdAt}
            </div>
            <div className="mt-3 grid gap-2 text-xs text-slate-600 md:grid-cols-2">
              <pre className="overflow-auto rounded-xl bg-slate-50 p-3">{log.beforeJson}</pre>
              <pre className="overflow-auto rounded-xl bg-slate-50 p-3">{log.afterJson}</pre>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
