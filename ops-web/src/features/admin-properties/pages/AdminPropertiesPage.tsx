import { adminProperties } from '../../admin-core/mock';
import { SectionCard } from '../../../shared/ui/SectionCard';

export function AdminPropertiesPage() {
  return (
    <SectionCard title="Properties" subtitle="Admin-wide property oversight extracted from the draft.">
      <div className="grid gap-4">
        {adminProperties.map((property) => (
          <div key={property.id} className="rounded-2xl border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-slate-900">{property.name}</div>
                <div className="mt-1 text-sm text-slate-500">
                  {property.region} · Host {property.host}
                </div>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {property.status}
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
              <div>Room types: {property.roomTypeCount}</div>
              <div>Reservations: {property.reservationCount}</div>
              <div>Pending: {property.pendingCount}</div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
