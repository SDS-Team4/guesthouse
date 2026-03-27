import { hostProperties, hostReservations } from '../../host-core/mock';
import { HostPage } from '../../host-core/types';
import { SectionCard } from '../../../shared/ui/SectionCard';

type HostDashboardPageProps = {
  onNavigate: (page: HostPage) => void;
};

export function HostDashboardPage({ onNavigate }: HostDashboardPageProps) {
  const pendingCount = hostReservations.filter((item) => item.status === 'PENDING').length;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr,0.9fr]">
      <SectionCard title="Host Dashboard" subtitle="Primary shortcuts from the host draft.">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-900 p-5 text-white">
            <div className="text-sm text-slate-300">Properties</div>
            <div className="mt-2 text-3xl font-bold">{hostProperties.length}</div>
          </div>
          <div className="rounded-2xl bg-amber-100 p-5 text-amber-950">
            <div className="text-sm text-amber-700">Pending Reservations</div>
            <div className="mt-2 text-3xl font-bold">{pendingCount}</div>
          </div>
          <div className="rounded-2xl bg-emerald-100 p-5 text-emerald-950">
            <div className="text-sm text-emerald-700">Room Types</div>
            <div className="mt-2 text-3xl font-bold">{hostProperties[0]?.roomTypeCount ?? 0}</div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Shortcuts" subtitle="Use these slices as the refactor targets.">
        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => onNavigate('properties')}
            className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm hover:bg-slate-50"
          >
            Manage properties
          </button>
          <button
            type="button"
            onClick={() => onNavigate('room-types')}
            className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm hover:bg-slate-50"
          >
            Manage room types
          </button>
          <button
            type="button"
            onClick={() => onNavigate('reservation-list')}
            className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm hover:bg-slate-50"
          >
            Review reservations
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
