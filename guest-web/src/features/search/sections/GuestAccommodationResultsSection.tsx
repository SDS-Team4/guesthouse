type AccommodationAvailabilityCategory = 'AVAILABLE' | 'CONDITION_MISMATCH' | 'SOLD_OUT';

type AccommodationSearchResult = {
  accommodationId: number;
  accommodationName: string;
  region: string;
  availabilityCategory: AccommodationAvailabilityCategory;
  matchingRoomTypeCount: number;
  availableRoomTypeCount: number;
  lowestBasePrice: number | null;
  lowestPreviewPrice: number | null;
};

type GuestAccommodationResultsSectionProps = {
  searchResults: AccommodationSearchResult[];
  selectedAccommodationId: number | null;
  onOpenAccommodation: (accommodationId: number) => void;
};

const currencyFormatter = new Intl.NumberFormat('ko-KR');

function formatPreviewStartingPrice(amount: number | null) {
  if (amount === null) {
    return '요금 미정';
  }
  return `${currencyFormatter.format(amount)}원`;
}

function formatClassification(category: AccommodationAvailabilityCategory) {
  switch (category) {
    case 'AVAILABLE':
      return '예약 가능';
    case 'CONDITION_MISMATCH':
      return '조건 불일치';
    case 'SOLD_OUT':
      return 'sold out';
  }
}

function groupResults(searchResults: AccommodationSearchResult[]) {
  return {
    available: searchResults.filter((result) => result.availabilityCategory === 'AVAILABLE'),
    mismatch: searchResults.filter((result) => result.availabilityCategory === 'CONDITION_MISMATCH'),
    soldOut: searchResults.filter((result) => result.availabilityCategory === 'SOLD_OUT')
  };
}

function getResultDescription(result: AccommodationSearchResult) {
  switch (result.availabilityCategory) {
    case 'AVAILABLE':
      return '선택한 조건으로 바로 확인 가능한 객실 타입이 있습니다.';
    case 'CONDITION_MISMATCH':
      return '운영 중인 숙소이지만 현재 인원 또는 조건과 맞지 않는 객실 타입이 더 많습니다.';
    case 'SOLD_OUT':
      return '현재 검색 일정에는 바로 예약 가능한 객실 타입이 없습니다.';
  }
}

export function GuestAccommodationResultsSection({
  searchResults,
  selectedAccommodationId,
  onOpenAccommodation
}: GuestAccommodationResultsSectionProps) {
  const groupedResults = groupResults(searchResults);

  function renderSection(
    title: string,
    results: AccommodationSearchResult[],
    tone: 'available' | 'mismatch' | 'sold-out'
  ) {
    if (results.length === 0) {
      return null;
    }

    return (
      <section className={`result-group result-group-${tone}`} key={title}>
        {tone !== 'available' ? (
          <div className="result-group-header">
            <h3>{title}</h3>
          </div>
        ) : null}
        <div className="result-list">
          {results.map((result) => (
            <button
              key={result.accommodationId}
              type="button"
              className={[
                'result-card',
                `result-card-${tone}`,
                result.accommodationId === selectedAccommodationId ? 'result-card-active' : ''
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onOpenAccommodation(result.accommodationId)}
            >
              <div className="result-card-header">
                <div className="result-card-title-block">
                  <div className="result-card-region">{result.region}</div>
                  <strong>{result.accommodationName}</strong>
                  <p className="result-card-description">{getResultDescription(result)}</p>
                </div>
                <span className={`status-pill status-${result.availabilityCategory.toLowerCase()}`}>
                  {formatClassification(result.availabilityCategory)}
                </span>
              </div>

              <div className="result-card-body">
                <div className="result-metrics-grid">
                  <div>
                    <span>조건 일치 객실 타입</span>
                    <strong>{result.matchingRoomTypeCount}개</strong>
                  </div>
                  <div>
                    <span>예약 가능 객실 타입</span>
                    <strong>{result.availableRoomTypeCount}개</strong>
                  </div>
                </div>

                <div className="result-price-callout">
                  <span>지금 예약시 요금</span>
                  <strong>{formatPreviewStartingPrice(result.lowestPreviewPrice)}~</strong>
                </div>
              </div>

              <div className="result-card-footer">
                <span>객실 타입별 재고와 캘린더를 확인할 수 있습니다.</span>
                <strong>상세 보기</strong>
              </div>
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="result-page">
      <div className="result-page-header">
        <div className="result-page-header-copy">
          <h2>숙소 목록</h2>
          <p>지금 예약 가능한 숙소를 먼저 보여드리고, 조건이 다른 숙소와 매진된 숙소는 아래에서 따로 안내합니다.</p>
        </div>
        <div className="result-summary-card">
          <span>검색 결과</span>
          <strong>{searchResults.length}곳</strong>
        </div>
      </div>

      {searchResults.length === 0 ? (
        <div className="panel result-empty-panel">
          <p className="empty-state">현재 검색 조건과 일치하는 숙소가 없습니다.</p>
        </div>
      ) : (
        <div className="result-group-list">
          {renderSection('조건에 맞는 방', groupedResults.available, 'available')}
          {renderSection('여기서부터는 검색 조건에 맞지 않아요', groupedResults.mismatch, 'mismatch')}
          {renderSection('sold out', groupedResults.soldOut, 'sold-out')}
        </div>
      )}
    </section>
  );
}
