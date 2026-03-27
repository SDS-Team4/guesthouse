import { SectionCard } from '../../components/ops/SectionCard';
import { StatusPill } from '../../components/ops/StatusPill';
import { formatStatusFilter, formatTimestamp, statusFilters } from '../../lib/format';
import type { ReservationSummary, StatusFilter } from '../../lib/types';

type ReservationsPageProps = {
  reservations: ReservationSummary[];
  statusFilter: StatusFilter;
  selectedReservationId: number | null;
  showCalendarAction: boolean;
  refreshing: boolean;
  decisioningReservationId: number | null;
  rejectReasons: Record<number, string>;
  onFilterChange: (filter: StatusFilter) => void;
  onRefresh: () => void;
  onOpenDetail: (reservationId: number) => void;
  onOpenCalendar: (reservation: ReservationSummary) => void;
  onApprove: (reservation: ReservationSummary) => void;
  onReject: (reservation: ReservationSummary) => void;
  onRejectReasonChange: (reservationId: number, value: string) => void;
};

export function ReservationsPage({
  reservations,
  statusFilter,
  selectedReservationId,
  showCalendarAction,
  refreshing,
  decisioningReservationId,
  rejectReasons,
  onFilterChange,
  onRefresh,
  onOpenDetail,
  onOpenCalendar,
  onApprove,
  onReject,
  onRejectReasonChange
}: ReservationsPageProps) {
  return (
    <SectionCard
      title="Reservation list"
      subtitle="Pending and confirmed reservations remain inventory-consuming. Reassignment is allowed only for today and future nights."
      actions={
        <button type="button" className="secondary-button" onClick={onRefresh}>
          {refreshing ? 'Refreshing...' : 'Refresh list'}
        </button>
      }
    >
      <div className="filter-row">
        {statusFilters.map((filter) => (
          <button
            key={filter}
            type="button"
            className={filter === statusFilter ? 'filter-chip filter-chip-active' : 'filter-chip'}
            onClick={() => onFilterChange(filter)}
          >
            {formatStatusFilter(filter)}
          </button>
        ))}
      </div>

      {reservations.length === 0 ? (
        <p className="empty-state">No reservations match the current filter.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Reservation</th>
                <th>Guest</th>
                <th>Accommodation</th>
                <th>Room type</th>
                <th>Guests</th>
                <th>Stay</th>
                <th>Signals</th>
                <th>Timestamps</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => {
                const isWorking = decisioningReservationId === reservation.reservationId;
                const isSelected = reservation.reservationId === selectedReservationId;

                return (
                  <tr key={reservation.reservationId} className={isSelected ? 'table-row-selected' : undefined}>
                    <td>
                      <strong>{reservation.reservationNo}</strong>
                      <div className="row-subtext">ID {reservation.reservationId}</div>
                      <span className={`status-pill status-${reservation.status.toLowerCase()}`}>{reservation.status}</span>
                    </td>
                    <td>
                      {reservation.guestName}
                      <div className="row-subtext">{reservation.guestLoginId}</div>
                    </td>
                    <td>{reservation.accommodationName}</td>
                    <td>{reservation.roomTypeName}</td>
                    <td>{reservation.guestCount}</td>
                    <td>
                      {reservation.checkInDate} to {reservation.checkOutDate}
                    </td>
                    <td>
                      <div className="signal-list">
                        <span>{reservation.reassignmentPossible ? 'Reassignable' : 'Locked'}</span>
                        <span>{reservation.hasRelevantBlocks ? 'Block overlap' : 'No block overlap'}</span>
                        <span>{reservation.hasRelevantPricing ? 'Pricing overlap' : 'No pricing overlap'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="row-subtext">Requested {formatTimestamp(reservation.requestedAt)}</div>
                      {reservation.confirmedAt ? (
                        <div className="row-subtext">Confirmed {formatTimestamp(reservation.confirmedAt)}</div>
                      ) : null}
                      {reservation.cancelledAt ? (
                        <div className="row-subtext">Cancelled {formatTimestamp(reservation.cancelledAt)}</div>
                      ) : null}
                    </td>
                    <td>
                      <div className="action-stack">
                        <button type="button" className="secondary-button" onClick={() => onOpenDetail(reservation.reservationId)}>
                          Open detail
                        </button>
                        {showCalendarAction ? (
                          <button type="button" className="secondary-button" onClick={() => onOpenCalendar(reservation)}>
                            Open calendar
                          </button>
                        ) : null}
                        {reservation.status === 'PENDING' ? (
                          <>
                            <button type="button" disabled={isWorking} onClick={() => onApprove(reservation)}>
                              {isWorking ? 'Working...' : 'Approve'}
                            </button>
                            <input
                              value={rejectReasons[reservation.reservationId] ?? ''}
                              placeholder="Optional reject reason"
                              onChange={(event) => onRejectReasonChange(reservation.reservationId, event.target.value)}
                            />
                            <button type="button" className="danger-button" disabled={isWorking} onClick={() => onReject(reservation)}>
                              {isWorking ? 'Working...' : 'Reject'}
                            </button>
                          </>
                        ) : (
                          <StatusPill tone="default">Read-only</StatusPill>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
