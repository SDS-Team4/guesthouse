import { adminTermsDocs } from '../../admin-core/mock';
import { SectionCard } from '../../../shared/ui/SectionCard';

export function AdminTermsPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
      <SectionCard title="Terms Documents" subtitle="Draft-based list for terms management.">
        <div className="grid gap-3">
          {adminTermsDocs.map((doc) => (
            <div key={doc.id} className="rounded-xl border border-slate-200 px-4 py-3">
              <div className="text-sm font-medium text-slate-900">{doc.title}</div>
              <div className="mt-1 text-xs text-slate-500">
                {doc.type} · {doc.version} · {doc.updatedAt}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={adminTermsDocs[0].title} subtitle="Selected document preview.">
        <pre className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
          {adminTermsDocs[0].content}
        </pre>
      </SectionCard>
    </div>
  );
}
