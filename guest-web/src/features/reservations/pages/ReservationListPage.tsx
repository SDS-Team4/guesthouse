import { SectionCard } from '../../../shared/ui/SectionCard';
import { guestReservationDrafts } from '../mock';

type ReservationListPageProps = {
  onOpenDetail?: (reservationId: number) => void;
};

export function ReservationListPage({ onOpenDetail }: ReservationListPageProps) {
  return (
    <div className="space-y-6">
      <SectionCard title="My Reservations" subtitle="Draft guest reservation list split from the original UI.">
        <div className="grid gap-3 md:grid-cols-[220px_220px_1fr]">
          <select className="rounded-xl border border-slate-300 px-3 py-3 text-sm text-slate-700 outline-none">
            <option>All statuses</option>
            <option>Pending</option>
            <option>Confirmed</option>
            <option>Cancelled</option>
          </select>
          <input
            type="text"
            defaultValue="2026-03-01 ~ 2026-05-31"
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none"
          />
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            The draft expects filters by status and date range.
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-4">
        {guestReservationDrafts.map((reservation) => (
          <button
            key={reservation.id}
            type="button"
            onClick={() => onOpenDetail?.(reservation.id)}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {reservation.reservationNo}
                </div>
                <h3 className="mt-1 text-base font-bold text-slate-900">{reservation.accommodationName}</h3>
                <p className="mt-1 text-sm text-slate-500">{reservation.roomTypeName}</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                {reservation.status}
              </span>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Stay" value={`${reservation.checkInDate} ~ ${reservation.checkOutDate}`} />
              <Metric label="Guests" value={`${reservation.guestCount}`} />
              <Metric label="Room type" value={reservation.roomTypeName} />
              <Metric label="Action" value="Open detail" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 font-medium text-slate-900">{value}</div>
    </div>
  );
}
