import type { FormEventHandler } from 'react';

type SearchFormState = {
  regions: string[];
  guestCount: string;
  checkInDate: string;
  checkOutDate: string;
};

type GuestSearchHomeSectionProps = {
  businessToday: string;
  regionOptions: readonly string[];
  searchForm: SearchFormState;
  searching: boolean;
  onSearchSubmit: FormEventHandler<HTMLFormElement>;
  onToggleRegion: (region: string) => void;
  onSelectAllRegions: () => void;
  onClearRegions: () => void;
  onGuestCountChange: (value: string) => void;
  onCheckInDateChange: (value: string) => void;
  onCheckOutDateChange: (value: string) => void;
};

export function GuestSearchHomeSection({
  businessToday,
  regionOptions,
  searchForm,
  searching,
  onSearchSubmit,
  onToggleRegion,
  onSelectAllRegions,
  onClearRegions,
  onGuestCountChange,
  onCheckInDateChange,
  onCheckOutDateChange
}: GuestSearchHomeSectionProps) {
  const hasRegionOptions = regionOptions.length > 0;
  const allSelected = hasRegionOptions && searchForm.regions.length === regionOptions.length;

  return (
    <section className="search-home-screen">
      <div className="search-home-hero">
        <div className="search-home-top">
          <div className="search-home-copy">
            <span className="search-home-eyebrow">DAUM STAY</span>
            <h1>
              원하는 일정과 인원으로
              <br />
              게스트하우스를 찾아보세요
            </h1>
            <p className="search-home-description">
              지역, 일정, 인원 조건에 맞는 숙소를 빠르게 비교하고 지금 예약 가능한 객실 타입을 한눈에
              확인해보세요.
            </p>
          </div>

          <div className="search-home-highlights" aria-hidden="true">
            <div className="search-highlight-card">
              <span>Browse</span>
              <strong>지역별 숙소 탐색</strong>
              <small>활성 숙소 지역을 기준으로 자연스럽게 둘러볼 수 있습니다.</small>
            </div>
            <div className="search-highlight-card">
              <span>Inventory</span>
              <strong>실시간 재고 확인</strong>
              <small>숙소 상세에서 날짜별 객실 타입 재고를 바로 확인할 수 있습니다.</small>
            </div>
            <div className="search-highlight-card">
              <span>Book</span>
              <strong>바로 예약 흐름</strong>
              <small>조건 확인 후 예약 요청까지 끊기지 않는 흐름으로 이어집니다.</small>
            </div>
          </div>
        </div>

        <form className="search-home-bar" onSubmit={onSearchSubmit}>
          <div className="search-pill-field search-pill-field-regions">
            <div className="search-pill-head">
              <span>지역</span>
              {hasRegionOptions ? (
                <div className="search-pill-actions">
                  <button
                    type="button"
                    className={`search-mini-action ${allSelected ? 'search-mini-action-active' : ''}`}
                    onClick={onSelectAllRegions}
                  >
                    전체 선택
                  </button>
                  <button type="button" className="search-mini-action" onClick={onClearRegions}>
                    전체 취소
                  </button>
                </div>
              ) : null}
            </div>
            <div className="search-region-options">
              {hasRegionOptions ? (
                regionOptions.map((region) => {
                  const selected = searchForm.regions.includes(region);
                  return (
                    <button
                      key={region}
                      type="button"
                      className={selected ? 'search-region-chip search-region-chip-active' : 'search-region-chip'}
                      onClick={() => onToggleRegion(region)}
                    >
                      {region}
                    </button>
                  );
                })
              ) : (
                <span className="search-region-empty">
                  전체 검색은 가능하지만 선택 가능한 지역 목록을 아직 불러오지 못했습니다.
                </span>
              )}
            </div>
          </div>

          <label className="search-pill-field">
            <span>체크인</span>
            <input
              type="date"
              min={businessToday}
              value={searchForm.checkInDate}
              onChange={(event) => onCheckInDateChange(event.target.value)}
            />
          </label>
          <label className="search-pill-field">
            <span>체크아웃</span>
            <input
              type="date"
              min={searchForm.checkInDate || businessToday}
              value={searchForm.checkOutDate}
              onChange={(event) => onCheckOutDateChange(event.target.value)}
            />
          </label>
          <label className="search-pill-field">
            <span>인원</span>
            <input
              type="number"
              min={1}
              value={searchForm.guestCount}
              onChange={(event) => onGuestCountChange(event.target.value)}
            />
          </label>
          <button type="submit" className="search-submit-button" disabled={searching}>
            {searching ? '검색 중...' : '검색'}
          </button>
        </form>
      </div>
    </section>
  );
}
