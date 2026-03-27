import { useEffect, useMemo, useState } from 'react';

import { SectionCard } from '../../components/ops/SectionCard';
import { StatusPill } from '../../components/ops/StatusPill';
import { formatBlockReasonType, formatTimestamp } from '../../lib/format';
import type { ReservationCalendarView, ReservationDetail, ReservationSummary } from '../../lib/types';

type DragCell = ReservationCalendarView['assignmentCells'][number];

type HostReservationCalendarPageProps = {
  reservationCalendar: ReservationCalendarView | null;
  loadingReservationCalendar: boolean;
  selectedReservationId: number | null;
  selectedReservationSummary: ReservationSummary | null;
  reservationDetail: ReservationDetail | null;
  loadingDetail: boolean;
  decisioningReservationId: number | null;
  rejectReasons: Record<number, string>;
  reassigningNightId: number | null;
  onRefresh: () => void;
  onAccommodationChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onSelectReservation: (reservationId: number) => void;
  onOpenFallbackDetail: () => void;
  onRejectReasonChange: (reservationId: number, value: string) => void;
  onApprove: (reservation: ReservationSummary) => void;
  onReject: (reservation: ReservationSummary) => void;
  onCancel: (reservation: ReservationSummary, reasonText: string) => void;
  onReassignNight: (assignmentCell: DragCell, targetRoomId: number) => void;
  onSwapNights: (sourceCell: DragCell, targetCell: DragCell) => void;
};

function statusTone(status: ReservationSummary['status']) {
  switch (status) {
    case 'PENDING':
      return 'warning' as const;
    case 'CONFIRMED':
      return 'success' as const;
    case 'CANCELLED':
      return 'default' as const;
  }
}

function shortReservationLabel(reservationNo: string, status: ReservationSummary['status']) {
  const parts = reservationNo.split('-');
  const suffix = parts[parts.length - 1] ?? reservationNo;
  const prefix = status === 'PENDING' ? 'P' : status === 'CONFIRMED' ? 'C' : 'X';
  return `${prefix}-${suffix}`;
}

function sameRoomLinked(
  roomId: number,
  date: string,
  selectedReservationId: number | null,
  assignmentMap: Map<string, DragCell>
) {
  if (selectedReservationId === null) {
    return false;
  }

  const current = assignmentMap.get(`${roomId}:${date}`);
  if (!current || current.reservationId !== selectedReservationId) {
    return false;
  }

  const currentDate = new Date(`${date}T00:00:00Z`);
  const prevDate = new Date(currentDate);
  prevDate.setDate(prevDate.getDate() - 1);
  const nextDate = new Date(currentDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const prevIso = prevDate.toISOString().slice(0, 10);
  const nextIso = nextDate.toISOString().slice(0, 10);

  return (
    assignmentMap.get(`${roomId}:${prevIso}`)?.reservationId === selectedReservationId ||
    assignmentMap.get(`${roomId}:${nextIso}`)?.reservationId === selectedReservationId
  );
}

export function HostReservationCalendarPage({
  reservationCalendar,
  loadingReservationCalendar,
  selectedReservationId,
  selectedReservationSummary,
  reservationDetail,
  loadingDetail,
  decisioningReservationId,
  rejectReasons,
  reassigningNightId,
  onRefresh,
  onAccommodationChange,
  onStartDateChange,
  onSelectReservation,
  onOpenFallbackDetail,
  onRejectReasonChange,
  onApprove,
  onReject,
  onCancel,
  onReassignNight,
  onSwapNights
}: HostReservationCalendarPageProps) {
  const [expandedRoomTypeIds, setExpandedRoomTypeIds] = useState<number[]>([]);
  const [draggedCell, setDraggedCell] = useState<DragCell | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (!reservationCalendar) {
      setExpandedRoomTypeIds([]);
      return;
    }

    setExpandedRoomTypeIds((current) => {
      const available = reservationCalendar.roomTypes.map((item) => item.roomTypeId);
      if (current.length === 0) {
        return available;
      }

      const kept = current.filter((item) => available.includes(item));
      return kept.length === 0 ? available : kept;
    });
  }, [reservationCalendar]);

  const selectedReservation = reservationCalendar?.reservations.find((item) => item.reservationId === selectedReservationId) ?? null;
  const assignmentMap = useMemo(() => {
    const map = new Map<string, DragCell>();
    for (const cell of reservationCalendar?.assignmentCells ?? []) {
      map.set(`${cell.assignedRoomId}:${cell.stayDate}`, cell);
    }
    return map;
  }, [reservationCalendar]);
  const blockMap = useMemo(() => {
    const map = new Map<string, ReservationCalendarView['blockCells'][number]>();
    for (const cell of reservationCalendar?.blockCells ?? []) {
      map.set(`${cell.roomId}:${cell.stayDate}`, cell);
    }
    return map;
  }, [reservationCalendar]);

  const toggleRoomType = (roomTypeId: number) => {
    setExpandedRoomTypeIds((current) =>
      current.includes(roomTypeId) ? current.filter((item) => item !== roomTypeId) : [...current, roomTypeId]
    );
  };

  const handleDrop = (roomId: number, date: string) => {
    if (!draggedCell) {
      return;
    }

    const targetKey = `${roomId}:${date}`;
    const targetOccupant = assignmentMap.get(targetKey);
    const blockedCell = blockMap.get(targetKey);
    const invalidDateMove = date !== draggedCell.stayDate;
    const occupiedByAnotherReservation =
      targetOccupant !== undefined && targetOccupant.reservationNightId !== draggedCell.reservationNightId;

    if (
      invalidDateMove ||
      blockedCell ||
      draggedCell.assignedRoomId === roomId ||
      !draggedCell.reassignmentAllowed
    ) {
      setDraggedCell(null);
      return;
    }

    if (occupiedByAnotherReservation) {
      if (!targetOccupant.reassignmentAllowed) {
        setDraggedCell(null);
        return;
      }

      onSwapNights(draggedCell, targetOccupant);
      setDraggedCell(null);
      return;
    }

    onReassignNight(draggedCell, roomId);
    setDraggedCell(null);
  };

  return (
    <div className="host-calendar-stack">
      <SectionCard
        title="Reservation calendar"
        subtitle="Room/date grid is the primary host operation surface. The grid spans one year and can be scrolled horizontally."
        actions={
          <button type="button" className="secondary-button" onClick={onRefresh} disabled={loadingReservationCalendar}>
            {loadingReservationCalendar ? 'Refreshing...' : 'Refresh calendar'}
          </button>
        }
      >
        {!reservationCalendar ? (
          <p className="empty-state">Reservation calendar data is not loaded yet.</p>
        ) : reservationCalendar.accommodations.length === 0 ? (
          <p className="empty-state">No accessible accommodations are available for host calendar operations.</p>
        ) : (
          <div className="host-calendar-toolbar">
            <label>
              Accommodation
              <select
                value={reservationCalendar.selectedAccommodationId === null ? '' : String(reservationCalendar.selectedAccommodationId)}
                onChange={(event) => onAccommodationChange(event.target.value)}
              >
                {reservationCalendar.accommodations.map((item) => (
                  <option key={item.accommodationId} value={item.accommodationId}>
                    {item.accommodationName} / {item.region}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Window start
              <input type="date" value={reservationCalendar.startDate} onChange={(event) => onStartDateChange(event.target.value)} />
            </label>

            <label>
              Reservation
              <select
                value={selectedReservationId === null ? '' : String(selectedReservationId)}
                onChange={(event) => onSelectReservation(Number(event.target.value))}
              >
                {reservationCalendar.reservations.length === 0 ? <option value="">No active reservations</option> : null}
                {reservationCalendar.reservations.map((item) => (
                  <option key={item.reservationId} value={item.reservationId}>
                    {item.reservationNo} / {item.guestName}
                  </option>
                ))}
              </select>
            </label>

            <div className="calendar-ops-note">
              <strong>Interaction rule</strong>
              <span>
                Scroll horizontally across the one-year window. Drag nights to another room on the same date. Dropping on an occupied
                cell swaps the two nights.
              </span>
            </div>
          </div>
        )}
      </SectionCard>

      <div className="host-calendar-layout">
        <SectionCard
          title="Assignment grid"
          subtitle="Rows are physical rooms and columns are stay dates in the visible window."
        >
          {!reservationCalendar || reservationCalendar.roomTypes.length === 0 ? (
            <p className="empty-state">No active rooms are available for the current accommodation.</p>
          ) : (
            <div className="host-calendar-room-types">
              {reservationCalendar.roomTypes.map((roomType) => {
                const expanded = expandedRoomTypeIds.includes(roomType.roomTypeId);

                return (
                  <section key={roomType.roomTypeId} className="calendar-room-type">
                    <button type="button" className="calendar-room-type-toggle" onClick={() => toggleRoomType(roomType.roomTypeId)}>
                      <div>
                        <strong>{roomType.roomTypeName}</strong>
                        <div className="row-subtext">{roomType.rooms.length} active rooms</div>
                      </div>
                      <span>{expanded ? 'Hide' : 'Show'}</span>
                    </button>

                    {expanded ? (
                      <div className="calendar-grid-wrap">
                        <div
                          className="calendar-grid"
                          style={{
                            gridTemplateColumns: `140px repeat(${reservationCalendar.visibleDates.length}, minmax(104px, 1fr))`
                          }}
                        >
                          <div className="calendar-grid-header">Room</div>
                          {reservationCalendar.visibleDates.map((date) => (
                            <div key={date} className="calendar-grid-header calendar-grid-header-date">
                              <span>{date.slice(5)}</span>
                            </div>
                          ))}

                          {roomType.rooms.map((room) => (
                            <div key={room.roomId} className="calendar-grid-row">
                              <div className="calendar-room-label">{room.roomCode}</div>
                              {reservationCalendar.visibleDates.map((date) => {
                                const occupant = assignmentMap.get(`${room.roomId}:${date}`);
                                const block = blockMap.get(`${room.roomId}:${date}`);
                                const linked = sameRoomLinked(room.roomId, date, selectedReservationId, assignmentMap);
                                const isSelected = occupant?.reservationId === selectedReservationId;
                                const occupantReservation = occupant
                                  ? reservationCalendar.reservations.find((item) => item.reservationId === occupant.reservationId) ?? null
                                  : null;
                                const isPending = occupantReservation?.status === 'PENDING';
                                const isDragged = occupant?.reservationNightId === draggedCell?.reservationNightId;

                                const classes = [
                                  'calendar-cell',
                                  block ? 'calendar-cell-block' : '',
                                  occupant && !isSelected && isPending ? 'calendar-cell-occupied-pending' : '',
                                  occupant && !isSelected && !isPending ? 'calendar-cell-occupied-confirmed' : '',
                                  isSelected ? 'calendar-cell-selected' : '',
                                  isSelected && linked ? 'calendar-cell-selected-linked' : '',
                                  isDragged ? 'calendar-cell-dragging' : ''
                                ]
                                  .filter(Boolean)
                                  .join(' ');

                                return (
                                  <button
                                    key={`${room.roomId}:${date}`}
                                    type="button"
                                    className={classes}
                                    draggable={Boolean(isSelected && occupant?.reassignmentAllowed && reassigningNightId === null)}
                                    onDragStart={() => {
                                      if (occupant && occupant.reservationId === selectedReservationId && occupant.reassignmentAllowed) {
                                        setDraggedCell(occupant);
                                      }
                                    }}
                                    onDragEnd={() => setDraggedCell(null)}
                                    onDragOver={(event) => event.preventDefault()}
                                    onDrop={() => handleDrop(room.roomId, date)}
                                    onClick={() => {
                                      if (occupant) {
                                        onSelectReservation(occupant.reservationId);
                                      }
                                    }}
                                    title={
                                      block
                                        ? `${formatBlockReasonType(block.reasonType)}${block.reasonText ? ` / ${block.reasonText}` : ''}`
                                        : occupant
                                          ? `${occupantReservation?.reservationNo ?? 'Reservation'}`
                                          : 'Available'
                                    }
                                  >
                                    {block && !occupant ? <span className="calendar-cell-code">BLOCK</span> : null}
                                    {occupant ? (
                                      <>
                                        <span className="calendar-cell-code">
                                          {shortReservationLabel(
                                            occupantReservation?.reservationNo ?? String(occupant.reservationId),
                                            occupantReservation?.status ?? 'CONFIRMED'
                                          )}
                                        </span>
                                        <span className="calendar-cell-meta">
                                          {isSelected
                                            ? selectedReservation?.guestName ?? 'Selected reservation'
                                            : occupantReservation?.guestName ?? (isPending ? 'Pending reservation' : 'Confirmed reservation')}
                                        </span>
                                      </>
                                    ) : null}
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </section>
                );
              })}
            </div>
          )}
        </SectionCard>

        <div className="host-calendar-sidebar">
          <SectionCard
            title="Selected reservation"
            subtitle="Use the calendar to pick the reservation, then review decisions and room assignments here."
            actions={
              selectedReservationId ? (
                <button type="button" className="secondary-button" onClick={onOpenFallbackDetail}>
                  Open full detail
                </button>
              ) : null
            }
          >
            {loadingDetail ? <p className="empty-state">Loading reservation detail...</p> : null}
            {!loadingDetail && !reservationDetail ? (
              <p className="empty-state">Choose one reservation from the grid or selector to load the operational sidebar.</p>
            ) : reservationDetail ? (
              <div className="host-calendar-sidebar-stack">
                <div className="calendar-reservation-header">
                  <div>
                    <h3>{reservationDetail.reservationNo}</h3>
                    <p className="detail-line">
                      {reservationDetail.guest.guestName} / {reservationDetail.guest.guestLoginId}
                    </p>
                  </div>
                  <StatusPill tone={statusTone(reservationDetail.status)}>{reservationDetail.status}</StatusPill>
                </div>

                <dl className="definition-list">
                  <div><dt>Accommodation</dt><dd>{reservationDetail.accommodation.accommodationName}</dd></div>
                  <div><dt>Room type</dt><dd>{reservationDetail.roomType.roomTypeName}</dd></div>
                  <div><dt>Stay</dt><dd>{reservationDetail.checkInDate} to {reservationDetail.checkOutDate}</dd></div>
                  <div><dt>Guests</dt><dd>{reservationDetail.guestCount}</dd></div>
                  <div><dt>Requested</dt><dd>{formatTimestamp(reservationDetail.requestedAt)}</dd></div>
                  <div><dt>Blocks</dt><dd>{reservationDetail.hasRelevantBlocks ? 'Overlap present' : 'No overlap'}</dd></div>
                </dl>

                <section className="detail-card">
                  <h4>Decision actions</h4>
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
                  <h4>Cancellation</h4>
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

                <section className="detail-card">
                  <h4>Nightly assignment summary</h4>
                  <div className="history-list">
                    {reservationDetail.nights.map((night) => (
                      <article key={night.reservationNightId} className="history-item">
                        <div className="history-header">
                          <strong>{night.stayDate}</strong>
                          <span>
                            {night.assignedRoomCode} / {night.assignedRoomTypeName}
                          </span>
                        </div>
                        <p className="detail-line">
                          {night.reassignmentAllowed ? 'Drag this night within the same date column.' : night.reassignmentBlockedReason ?? 'Locked night'}
                        </p>
                        {night.assignedRoomBlocked ? <p className="detail-line history-reason">Assigned room currently overlaps an active block.</p> : null}
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            ) : null}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
