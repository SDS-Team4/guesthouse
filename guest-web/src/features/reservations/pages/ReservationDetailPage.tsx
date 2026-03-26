import { SectionCard } from '../../../shared/ui/SectionCard';
import { guestReservationDrafts } from '../mock';

export function ReservationDetailPage() {
  const reservation = guestReservationDrafts[1];
  const cancellable = reservation.status === 'PENDING';

  return (
    <div className="space-y-6">
      <SectionCard
        title="Reservation Detail"
        subtitle="Core reservation information from the draft detail page."
        right={
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {reservation.status}
          </span>
        }
      >
        <div className="grid gap-4 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-3">
          <Metric label="Reservation No" value={reservation.reservationNo} />
          <Metric label="Accommodation" value={reservation.accommodationName} />
          <Metric label="Room type" value={reservation.roomTypeName} />
          <Metric label="Stay" value={`${reservation.checkInDate} ~ ${reservation.checkOutDate}`} />
          <Metric label="Guests" value={`${reservation.guestCount}`} />
          <Metric label="Special request" value={reservation.specialRequest ?? 'None'} />
        </div>
      </SectionCard>

      <SectionCard title="Cancellation and Policy" subtitle="Draft-only cancellation affordance for the guest flow.">
        <div className="space-y-4 text-sm text-slate-600">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            Cancellation is allowed only before check-in in the draft UI flow. This sample reservation is currently{' '}
            {cancellable ? 'cancellable.' : 'not cancellable.'}
          </div>
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">Cancel reservation</div>
              <p className="mt-1 text-sm text-slate-500">
                The button state in the UI should later be driven by backend policy fields.
              </p>
            </div>
            <button
              type="button"
              disabled={!cancellable}
              className={
                cancellable
                  ? 'rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100'
                  : 'cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-400'
              }
            >
              Cancel
            </button>
          </div>
        </div>
      </SectionCard>
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
