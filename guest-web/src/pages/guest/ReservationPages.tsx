import { SectionCard } from '../../components/guest/SectionCard';
import { StatusBadge } from '../../components/guest/StatusBadge';
import { formatDateRange, formatTimestamp } from '../../lib/date';
import {
  ReservationActionType,
  ReservationDetail,
  ReservationListFilterState,
  ReservationStatus,
  ReservationSummary
} from '../../lib/types';

function reservationBadge(status: ReservationStatus) {
  switch (status) {
    case 'PENDING':
      return { variant: 'pending' as const, label: '예약 대기' };
    case 'CONFIRMED':
      return { variant: 'confirmed' as const, label: '예약 확정' };
    case 'CANCELLED':
      return { variant: 'cancelled' as const, label: '예약 취소' };
  }
}

function formatReservationAction(actionType: ReservationActionType) {
  switch (actionType) {
    case 'REQUESTED':
      return '예약 요청';
    case 'HOST_CONFIRMED':
      return '호스트 확정';
    case 'HOST_REJECTED':
      return '호스트 거절';
    case 'GUEST_CANCELLED':
      return '게스트 취소';
    case 'HOST_CANCELLED':
      return '호스트 취소';
    case 'ADMIN_CANCELLED':
      return '관리자 취소';
  }
}

type ReservationListPageProps = {
  filter: ReservationListFilterState;
  reservations: ReservationSummary[];
  refreshingReservations: boolean;
  onFilterChange: (field: keyof ReservationListFilterState, value: string) => void;
  onRefresh: () => void;
  onOpenDetail: (reservationId: number) => void;
};

export function ReservationListPage({
  filter,
  reservations,
  refreshingReservations,
  onFilterChange,
  onRefresh,
  onOpenDetail
}: ReservationListPageProps) {
  return (
    <div className="stack">
      <SectionCard
        title="예약 내역"
        subtitle="현재 API는 전체 내역을 내려주고, 화면에서 상태/기간 필터를 적용합니다."
        actions={
          <button type="button" className="secondary-button" onClick={onRefresh} disabled={refreshingReservations}>
            {refreshingReservations ? '새로고침 중...' : '목록 새로고침'}
          </button>
        }
      >
        <div className="reservation-filter-grid">
          <label>
            상태
            <select value={filter.status} onChange={(event) => onFilterChange('status', event.target.value)}>
              <option value="ALL">전체</option>
              <option value="PENDING">예약 대기</option>
              <option value="CONFIRMED">예약 확정</option>
              <option value="CANCELLED">예약 취소</option>
            </select>
          </label>
          <label>
            시작일
            <input
              type="date"
              value={filter.dateFrom}
              onChange={(event) => onFilterChange('dateFrom', event.target.value)}
            />
          </label>
          <label>
            종료일
            <input
              type="date"
              value={filter.dateTo}
              onChange={(event) => onFilterChange('dateTo', event.target.value)}
            />
          </label>
        </div>
      </SectionCard>

      {reservations.length === 0 ? (
        <SectionCard title="예약 내역" subtitle="표시할 예약이 없습니다.">
          <p className="empty-state">조건에 맞는 예약이 없습니다.</p>
        </SectionCard>
      ) : (
        <div className="reservation-list-grid">
          {reservations.map((reservation) => (
            <button
              key={reservation.reservationId}
              type="button"
              className="reservation-row-card"
              onClick={() => onOpenDetail(reservation.reservationId)}
            >
              <div className="reservation-row-header">
                <div>
                  <div className="label-caption">{reservation.reservationNo}</div>
                  <strong>{reservation.accommodationName}</strong>
                  <p className="muted">{reservation.roomTypeName}</p>
                </div>
                <StatusBadge {...reservationBadge(reservation.status)} />
              </div>
              <div className="reservation-row-meta">
                <span>일정 {formatDateRange(reservation.checkInDate, reservation.checkOutDate)}</span>
                <span>인원 {reservation.guestCount}명</span>
                <span>요청 {formatTimestamp(reservation.requestedAt)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type ReservationDetailPageProps = {
  reservationDetail: ReservationDetail | null;
  loadingReservationDetail: boolean;
  cancellingReservation: boolean;
  onRefresh: () => void;
  onCancelReservation: () => void;
};

export function ReservationDetailPage({
  reservationDetail,
  loadingReservationDetail,
  cancellingReservation,
  onRefresh,
  onCancelReservation
}: ReservationDetailPageProps) {
  if (!reservationDetail) {
    return (
      <SectionCard title="예약 상세" subtitle="먼저 목록에서 예약을 선택해 주세요.">
        <p className="empty-state">선택된 예약이 없습니다.</p>
      </SectionCard>
    );
  }

  return (
    <div className="stack">
      <SectionCard
        title="예약 상세"
        subtitle="현재 working UI가 제공하던 night/history/cancel 정보를 그대로 유지합니다."
        actions={
          <button type="button" className="secondary-button" onClick={onRefresh} disabled={loadingReservationDetail}>
            {loadingReservationDetail ? '불러오는 중...' : '상세 새로고침'}
          </button>
        }
      >
        <div className="page-grid page-grid-account">
          <div className="detail-card">
            <h3>기본 정보</h3>
            <dl className="definition-list compact-definition-list">
              <div>
                <dt>예약 번호</dt>
                <dd>{reservationDetail.reservationNo}</dd>
              </div>
              <div>
                <dt>상태</dt>
                <dd>
                  <StatusBadge {...reservationBadge(reservationDetail.status)} />
                </dd>
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
          </div>

          <div className="detail-card">
            <h3>숙소 / 객실 타입</h3>
            <p className="detail-line">
              <strong>{reservationDetail.accommodation.accommodationName}</strong>
            </p>
            <p className="detail-line">{reservationDetail.accommodation.region}</p>
            <p className="detail-line">{reservationDetail.accommodation.address}</p>
            <p className="detail-line">{reservationDetail.roomType.roomTypeName}</p>
          </div>

          <div className="detail-card">
            <h3>숙박일 night rows</h3>
            <div className="night-chip-list">
              {reservationDetail.nights.map((night) => (
                <span key={night.reservationNightId} className="night-chip">
                  {night.stayDate}
                </span>
              ))}
            </div>
            <p className="muted">실제 객실 번호는 guest 화면에 노출하지 않습니다.</p>
          </div>

          <div className="detail-card">
            <h3>취소 가능 여부</h3>
            <p className="detail-line">기준 시각: {formatTimestamp(reservationDetail.cancellationCutoffAt)}</p>
            <p
              className={`cancellation-state ${
                reservationDetail.cancellationAllowed
                  ? 'cancellation-state-allowed'
                  : 'cancellation-state-blocked'
              }`}
            >
              {reservationDetail.cancellationAllowed
                ? '현재 취소 가능합니다.'
                : reservationDetail.cancellationBlockedReason ?? '현재 취소할 수 없습니다.'}
            </p>
            <button
              type="button"
              disabled={!reservationDetail.cancellationAllowed || cancellingReservation}
              onClick={onCancelReservation}
            >
              {cancellingReservation ? '취소 처리 중...' : '예약 취소'}
            </button>
          </div>

          <div className="detail-card detail-card-wide">
            <h3>상태 이력</h3>
            {reservationDetail.statusHistory.length === 0 ? (
              <p className="empty-state">기록된 상태 이력이 없습니다.</p>
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
                    {event.reasonText ? <p className="muted">{event.reasonText}</p> : null}
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
