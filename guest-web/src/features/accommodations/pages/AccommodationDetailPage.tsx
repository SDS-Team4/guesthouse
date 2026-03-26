import { SectionCard } from '../../../shared/ui/SectionCard';
import { guestRoomTypeDrafts } from '../mock';

type AccommodationDetailPageProps = {
  onStartReservation?: (roomTypeId: number) => void;
};

export function AccommodationDetailPage({
  onStartReservation
}: AccommodationDetailPageProps) {
  return (
    <div className="space-y-6">
      <SectionCard
        title="Accommodation Detail"
        subtitle="Guest detail page extracted from the draft UI. This screen drives the UI-first backend contract."
      >
        <div className="space-y-2 text-sm text-slate-600">
          <p className="text-base font-bold text-slate-900">Draft Guesthouse One</p>
          <p>SEOUL</p>
          <p>Draft address placeholder</p>
          <p>Check-in 15:00 / Check-out 11:00</p>
        </div>
      </SectionCard>

      <SectionCard
        title="Room Types"
        subtitle="Room-type level availability and reservation entry point."
      >
        <div className="grid gap-4">
          {guestRoomTypeDrafts.map((roomType) => (
            <div key={roomType.roomTypeId} className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-bold text-slate-900">{roomType.roomTypeName}</div>
                  <p className="mt-1 text-sm text-slate-500">
                    {roomType.baseCapacity} - {roomType.maxCapacity} guests
                  </p>
                  <p className="mt-1 text-sm text-slate-500">Base price {roomType.basePrice.toLocaleString('ko-KR')} KRW</p>
                </div>
                <button
                  type="button"
                  onClick={() => onStartReservation?.(roomType.roomTypeId)}
                  className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Reserve
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
