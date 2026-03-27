import { hostReservations } from '../../host-core/mock';
import { HostPage } from '../../host-core/types';
import { SectionCard } from '../../../shared/ui/SectionCard';

type HostReservationListPageProps = {
  onNavigate: (page: HostPage) => void;
};

export function HostReservationListPage({ onNavigate }: HostReservationListPageProps) {
  return (
    <SectionCard
      title="Reservation List"
      subtitle="Host-side operational queue from the draft."
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="pb-3">Reservation</th>
              <th className="pb-3">Property</th>
              <th className="pb-3">Guest</th>
              <th className="pb-3">Dates</th>
              <th className="pb-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {hostReservations.map((reservation) => (
              <tr
                key={reservation.id}
                className="cursor-pointer border-b border-slate-100 text-slate-700 hover:bg-slate-50"
                onClick={() => onNavigate('reservation-detail')}
              >
                <td className="py-4">{reservation.reservationNo}</td>
                <td className="py-4">{reservation.propertyName}</td>
                <td className="py-4">{reservation.guestName}</td>
                <td className="py-4">
                  {reservation.checkInDate} - {reservation.checkOutDate}
                </td>
                <td className="py-4">{reservation.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
