type ReservationCompleteState = {
  reservationId: number;
  reservationNo: string;
  accommodationName: string;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
};

type GuestReservationCompleteSectionProps = {
  reservation: ReservationCompleteState | null;
  onOpenReservationDetail: () => void;
  onOpenReservationList: () => void;
};

function formatStatus(status: ReservationCompleteState['status']) {
  switch (status) {
    case 'PENDING':
      return '예약 대기';
    case 'CONFIRMED':
      return '예약 확정';
    case 'CANCELLED':
      return '예약 취소';
  }
}

export function GuestReservationCompleteSection({
  reservation,
  onOpenReservationDetail,
  onOpenReservationList
}: GuestReservationCompleteSectionProps) {
  return (
    <section className="reservation-complete-shell">
      <div className="reservation-complete-card">
        <div className="reservation-complete-icon">✓</div>
        <h2>예약 완료</h2>
        <p className="muted">호스트 확정 전까지 예약은 대기 상태로 유지됩니다.</p>

        {!reservation ? (
          <p className="empty-state">완료된 예약 정보가 없습니다.</p>
        ) : (
          <div className="detail-card reservation-complete-summary">
            <div className="definition-list reservation-definition-list">
              <div>
                <dt>예약 번호</dt>
                <dd>{reservation.reservationNo}</dd>
              </div>
              <div>
                <dt>상태</dt>
                <dd>{formatStatus(reservation.status)}</dd>
              </div>
              <div>
                <dt>숙소명</dt>
                <dd>{reservation.accommodationName}</dd>
              </div>
              <div>
                <dt>객실 타입</dt>
                <dd>{reservation.roomTypeName}</dd>
              </div>
              <div>
                <dt>체크인</dt>
                <dd>{reservation.checkInDate}</dd>
              </div>
              <div>
                <dt>체크아웃</dt>
                <dd>{reservation.checkOutDate}</dd>
              </div>
            </div>
          </div>
        )}

        <div className="reservation-complete-actions">
          <button type="button" onClick={onOpenReservationDetail} disabled={!reservation}>
            예약 상세 보기
          </button>
          <button type="button" className="secondary-button" onClick={onOpenReservationList}>
            예약 목록 보기
          </button>
        </div>
      </div>
    </section>
  );
}
