import { hostProperties, hostRoomTypes } from '../../host-core/mock';
import { HostPage } from '../../host-core/types';
import { SectionCard } from '../../../shared/ui/SectionCard';

type HostPropertyDetailPageProps = {
  onNavigate: (page: HostPage) => void;
};

export function HostPropertyDetailPage({ onNavigate }: HostPropertyDetailPageProps) {
  const property = hostProperties[0];
  const roomTypes = hostRoomTypes.filter((item) => item.propertyId === property.id);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
      <SectionCard
        title={property.name}
        subtitle="Property detail operations extracted from the host draft."
      >
        <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
          <div>Region: {property.region}</div>
          <div>Contact: {property.contact}</div>
          <div>Check-in: {property.checkInTime}</div>
          <div>Check-out: {property.checkOutTime}</div>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">{property.info}</p>
      </SectionCard>

      <SectionCard title="Related slices" subtitle="These tabs should become real feature routes later.">
        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => onNavigate('property-form')}
            className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm hover:bg-slate-50"
          >
            Edit property
          </button>
          <button
            type="button"
            onClick={() => onNavigate('room-types')}
            className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm hover:bg-slate-50"
          >
            Open room types ({roomTypes.length})
          </button>
          <button
            type="button"
            onClick={() => onNavigate('reservation-list')}
            className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm hover:bg-slate-50"
          >
            Open reservations
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
