type SelectedReservationRoomType = {
  roomTypeId: number;
  roomTypeName: string;
  baseCapacity: number;
  maxCapacity: number;
  basePrice: number;
  previewPrice: number;
  availableRoomCount: number;
};

type GuestReservationRequestSectionProps = {
  accommodationName: string | null;
  roomType: SelectedReservationRoomType | null;
  searchGuestCount: string;
  checkInDate: string;
  checkOutDate: string;
  creatingReservation: boolean;
  onSubmit: () => void;
};

const currencyFormatter = new Intl.NumberFormat('ko-KR');

function formatCurrency(amount: number) {
  return `${currencyFormatter.format(amount)}원`;
}

export function GuestReservationRequestSection({
  accommodationName,
  roomType,
  searchGuestCount,
  checkInDate,
  checkOutDate,
  creatingReservation,
  onSubmit
}: GuestReservationRequestSectionProps) {
  return (
    <section className="reservation-request-page">
      {!roomType ? (
        <div className="panel">
          <p className="empty-state">숙소 상세 화면에서 객실 타입을 먼저 선택해 주세요.</p>
        </div>
      ) : (
        <div className="reservation-request-grid">
          <section className="detail-card reservation-request-card">
            <h2>예약 요청</h2>
            <div className="definition-list reservation-definition-list">
              <div>
                <dt>숙소명</dt>
                <dd>{accommodationName ?? '-'}</dd>
              </div>
              <div>
                <dt>객실 타입</dt>
                <dd>{roomType.roomTypeName}</dd>
              </div>
              <div>
                <dt>체크인</dt>
                <dd>{checkInDate}</dd>
              </div>
              <div>
                <dt>체크아웃</dt>
                <dd>{checkOutDate}</dd>
              </div>
              <div>
                <dt>인원</dt>
                <dd>{searchGuestCount}명</dd>
              </div>
              <div>
                <dt>예약 가능 객실 수</dt>
                <dd>{roomType.availableRoomCount}개</dd>
              </div>
            </div>
          </section>

          <section className="detail-card reservation-request-card reservation-request-card-accent">
            <h3>요금 요약</h3>
            <p className="detail-line">기본요금 {formatCurrency(roomType.basePrice)}</p>
            <p className="detail-line">체크인 미리보기 요금 {formatCurrency(roomType.previewPrice)}</p>
            <p className="detail-line">
              정원 {roomType.baseCapacity}명 - {roomType.maxCapacity}명
            </p>
            <button type="button" onClick={onSubmit} disabled={creatingReservation}>
              {creatingReservation ? '예약 요청 중...' : '예약 요청'}
            </button>
          </section>
        </div>
      )}
    </section>
  );
}
