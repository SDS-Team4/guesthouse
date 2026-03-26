type ReservationSummary = {
  reservationId: number;
  reservationNo: string;
  accommodationName: string;
  roomTypeName: string;
  guestCount: number;
  checkInDate: string;
  checkOutDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  requestedAt: string;
};

type GuestReservationListSectionProps = {
  reservations: ReservationSummary[];
  selectedReservationId: number | null;
  onOpenDetail: (reservationId: number) => void;
};

function formatStatus(status: ReservationSummary['status']) {
  switch (status) {
    case 'PENDING':
      return '예약 대기';
    case 'CONFIRMED':
      return '예약 확정';
    case 'CANCELLED':
      return '예약 취소';
  }
}

export function GuestReservationListSection({
  reservations,
  selectedReservationId,
  onOpenDetail
}: GuestReservationListSectionProps) {
  return (
    <section className="reservation-list-page">
      <div className="panel">
      <div className="panel-header">
        <div>
          <h2>예약 목록</h2>
        </div>
      </div>

        {reservations.length === 0 ? (
          <p className="empty-state">예약 이력이 없습니다.</p>
        ) : (
          <div className="reservation-card-list">
            {reservations.map((reservation) => (
              <button
                key={reservation.reservationId}
                type="button"
                className={`reservation-summary-card ${
                  selectedReservationId === reservation.reservationId ? 'reservation-summary-card-active' : ''
                }`}
                onClick={() => onOpenDetail(reservation.reservationId)}
              >
                <div className="reservation-summary-header">
                  <div>
                    <div className="reservation-summary-no">{reservation.reservationNo}</div>
                    <h3>{reservation.accommodationName}</h3>
                    <p>{reservation.roomTypeName}</p>
                  </div>
                  <span className={`status-pill status-${reservation.status.toLowerCase()}`}>
                    {formatStatus(reservation.status)}
                  </span>
                </div>
                <div className="reservation-summary-grid">
                  <div>
                    <div className="reservation-summary-label">일정</div>
                    <div>
                      {reservation.checkInDate} ~ {reservation.checkOutDate}
                    </div>
                  </div>
                  <div>
                    <div className="reservation-summary-label">인원</div>
                    <div>{reservation.guestCount}명</div>
                  </div>
                  <div>
                    <div className="reservation-summary-label">요청 시각</div>
                    <div>{new Date(reservation.requestedAt).toLocaleString('ko-KR')}</div>
                  </div>
                  <div>
                    <div className="reservation-summary-label">상세</div>
                    <div>클릭하여 확인</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
