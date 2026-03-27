import { hostRoomTypes } from '../../host-core/mock';
import { HostPage } from '../../host-core/types';
import { SectionCard } from '../../../shared/ui/SectionCard';

type HostRoomTypesPageProps = {
  onNavigate: (page: HostPage) => void;
};

export function HostRoomTypesPage({ onNavigate }: HostRoomTypesPageProps) {
  return (
    <SectionCard
      title="Room Types"
      subtitle="Host draft slice for room-type management."
      right={
        <button
          type="button"
          onClick={() => onNavigate('room-type-form')}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          New room type
        </button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {hostRoomTypes.map((roomType) => (
          <div key={roomType.id} className="rounded-2xl border border-slate-200 p-5">
            <div className="text-lg font-semibold text-slate-900">{roomType.name}</div>
            <div className="mt-2 text-sm text-slate-600">
              Capacity {roomType.baseCapacity} - {roomType.maxCapacity}
            </div>
            <div className="mt-1 text-sm text-slate-600">Base price {roomType.basePrice.toLocaleString()} KRW</div>
            <div className="mt-3 text-xs font-medium text-slate-500">{roomType.status}</div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
