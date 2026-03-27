import { adminSystemLogs } from '../../admin-core/mock';
import { SectionCard } from '../../../shared/ui/SectionCard';

export function AdminSystemLogsPage() {
  return (
    <SectionCard title="System Logs" subtitle="System-log monitoring slice from the admin draft.">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="pb-3">Severity</th>
              <th className="pb-3">Source</th>
              <th className="pb-3">Message</th>
              <th className="pb-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {adminSystemLogs.map((log) => (
              <tr key={log.id} className="border-b border-slate-100 text-slate-700">
                <td className="py-4">{log.severity}</td>
                <td className="py-4">{log.source}</td>
                <td className="py-4">{log.message}</td>
                <td className="py-4">{log.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
