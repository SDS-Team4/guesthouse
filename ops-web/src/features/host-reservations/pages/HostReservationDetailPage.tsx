import { hostReservations, hostRooms } from '../../host-core/mock';
import { SectionCard } from '../../../shared/ui/SectionCard';

export function HostReservationDetailPage() {
  const reservation = hostReservations[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
      <SectionCard title="Reservation Detail" subtitle="Approval, rejection, and reassignment area from the host draft.">
        <div className="grid gap-3 text-sm text-slate-600">
          <div>Reservation No: {reservation.reservationNo}</div>
          <div>Guest: {reservation.guestName}</div>
          <div>Property: {reservation.propertyName}</div>
          <div>Room Type: {reservation.roomTypeName}</div>
          <div>
            Stay: {reservation.checkInDate} - {reservation.checkOutDate}
          </div>
          <div>Status: {reservation.status}</div>
          <div>Request note: {reservation.requestNote ?? 'None'}</div>
        </div>
      </SectionCard>

      <SectionCard title="Night Assignment Snapshot" subtitle="This grid is the future backend contract for nightly room reassignment.">
        <div className="grid gap-2 text-sm text-slate-600">
          {hostRooms.map((room) => (
            <div key={room.id} className="rounded-xl border border-slate-200 px-4 py-3">
              Room {room.roomNo} · roomType {room.roomTypeId}
            </div>
          ))}
        </div>
        <div className="mt-5 flex gap-3">
          <button type="button" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
            Approve
          </button>
          <button type="button" className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white">
            Reject
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
