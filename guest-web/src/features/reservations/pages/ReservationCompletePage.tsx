import { SectionCard } from '../../../shared/ui/SectionCard';
import { guestReservationDrafts } from '../mock';

type ReservationCompletePageProps = {
  onOpenDetail?: () => void;
  onOpenList?: () => void;
};

export function ReservationCompletePage({
  onOpenDetail,
  onOpenList
}: ReservationCompletePageProps) {
  const reservation = guestReservationDrafts[0];

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-3xl">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Reservation request completed</h1>
        <p className="mt-2 text-sm text-slate-500">
          The draft flow expects a pending state until host confirmation.
        </p>

        <div className="mt-6">
          <SectionCard title="Request Snapshot">
            <div className="grid gap-3 text-left text-sm text-slate-600">
              <div className="flex justify-between gap-3">
                <span>Reservation No</span>
                <span className="font-medium text-slate-900">{reservation.reservationNo}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Accommodation</span>
                <span className="font-medium text-slate-900">{reservation.accommodationName}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Room type</span>
                <span className="font-medium text-slate-900">{reservation.roomTypeName}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Stay</span>
                <span className="font-medium text-slate-900">
                  {reservation.checkInDate} ~ {reservation.checkOutDate}
                </span>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onOpenDetail}
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Open reservation detail
          </button>
          <button
            type="button"
            onClick={onOpenList}
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Open reservation list
          </button>
        </div>
      </div>
    </div>
  );
}
