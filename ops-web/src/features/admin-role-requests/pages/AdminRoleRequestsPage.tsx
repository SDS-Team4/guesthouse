import { adminRoleRequests } from '../../admin-core/mock';
import { SectionCard } from '../../../shared/ui/SectionCard';

export function AdminRoleRequestsPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
      <SectionCard title="Host Role Requests" subtitle="Admin review queue from the draft.">
        <div className="grid gap-4">
          {adminRoleRequests.map((request) => (
            <div key={request.id} className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-base font-semibold text-slate-900">{request.userName}</div>
                  <div className="mt-1 text-sm text-slate-500">{request.loginId}</div>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {request.status}
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{request.reason}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Review Panel" subtitle="UI contract placeholder for approve and reject actions.">
        <div className="space-y-3 text-sm text-slate-600">
          <div>Selected request: {adminRoleRequests[0].userName}</div>
          <div>Requested at: {adminRoleRequests[0].requestedAt}</div>
          <div>Review note field and decision action will be connected here.</div>
        </div>
        <div className="mt-5 flex gap-3">
          <button type="button" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
            Approve
          </button>
          <button type="button" className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white">
            Reject
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
