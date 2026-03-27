import { SectionCard } from '../../components/ops/SectionCard';
import { StatusPill } from '../../components/ops/StatusPill';
import type { OpsPageKey, ReservationSummary } from '../../lib/types';

type HostDashboardPageProps = {
  reservations: ReservationSummary[];
  pendingCount: number;
  blockCount: number;
  pricingCount: number;
  onNavigate: (page: OpsPageKey) => void;
  onOpenReservation: (reservationId: number) => void;
};

export function HostDashboardPage({
  reservations,
  pendingCount,
  blockCount,
  pricingCount,
  onNavigate,
  onOpenReservation
}: HostDashboardPageProps) {
  const pendingReservations = reservations.filter((reservation) => reservation.status === 'PENDING').slice(0, 4);
  const statItems = [
    { label: 'Tracked reservations', value: reservations.length, tone: 'info' as const },
    { label: 'Pending decisions', value: pendingCount, tone: 'warning' as const },
    { label: 'Active room blocks', value: blockCount, tone: 'danger' as const },
    { label: 'Active price policies', value: pricingCount, tone: 'brand' as const }
  ];

  return (
    <div className="ops-page-grid">
      <div className="ops-stat-grid">
        {statItems.map((item) => (
          <SectionCard
            key={item.label}
            title={item.label}
            actions={<StatusPill tone={item.tone}>Live</StatusPill>}
            className="ops-stat-card"
          >
            <div className="ops-stat-value">{item.value}</div>
          </SectionCard>
        ))}
      </div>

      <div className="ops-two-column">
        <SectionCard
          title="Pending reservation queue"
          subtitle="Jump into the host reservation calendar with the selected reservation already focused."
          actions={
            <button type="button" className="secondary-button" onClick={() => onNavigate('reservation-calendar')}>
              Open calendar
            </button>
          }
        >
          {pendingReservations.length === 0 ? (
            <p className="empty-state">No pending reservations are waiting for a host decision.</p>
          ) : (
            <div className="admin-list">
              {pendingReservations.map((reservation) => (
                <button
                  key={reservation.reservationId}
                  type="button"
                  className="result-card"
                  onClick={() => onOpenReservation(reservation.reservationId)}
                >
                  <div className="result-card-header">
                    <div>
                      <strong>{reservation.reservationNo}</strong>
                      <p>{reservation.guestName}</p>
                    </div>
                    <StatusPill tone="warning">PENDING</StatusPill>
                  </div>
                  <div className="result-metrics">
                    <span>{reservation.accommodationName}</span>
                    <span>{reservation.roomTypeName}</span>
                    <span>
                      {reservation.checkInDate} to {reservation.checkOutDate}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Host shortcuts" subtitle="Jump directly into the live host surfaces that matter in the demo flow.">
          <div className="ops-shortcut-grid">
            <button type="button" className="ops-shortcut" onClick={() => onNavigate('properties')}>
              <strong>Properties</strong>
              <span>Manage accommodations, room types, and rooms</span>
            </button>
            <button type="button" className="ops-shortcut" onClick={() => onNavigate('pricing')}>
              <strong>Pricing</strong>
              <span>Adjust additive room-type pricing policies</span>
            </button>
            <button type="button" className="ops-shortcut" onClick={() => onNavigate('room-blocks')}>
              <strong>Room blocks</strong>
              <span>Handle maintenance and manual room holds</span>
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
