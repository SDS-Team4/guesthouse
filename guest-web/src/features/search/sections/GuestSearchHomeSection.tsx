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

function formatRegionLabel(region: string) {
  switch (region) {
    case 'SEOUL':
      return '서울';
    case 'BUSAN':
      return '부산';
    case 'JEONJU':
      return '전주';
    default:
      return region;
  }
}

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
  const allSelected = searchForm.regions.length === regionOptions.length;

  return (
    <section className="search-home-screen">
      <div className="search-home-hero">
        <div className="search-home-copy">
          <span className="search-home-eyebrow">Guesthouse stay</span>
          <h1>
            원하는 일정과 인원으로
            <br />
            게스트하우스를 찾아보세요
          </h1>
        </div>

        <form className="search-home-bar" onSubmit={onSearchSubmit}>
          <div className="search-pill-field search-pill-field-regions">
            <div className="search-pill-head">
              <span>지역</span>
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
            </div>
            <div className="search-region-options">
              {regionOptions.map((region) => {
                const selected = searchForm.regions.includes(region);
                return (
                  <button
                    key={region}
                    type="button"
                    className={selected ? 'search-region-chip search-region-chip-active' : 'search-region-chip'}
                    onClick={() => onToggleRegion(region)}
                  >
                    {formatRegionLabel(region)}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="search-pill-field">
            <span>체크인</span>
            <input type="date" min={businessToday} value={searchForm.checkInDate} onChange={(event) => onCheckInDateChange(event.target.value)} />
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
            <input type="number" min={1} value={searchForm.guestCount} onChange={(event) => onGuestCountChange(event.target.value)} />
          </label>
          <button type="submit" className="search-submit-button" disabled={searching}>
            {searching ? '검색 중...' : '검색'}
          </button>
        </form>
      </div>
    </section>
  );
}

