import { useState } from 'react';

import { SectionCard } from '../../components/ops/SectionCard';
import {
  formatBlockReasonType,
  formatPricingDayMask,
  formatPriceDelta,
  formatReservationAction,
  formatTimestamp
} from '../../lib/format';
import type { ReservationDetail, ReservationSummary } from '../../lib/types';

type ReservationDetailPageProps = {
  selectedReservationId: number | null;
  reservationDetail: ReservationDetail | null;
  loadingDetail: boolean;
  selectedReservationSummary: ReservationSummary | null;
  showCalendarAction: boolean;
  rejectReasons: Record<number, string>;
  decisioningReservationId: number | null;
  reassignmentSelections: Record<number, string>;
  reassigningNightId: number | null;
  onRefresh: () => void;
  onOpenCalendar: (reservation: ReservationSummary) => void;
  onRejectReasonChange: (reservationId: number, value: string) => void;
  onApprove: (reservation: ReservationSummary) => void;
  onReject: (reservation: ReservationSummary) => void;
  onCancel: (reservation: ReservationSummary, reasonText: string) => void;
  onReassignmentSelectionChange: (reservationNightId: number, value: string) => void;
  onReassignNight: (night: ReservationDetail['nights'][number]) => void;
};

export function ReservationDetailPage({
  selectedReservationId,
  reservationDetail,
  loadingDetail,
  selectedReservationSummary,
  showCalendarAction,
  rejectReasons,
  decisioningReservationId,
  reassignmentSelections,
  reassigningNightId,
  onRefresh,
  onOpenCalendar,
  onRejectReasonChange,
  onApprove,
  onReject,
  onCancel,
  onReassignmentSelectionChange,
  onReassignNight
}: ReservationDetailPageProps) {
  const [cancelReason, setCancelReason] = useState('');

  return (
    <SectionCard
      title="Reservation detail"
      subtitle="Detail includes nightly assignments, status history, and block/pricing context so operators can understand what is assignable right now."
      actions={
        selectedReservationId ? (
          <div className="action-group">
            {showCalendarAction && selectedReservationSummary ? (
              <button type="button" className="secondary-button" onClick={() => onOpenCalendar(selectedReservationSummary)}>
                Open calendar
              </button>
            ) : null}
            <button type="button" className="secondary-button" onClick={onRefresh} disabled={loadingDetail}>
              {loadingDetail ? 'Refreshing...' : 'Refresh detail'}
            </button>
          </div>
        ) : null
      }
    >
      {!reservationDetail ? (
        <p className="empty-state">Open one reservation from the list to inspect detail and reassignment context.</p>
      ) : (
        <div className="detail-stack">
          <div className="detail-summary">
            <div>
              <h3>{reservationDetail.reservationNo}</h3>
              <p className="detail-line">
                {reservationDetail.accommodation.accommodationName} / {reservationDetail.roomType.roomTypeName}
              </p>
              <p className="detail-line">
                {reservationDetail.checkInDate} to {reservationDetail.checkOutDate}
              </p>
            </div>
            <div className="summary-meta">
              <span className={`status-pill status-${reservationDetail.status.toLowerCase()}`}>{reservationDetail.status}</span>
              <span>{reservationDetail.reassignmentPossible ? 'Reassignment open' : 'Reassignment closed'}</span>
              <span>{reservationDetail.hasRelevantBlocks ? 'Block overlap present' : 'No block overlap'}</span>
              <span>{reservationDetail.hasRelevantPricing ? 'Pricing overlap present' : 'No pricing overlap'}</span>
            </div>
          </div>

          <div className="reservation-detail-grid">
            <section className="detail-card">
              <h4>Guest summary</h4>
              <p className="detail-line">
                <strong>{reservationDetail.guest.guestName}</strong>
              </p>
              <p className="detail-line">{reservationDetail.guest.guestLoginId}</p>
              <p className="detail-line">Guest ID {reservationDetail.guest.guestUserId}</p>
              <p className="detail-line">Guest count {reservationDetail.guestCount}</p>
            </section>

            <section className="detail-card">
              <h4>Accommodation summary</h4>
              <p className="detail-line">{reservationDetail.accommodation.accommodationName}</p>
              <p className="detail-line">{reservationDetail.accommodation.region}</p>
              <p className="detail-line">{reservationDetail.accommodation.address}</p>
              <p className="detail-line">
                Check-in {reservationDetail.checkInTime} / Check-out {reservationDetail.checkOutTime}
              </p>
            </section>

            <section className="detail-card">
              <h4>Timestamps</h4>
              <p className="detail-line">Requested {formatTimestamp(reservationDetail.requestedAt)}</p>
              <p className="detail-line">Confirmed {formatTimestamp(reservationDetail.confirmedAt)}</p>
              <p className="detail-line">Cancelled {formatTimestamp(reservationDetail.cancelledAt)}</p>
            </section>

            <section className="detail-card">
              <h4>Pending decisions</h4>
              {reservationDetail.status !== 'PENDING' || !selectedReservationSummary ? (
                <p className="empty-state">Approve/reject actions are available only while the reservation is pending.</p>
              ) : (
                <>
                  <input
                    value={rejectReasons[reservationDetail.reservationId] ?? ''}
                    placeholder="Optional reject reason"
                    onChange={(event) => onRejectReasonChange(reservationDetail.reservationId, event.target.value)}
                  />
                  <div className="action-group">
                    <button
                      type="button"
                      disabled={decisioningReservationId === reservationDetail.reservationId}
                      onClick={() => onApprove(selectedReservationSummary)}
                    >
                      {decisioningReservationId === reservationDetail.reservationId ? 'Working...' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      className="danger-button"
                      disabled={decisioningReservationId === reservationDetail.reservationId}
                      onClick={() => onReject(selectedReservationSummary)}
                    >
                      {decisioningReservationId === reservationDetail.reservationId ? 'Working...' : 'Reject'}
                    </button>
                  </div>
                </>
              )}
            </section>

            <section className="detail-card">
              <h4>Operational cancellation</h4>
              {reservationDetail.status === 'CANCELLED' || !selectedReservationSummary ? (
                <p className="empty-state">Cancelled reservations no longer expose an operational cancel action.</p>
              ) : (
                <>
                  <input
                    value={cancelReason}
                    placeholder="Cancellation reason"
                    onChange={(event) => setCancelReason(event.target.value)}
                  />
                  <div className="action-group">
                    <button
                      type="button"
                      className="danger-button"
                      disabled={decisioningReservationId === reservationDetail.reservationId}
                      onClick={() => onCancel(selectedReservationSummary, cancelReason)}
                    >
                      {decisioningReservationId === reservationDetail.reservationId ? 'Working...' : 'Cancel reservation'}
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>

          <section className="detail-card detail-card-wide">
            <h4>Nightly assignments</h4>
            <div className="night-ops-list">
              {reservationDetail.nights.map((night) => {
                const selectedRoomId = reassignmentSelections[night.reservationNightId] ?? '';
                const canSubmitReassignment =
                  night.reassignmentAllowed && night.availableReassignmentRooms.length > 0 && selectedRoomId !== '';

                return (
                  <article key={night.reservationNightId} className="night-ops-card">
                    <div className="night-ops-header">
                      <strong>{night.stayDate}</strong>
                      <span>
                        Assigned {night.assignedRoomCode} / {night.assignedRoomTypeName}
                      </span>
                    </div>
                    <div className="signal-list">
                      <span>{night.assignedRoomBlocked ? 'Assigned room currently blocked' : 'Assigned room clear'}</span>
                      <span>{night.assignedRoomTypeOverride ? 'Cross-type override active' : 'Booked room type match'}</span>
                      <span>{night.reassignmentAllowed ? 'Editable night' : night.reassignmentBlockedReason ?? 'Locked night'}</span>
                    </div>
                    {night.reassignmentAllowed ? (
                      night.availableReassignmentRooms.length === 0 ? (
                        <p className="empty-state">No valid alternative rooms are available for this night right now.</p>
                      ) : (
                        <div className="reassignment-row">
                          <select
                            value={selectedRoomId}
                            onChange={(event) => onReassignmentSelectionChange(night.reservationNightId, event.target.value)}
                          >
                            {night.availableReassignmentRooms.map((room) => (
                              <option key={room.roomId} value={room.roomId}>
                                {room.roomCode} / {room.roomTypeName}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={!canSubmitReassignment || reassigningNightId === night.reservationNightId}
                            onClick={() => onReassignNight(night)}
                          >
                            {reassigningNightId === night.reservationNightId ? 'Reassigning...' : 'Reassign night'}
                          </button>
                        </div>
                      )
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>

          <div className="reservation-detail-grid">
            <section className="detail-card">
              <h4>Block context</h4>
              {reservationDetail.blockContexts.length === 0 ? (
                <p className="empty-state">No active room blocks overlap this stay.</p>
              ) : (
                <div className="history-list">
                  {reservationDetail.blockContexts.map((block) => (
                    <article key={block.blockId} className="history-item">
                      <div className="history-header">
                        <strong>
                          {block.roomCode} / {block.roomTypeName}
                        </strong>
                        <span>
                          {block.startDate} to {block.endDate}
                        </span>
                      </div>
                      <p className="detail-line">{formatBlockReasonType(block.reasonType)}</p>
                      {block.reasonText ? <p className="detail-line history-reason">{block.reasonText}</p> : null}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="detail-card">
              <h4>Pricing context</h4>
              {reservationDetail.pricingPolicies.length === 0 ? (
                <p className="empty-state">No active pricing policies overlap the booked room type for this stay.</p>
              ) : (
                <div className="history-list">
                  {reservationDetail.pricingPolicies.map((policy) => (
                    <article key={policy.policyId} className="history-item">
                      <div className="history-header">
                        <strong>{policy.policyName}</strong>
                        <span>
                          {policy.startDate} to {policy.endDate}
                        </span>
                      </div>
                      <p className="detail-line">{policy.roomTypeName}</p>
                      <p className="detail-line">Delta {formatPriceDelta(policy.deltaAmount)}</p>
                      <p className="detail-line">{formatPricingDayMask(policy.dayOfWeekMask)}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="detail-card detail-card-wide">
              <h4>Status history</h4>
              {reservationDetail.statusHistory.length === 0 ? (
                <p className="empty-state">No status events recorded yet.</p>
              ) : (
                <div className="history-list">
                  {reservationDetail.statusHistory.map((event) => (
                    <article key={event.historyId} className="history-item">
                      <div className="history-header">
                        <strong>{formatReservationAction(event.actionType)}</strong>
                        <span>{formatTimestamp(event.changedAt)}</span>
                      </div>
                      <p className="detail-line">{event.fromStatus ? `${event.fromStatus} -> ${event.toStatus}` : event.toStatus}</p>
                      <p className="detail-line">
                        By {event.changedByName} ({event.changedByLoginId})
                      </p>
                      {event.reasonText ? <p className="detail-line history-reason">{event.reasonText}</p> : null}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
