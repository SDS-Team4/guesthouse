import { SectionCard } from '../../components/guest/SectionCard';
import { StatusBadge } from '../../components/guest/StatusBadge';
import { formatCurrency, formatDateRange } from '../../lib/date';
import {
  AccommodationAvailabilityCategory,
  AccommodationDetail,
  AccommodationSearchResult,
  AuthenticatedUser,
  PageKey,
  ReservationCompleteContext,
  RoomTypeAvailability,
  RoomTypeCalendar,
  SearchFormState,
  SearchSortKey
} from '../../lib/types';

type SearchLandingPageProps = {
  searchForm: SearchFormState;
  searching: boolean;
  onFormChange: (field: keyof SearchFormState, value: string) => void;
  onSubmit: () => void;
  onNavigateToResults: () => void;
};

export function SearchLandingPage({
  searchForm,
  searching,
  onFormChange,
  onSubmit,
  onNavigateToResults
}: SearchLandingPageProps) {
  return (
    <section className="hero-search">
      <div className="hero-search-copy">
        <p className="eyebrow">Guest Browse</p>
        <h1>새 디자인으로 옮기되, 익명 탐색과 검증된 예약 흐름은 그대로 유지합니다.</h1>
        <p className="hero-copy">
          지역, 일정, 인원 조건으로 숙소를 검색하고 로그인 전에도 상세와 가용성을 확인할 수 있습니다.
        </p>
      </div>
      <div className="hero-search-card">
        <div className="hero-form-grid">
          <label>
            지역
            <input
              value={searchForm.region}
              onChange={(event) => onFormChange('region', event.target.value.toUpperCase())}
            />
          </label>
          <label>
            체크인
            <input
              type="date"
              value={searchForm.checkInDate}
              onChange={(event) => onFormChange('checkInDate', event.target.value)}
            />
          </label>
          <label>
            체크아웃
            <input
              type="date"
              value={searchForm.checkOutDate}
              onChange={(event) => onFormChange('checkOutDate', event.target.value)}
            />
          </label>
          <label>
            인원
            <input
              type="number"
              min={1}
              value={searchForm.guestCount}
              onChange={(event) => onFormChange('guestCount', event.target.value)}
            />
          </label>
        </div>
        <div className="page-actions">
          <button type="button" onClick={onSubmit} disabled={searching}>
            {searching ? '검색 중...' : '검색하기'}
          </button>
          <button type="button" className="secondary-button" onClick={onNavigateToResults}>
            현재 결과 보기
          </button>
        </div>
      </div>
    </section>
  );
}

function accommodationBadge(category: AccommodationAvailabilityCategory) {
  switch (category) {
    case 'AVAILABLE':
      return { variant: 'available' as const, label: '판매 가능' };
    case 'CONDITION_MISMATCH':
      return { variant: 'condition_mismatch' as const, label: '조건 불일치' };
    case 'SOLD_OUT':
      return { variant: 'sold_out' as const, label: '판매 완료' };
  }
}

function propertyVisualSeed(value: number) {
  return ['aurora', 'harbor', 'sunrise'][value % 3];
}

type SearchResultsPageProps = {
  searchForm: SearchFormState;
  searchResults: AccommodationSearchResult[];
  searchSort: SearchSortKey;
  searching: boolean;
  onFormChange: (field: keyof SearchFormState, value: string) => void;
  onSortChange: (value: SearchSortKey) => void;
  onSubmit: () => void;
  onOpenAccommodation: (accommodationId: number) => void;
};

export function SearchResultsPage({
  searchForm,
  searchResults,
  searchSort,
  searching,
  onFormChange,
  onSortChange,
  onSubmit,
  onOpenAccommodation
}: SearchResultsPageProps) {
  const groups: AccommodationAvailabilityCategory[] = ['AVAILABLE', 'CONDITION_MISMATCH', 'SOLD_OUT'];

  const sortResults = (items: AccommodationSearchResult[]) => {
    if (searchSort === 'price-asc') {
      return [...items].sort(
        (left, right) =>
          (left.lowestPreviewPrice ?? Number.MAX_SAFE_INTEGER) -
          (right.lowestPreviewPrice ?? Number.MAX_SAFE_INTEGER)
      );
    }
    if (searchSort === 'price-desc') {
      return [...items].sort(
        (left, right) => (right.lowestPreviewPrice ?? -1) - (left.lowestPreviewPrice ?? -1)
      );
    }
    return items;
  };

  return (
    <div className="page-grid page-grid-results">
      <SectionCard title="검색 조건" subtitle="익명 상태에서도 조건을 바꿔 결과를 다시 확인할 수 있습니다.">
        <div className="stack">
          <label>
            지역
            <input
              value={searchForm.region}
              onChange={(event) => onFormChange('region', event.target.value.toUpperCase())}
            />
          </label>
          <label>
            체크인
            <input
              type="date"
              value={searchForm.checkInDate}
              onChange={(event) => onFormChange('checkInDate', event.target.value)}
            />
          </label>
          <label>
            체크아웃
            <input
              type="date"
              value={searchForm.checkOutDate}
              onChange={(event) => onFormChange('checkOutDate', event.target.value)}
            />
          </label>
          <label>
            인원
            <input
              type="number"
              min={1}
              value={searchForm.guestCount}
              onChange={(event) => onFormChange('guestCount', event.target.value)}
            />
          </label>
          <button type="button" onClick={onSubmit} disabled={searching}>
            {searching ? '검색 중...' : '조건 다시 검색'}
          </button>
        </div>
      </SectionCard>

      <div className="stack">
        <SectionCard
          title="숙소 검색 결과"
          subtitle="SRS 흐름에 맞춰 판매 가능 → 조건 불일치 → 판매 완료 순서를 유지합니다."
          actions={
            <select value={searchSort} onChange={(event) => onSortChange(event.target.value as SearchSortKey)}>
              <option value="recommended">기본 순서</option>
              <option value="price-asc">가격 낮은 순</option>
              <option value="price-desc">가격 높은 순</option>
            </select>
          }
        >
          {searchResults.length === 0 ? <p className="empty-state">조건에 맞는 숙소가 없습니다.</p> : null}
          <div className="stack">
            {groups.map((group) => {
              const items = sortResults(searchResults.filter((result) => result.availabilityCategory === group));
              if (items.length === 0) {
                return null;
              }

              return (
                <div key={group} className="result-group">
                  <div className="result-group-header">
                    <StatusBadge {...accommodationBadge(group)} />
                    <span>{items.length}개 숙소</span>
                  </div>
                  <div className="result-grid">
                    {items.map((item) => {
                      const badge = accommodationBadge(item.availabilityCategory);
                      return (
                        <button
                          key={item.accommodationId}
                          type="button"
                          className="property-card"
                          onClick={() => onOpenAccommodation(item.accommodationId)}
                        >
                          <div
                            className={`property-visual property-visual-${propertyVisualSeed(item.accommodationId)}`}
                          >
                            <span>{item.region}</span>
                          </div>
                          <div className="property-card-body">
                            <div className="property-card-header">
                              <strong>{item.accommodationName}</strong>
                              <StatusBadge {...badge} />
                            </div>
                            <p className="muted">
                              매칭 객실 타입 {item.matchingRoomTypeCount}개 / 판매 가능 {item.availableRoomTypeCount}
                              개
                            </p>
                            <div className="property-pricing">
                              <span>기본가 {formatCurrency(item.lowestBasePrice)}</span>
                              <span>체크인 미리보기 {formatCurrency(item.lowestPreviewPrice)}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

type AccommodationDetailPageProps = {
  user: AuthenticatedUser | null;
  searchForm: SearchFormState;
  accommodationDetail: AccommodationDetail | null;
  selectedRoomTypeId: number | null;
  calendar: RoomTypeCalendar | null;
  loadingDetail: boolean;
  loadingCalendar: boolean;
  onNavigate: (page: PageKey) => void;
  onBackToResults: () => void;
  onRefreshDetail: () => void;
  onSelectRoomType: (roomTypeId: number) => void;
  onBeginReservation: (roomTypeId: number) => void;
  onRefreshCalendar: () => void;
};

export function AccommodationDetailPage({
  user,
  searchForm,
  accommodationDetail,
  selectedRoomTypeId,
  calendar,
  loadingDetail,
  loadingCalendar,
  onNavigate,
  onBackToResults,
  onRefreshDetail,
  onSelectRoomType,
  onBeginReservation,
  onRefreshCalendar
}: AccommodationDetailPageProps) {
  const selectedRoomType =
    accommodationDetail?.roomTypes.find((roomType) => roomType.roomTypeId === selectedRoomTypeId) ?? null;

  if (!accommodationDetail) {
    return (
      <SectionCard title="숙소 상세" subtitle="먼저 검색 결과에서 숙소를 선택해 주세요.">
        <div className="page-actions">
          <button type="button" className="secondary-button" onClick={onBackToResults}>
            결과 목록으로
          </button>
          <button type="button" onClick={() => onNavigate('search')}>
            검색으로 이동
          </button>
        </div>
      </SectionCard>
    );
  }

  const accommodationBadgeMeta = accommodationBadge(accommodationDetail.availabilityCategory);

  return (
    <div className="stack">
      <div className="page-actions">
        <button type="button" className="secondary-button" onClick={onBackToResults}>
          검색 결과로
        </button>
        <button type="button" className="secondary-button" onClick={onRefreshDetail} disabled={loadingDetail}>
          {loadingDetail ? '새로고침 중...' : '상세 새로고침'}
        </button>
      </div>

      <section className="detail-hero">
        <div className={`detail-visual detail-visual-${propertyVisualSeed(accommodationDetail.accommodationId)}`}>
          <span>{accommodationDetail.region}</span>
        </div>
        <div className="detail-hero-copy">
          <StatusBadge {...accommodationBadgeMeta} />
          <h1>{accommodationDetail.accommodationName}</h1>
          <p>{accommodationDetail.address}</p>
          <p className="muted">{accommodationDetail.infoText ?? '추가 숙소 설명이 아직 없습니다.'}</p>
          <div className="meta-chip-row">
            <span>체크인 {accommodationDetail.checkInTime}</span>
            <span>체크아웃 {accommodationDetail.checkOutTime}</span>
            <span>검색 인원 {searchForm.guestCount}명</span>
          </div>
        </div>
      </section>

      {!user ? (
        <div className="info-card">
          <strong>익명 탐색 유지</strong>
          <p className="detail-line">상세와 캘린더는 로그인 없이 볼 수 있고, 예약 요청 단계에서만 로그인이 필요합니다.</p>
        </div>
      ) : null}

      <SectionCard title="객실 타입" subtitle="현재 backend 계약에 맞는 가격/재고/상태를 그대로 노출합니다.">
        <div className="room-type-grid">
          {accommodationDetail.roomTypes.map((roomType) => {
            const badge = accommodationBadge(roomType.availabilityCategory);
            const canReserve = roomType.matchesGuestCount && roomType.availabilityCategory === 'AVAILABLE';
            const active = roomType.roomTypeId === selectedRoomTypeId;

            return (
              <article key={roomType.roomTypeId} className={`room-type-card ${active ? 'room-type-card-active' : ''}`}>
                <div className="room-type-card-header">
                  <div>
                    <h3>{roomType.roomTypeName}</h3>
                    <p className="muted">
                      기준 {roomType.baseCapacity}명 / 최대 {roomType.maxCapacity}명
                    </p>
                  </div>
                  <StatusBadge {...badge} />
                </div>
                <div className="definition-list compact-definition-list">
                  <div>
                    <dt>기본가</dt>
                    <dd>{formatCurrency(roomType.basePrice)}</dd>
                  </div>
                  <div>
                    <dt>체크인 미리보기</dt>
                    <dd>{formatCurrency(roomType.previewPrice)}</dd>
                  </div>
                  <div>
                    <dt>전체 객실</dt>
                    <dd>{roomType.totalRoomCount}</dd>
                  </div>
                  <div>
                    <dt>판매 가능</dt>
                    <dd>{roomType.availableRoomCount}</dd>
                  </div>
                </div>
                <div className="page-actions">
                  <button type="button" className="secondary-button" onClick={() => onSelectRoomType(roomType.roomTypeId)}>
                    예약 현황 확인
                  </button>
                  <button type="button" disabled={!canReserve} onClick={() => onBeginReservation(roomType.roomTypeId)}>
                    {user ? '예약 요청으로 이동' : '로그인 후 예약'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="예약 현황 캘린더"
        subtitle={
          selectedRoomType
            ? `${selectedRoomType.roomTypeName} / ${formatDateRange(searchForm.checkInDate, searchForm.checkOutDate)}`
            : '객실 타입을 선택하면 일자별 가용성을 확인할 수 있습니다.'
        }
        actions={
          selectedRoomTypeId ? (
            <button type="button" className="secondary-button" onClick={onRefreshCalendar} disabled={loadingCalendar}>
              {loadingCalendar ? '불러오는 중...' : '캘린더 새로고침'}
            </button>
          ) : undefined
        }
      >
        {!calendar ? (
          <p className="empty-state">아직 캘린더 데이터가 없습니다.</p>
        ) : (
          <div className="calendar-grid">
            {calendar.days.map((day) => (
              <article key={day.date} className={`calendar-card ${day.soldOut ? 'calendar-card-soldout' : ''}`}>
                <strong>{day.date}</strong>
                <span>{day.availableRoomCount}실 가능</span>
                <span>{day.soldOut ? '판매 완료' : '판매 가능'}</span>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

type ReservationRequestPageProps = {
  accommodationDetail: AccommodationDetail | null;
  selectedRoomType: RoomTypeAvailability | null;
  searchForm: SearchFormState;
  creatingReservation: boolean;
  onBack: () => void;
  onCreateReservation: () => void;
};

export function ReservationRequestPage({
  accommodationDetail,
  selectedRoomType,
  searchForm,
  creatingReservation,
  onBack,
  onCreateReservation
}: ReservationRequestPageProps) {
  if (!accommodationDetail || !selectedRoomType) {
    return (
      <SectionCard title="예약 요청" subtitle="먼저 숙소와 객실 타입을 선택해 주세요.">
        <div className="page-actions">
          <button type="button" className="secondary-button" onClick={onBack}>
            숙소 상세로 돌아가기
          </button>
        </div>
      </SectionCard>
    );
  }

  const nights = Math.max(
    1,
    Math.round(
      (new Date(searchForm.checkOutDate).getTime() - new Date(searchForm.checkInDate).getTime()) / 86400000
    )
  );
  const estimatedTotal = selectedRoomType.previewPrice * nights;

  return (
    <div className="page-grid page-grid-request">
      <SectionCard title="예약 요청" subtitle="현재 검증된 예약 API에 맞춰 stay 정보와 guest count만 서버에 전송합니다.">
        <div className="reservation-summary-grid">
          <div>
            <div className="label-caption">숙소</div>
            <strong>{accommodationDetail.accommodationName}</strong>
          </div>
          <div>
            <div className="label-caption">객실 타입</div>
            <strong>{selectedRoomType.roomTypeName}</strong>
          </div>
          <div>
            <div className="label-caption">일정</div>
            <strong>{formatDateRange(searchForm.checkInDate, searchForm.checkOutDate)}</strong>
          </div>
          <div>
            <div className="label-caption">인원</div>
            <strong>{searchForm.guestCount}명</strong>
          </div>
        </div>

        <div className="info-card">
          <strong>현재 slice의 범위</strong>
          <p className="detail-line">
            추가 요청사항 입력은 아직 guest-api 계약에 없으므로, 이번 통합에서는 서버에 전송하지 않습니다.
          </p>
          <p className="muted">예약 버튼 클릭 시에만 재고 재검증과 점유가 일어납니다.</p>
        </div>
      </SectionCard>

      <SectionCard title="요약" subtitle="디자인은 유지하되, 계산은 현재 응답으로 표현합니다.">
        <div className="stack">
          <div className="summary-row">
            <span>체크인 미리보기 단가</span>
            <strong>{formatCurrency(selectedRoomType.previewPrice)}</strong>
          </div>
          <div className="summary-row">
            <span>숙박 수</span>
            <strong>{nights}박</strong>
          </div>
          <div className="summary-row total-row">
            <span>예상 표시 금액</span>
            <strong>{formatCurrency(estimatedTotal)}</strong>
          </div>
        </div>
        <div className="page-actions">
          <button type="button" className="secondary-button" onClick={onBack}>
            이전으로
          </button>
          <button type="button" onClick={onCreateReservation} disabled={creatingReservation}>
            {creatingReservation ? '예약 생성 중...' : '예약 요청'}
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

type ReservationCompletePageProps = {
  completeContext: ReservationCompleteContext | null;
  onOpenDetail: () => void;
  onOpenList: () => void;
};

export function ReservationCompletePage({
  completeContext,
  onOpenDetail,
  onOpenList
}: ReservationCompletePageProps) {
  if (!completeContext) {
    return (
      <SectionCard title="예약 완료" subtitle="방금 생성된 예약 정보가 없습니다.">
        <div className="page-actions">
          <button type="button" onClick={onOpenList}>
            예약 목록 보기
          </button>
        </div>
      </SectionCard>
    );
  }

  return (
    <section className="completion-shell">
      <div className="completion-card">
        <div className="completion-icon">✓</div>
        <h1>예약 요청이 접수되었습니다.</h1>
        <p className="muted">호스트 승인 전까지 `PENDING` 상태로 유지되며, 재고는 계속 점유됩니다.</p>
        <div className="completion-summary">
          <StatusBadge variant="pending" label="예약 대기" />
          <div className="stack">
            <div className="summary-row">
              <span>예약 번호</span>
              <strong>{completeContext.reservation.reservationNo}</strong>
            </div>
            <div className="summary-row">
              <span>숙소명</span>
              <strong>{completeContext.accommodationName}</strong>
            </div>
            <div className="summary-row">
              <span>객실 타입</span>
              <strong>{completeContext.roomTypeName}</strong>
            </div>
            <div className="summary-row">
              <span>일정</span>
              <strong>
                {formatDateRange(
                  completeContext.reservation.checkInDate,
                  completeContext.reservation.checkOutDate
                )}
              </strong>
            </div>
          </div>
        </div>
        <div className="page-actions centered-actions">
          <button type="button" onClick={onOpenDetail}>
            예약 상세 보기
          </button>
          <button type="button" className="secondary-button" onClick={onOpenList}>
            예약 목록 보기
          </button>
        </div>
      </div>
    </section>
  );
}
