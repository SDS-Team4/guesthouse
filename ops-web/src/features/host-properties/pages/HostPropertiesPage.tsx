import { hostProperties } from '../../host-core/mock';
import { HostPage } from '../../host-core/types';
import { SectionCard } from '../../../shared/ui/SectionCard';

type HostPropertiesPageProps = {
  onNavigate: (page: HostPage) => void;
};

export function HostPropertiesPage({ onNavigate }: HostPropertiesPageProps) {
  return (
    <SectionCard
      title="Properties"
      subtitle="List view extracted from the host draft. Later this becomes the real property management index."
      right={
        <button
          type="button"
          onClick={() => onNavigate('property-form')}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          New property
        </button>
      }
    >
      <div className="grid gap-4">
        {hostProperties.map((property) => (
          <button
            key={property.id}
            type="button"
            onClick={() => onNavigate('property-detail')}
            className="rounded-2xl border border-slate-200 p-5 text-left hover:bg-slate-50"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-slate-900">{property.name}</div>
                <div className="mt-1 text-sm text-slate-500">
                  {property.region} · {property.address}
                </div>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {property.status}
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-4">
              <div>Rooms: {property.roomCount}</div>
              <div>Room types: {property.roomTypeCount}</div>
              <div>Pending: {property.pendingReservations}</div>
              <div>Check-in: {property.checkInTime}</div>
            </div>
          </button>
        ))}
      </div>
    </SectionCard>
  );
}
