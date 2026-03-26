import { useMemo, useState } from 'react';

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

type ReservationTab = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

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
  const initialTab = useMemo<ReservationTab>(() => {
    if (reservations.some((reservation) => reservation.status === 'PENDING')) {
      return 'PENDING';
    }
    if (reservations.some((reservation) => reservation.status === 'CONFIRMED')) {
      return 'CONFIRMED';
    }
    return 'CANCELLED';
  }, [reservations]);
  const [activeTab, setActiveTab] = useState<ReservationTab>(initialTab);

  const groupedReservations = useMemo(
    () => ({
      PENDING: reservations.filter((reservation) => reservation.status === 'PENDING'),
      CONFIRMED: reservations.filter((reservation) => reservation.status === 'CONFIRMED'),
      CANCELLED: reservations.filter((reservation) => reservation.status === 'CANCELLED')
    }),
    [reservations]
  );

  const visibleReservations = groupedReservations[activeTab];

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
          <>
            <div className="account-tab-row reservation-tab-row">
              <button
                type="button"
                className={`account-tab-button ${activeTab === 'PENDING' ? 'account-tab-button-active' : ''}`}
                onClick={() => setActiveTab('PENDING')}
              >
                예약 대기
              </button>
              <button
                type="button"
                className={`account-tab-button ${activeTab === 'CONFIRMED' ? 'account-tab-button-active' : ''}`}
                onClick={() => setActiveTab('CONFIRMED')}
              >
                예약 확정
              </button>
              <button
                type="button"
                className={`account-tab-button ${activeTab === 'CANCELLED' ? 'account-tab-button-active' : ''}`}
                onClick={() => setActiveTab('CANCELLED')}
              >
                예약 취소
              </button>
            </div>

            {visibleReservations.length === 0 ? (
              <div className={`reservation-tab-empty reservation-tab-empty-${activeTab.toLowerCase()}`}>
                <p className="empty-state">{formatStatus(activeTab)} 상태의 예약이 없습니다.</p>
              </div>
            ) : (
              <div className={`reservation-card-list reservation-card-list-${activeTab.toLowerCase()}`}>
                {visibleReservations.map((reservation) => (
                  <button
                    key={reservation.reservationId}
                    type="button"
                    className={`reservation-summary-card reservation-summary-card-${reservation.status.toLowerCase()} ${
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
          </>
        )}
      </div>
    </section>
  );
}
