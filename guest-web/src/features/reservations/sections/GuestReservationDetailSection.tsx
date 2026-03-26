type ReservationDetail = {
  reservationId: number;
  reservationNo: string;
  accommodation: {
    accommodationName: string;
    region: string;
    address: string;
  };
  roomType: {
    roomTypeName: string;
  };
  guestCount: number;
  checkInDate: string;
  checkOutDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  requestedAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancellationCutoffAt: string;
  cancellationAllowed: boolean;
  cancellationBlockedReason: string | null;
  nights: Array<{
    reservationNightId: number;
    stayDate: string;
  }>;
  statusHistory: Array<{
    fromStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | null;
    toStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
    actionType:
      | 'REQUESTED'
      | 'HOST_CONFIRMED'
      | 'HOST_REJECTED'
      | 'GUEST_CANCELLED'
      | 'HOST_CANCELLED'
      | 'ADMIN_CANCELLED';
    reasonText: string | null;
    changedAt: string;
  }>;
};

type GuestReservationDetailSectionProps = {
  reservationDetail: ReservationDetail | null;
  cancellingReservation: boolean;
  onCancelReservation: () => void;
  formatTimestamp: (value: string | null) => string;
  formatReservationAction: (
    actionType: ReservationDetail['statusHistory'][number]['actionType']
  ) => string;
};

function formatStatus(status: ReservationDetail['status']) {
  switch (status) {
    case 'PENDING':
      return '예약 대기';
    case 'CONFIRMED':
      return '예약 확정';
    case 'CANCELLED':
      return '예약 취소';
  }
}

export function GuestReservationDetailSection({
  reservationDetail,
  cancellingReservation,
  onCancelReservation,
  formatTimestamp,
  formatReservationAction
}: GuestReservationDetailSectionProps) {
  return (
    <section className="reservation-detail-page">
      <div className="panel">
      <div className="panel-header">
        <div>
          <h2>예약 상세</h2>
        </div>
      </div>

        {!reservationDetail ? (
          <p className="empty-state">예약 목록에서 예약을 선택해 주세요.</p>
        ) : (
          <div className="reservation-detail-grid">
            <section className="detail-card">
              <h4>기본 정보</h4>
              <dl className="definition-list reservation-definition-list">
                <div>
                  <dt>예약 번호</dt>
                  <dd>{reservationDetail.reservationNo}</dd>
                </div>
                <div>
                  <dt>상태</dt>
                  <dd>{formatStatus(reservationDetail.status)}</dd>
                </div>
                <div>
                  <dt>체크인</dt>
                  <dd>{reservationDetail.checkInDate}</dd>
                </div>
                <div>
                  <dt>체크아웃</dt>
                  <dd>{reservationDetail.checkOutDate}</dd>
                </div>
                <div>
                  <dt>인원</dt>
                  <dd>{reservationDetail.guestCount}명</dd>
                </div>
                <div>
                  <dt>요청 시각</dt>
                  <dd>{formatTimestamp(reservationDetail.requestedAt)}</dd>
                </div>
              </dl>
            </section>

            <section className="detail-card">
              <h4>숙소 정보</h4>
              <p className="detail-line">
                <strong>{reservationDetail.accommodation.accommodationName}</strong>
              </p>
              <p className="detail-line">{reservationDetail.accommodation.region}</p>
              <p className="detail-line">{reservationDetail.accommodation.address}</p>
              <h4>객실 타입</h4>
              <p className="detail-line">{reservationDetail.roomType.roomTypeName}</p>
            </section>

            <section className="detail-card">
              <h4>숙박 일자</h4>
              <div className="night-chip-list">
                {reservationDetail.nights.map((night) => (
                  <span key={night.reservationNightId} className="night-chip">
                    {night.stayDate}
                  </span>
                ))}
              </div>
            </section>

            <section className="detail-card">
              <h4>취소</h4>
              <p className="detail-line">취소 가능 기준: {formatTimestamp(reservationDetail.cancellationCutoffAt)}</p>
              <p
                className={`cancellation-state ${
                  reservationDetail.cancellationAllowed ? 'cancellation-state-allowed' : 'cancellation-state-blocked'
                }`}
              >
                {reservationDetail.cancellationAllowed
                  ? '현재 예약 취소가 가능합니다.'
                  : reservationDetail.cancellationBlockedReason ?? '현재는 예약 취소가 불가능합니다.'}
              </p>
              <button
                type="button"
                onClick={onCancelReservation}
                disabled={!reservationDetail.cancellationAllowed || cancellingReservation}
              >
                {cancellingReservation ? '취소 처리 중...' : '예약 취소'}
              </button>
            </section>

            <section className="detail-card detail-card-wide">
              <h4>상태 이력</h4>
              {reservationDetail.statusHistory.length === 0 ? (
                <p className="empty-state">상태 이력이 없습니다.</p>
              ) : (
                <div className="history-list">
                  {reservationDetail.statusHistory.map((event) => (
                    <article key={`${event.actionType}-${event.changedAt}`} className="history-item">
                      <div className="history-header">
                        <strong>{formatReservationAction(event.actionType)}</strong>
                        <span>{formatTimestamp(event.changedAt)}</span>
                      </div>
                      <p className="detail-line">
                        {event.fromStatus ? `${event.fromStatus} -> ${event.toStatus}` : event.toStatus}
                      </p>
                      {event.reasonText ? <p className="detail-line history-reason">{event.reasonText}</p> : null}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </section>
  );
}
