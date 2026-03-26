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

function formatCurrency(amount: number | null) {
  if (amount === null) {
    return '요금 미정';
  }
  return `${currencyFormatter.format(amount)}원`;
}

function formatPreviewStartingPrice(amount: number | null) {
  if (amount === null) {
    return '요금 미정';
  }
  return `${currencyFormatter.format(amount)}원~`;
}

function formatClassification(category: AccommodationAvailabilityCategory) {
  switch (category) {
    case 'AVAILABLE':
      return '예약 가능';
    case 'CONDITION_MISMATCH':
      return '조건에 맞지 않아요';
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
                <div>
                  <div className="result-card-region">{result.region}</div>
                  <strong>{result.accommodationName}</strong>
                </div>
                <span className={`status-pill status-${result.availabilityCategory.toLowerCase()}`}>
                  {formatClassification(result.availabilityCategory)}
                </span>
              </div>

              <div className="result-metrics-grid">
                <div>
                  <span>조건 일치 객실 타입</span>
                  <strong>{result.matchingRoomTypeCount}개</strong>
                </div>
                <div>
                  <span>예약 가능 객실 타입</span>
                  <strong>{result.availableRoomTypeCount}개</strong>
                </div>
                <div>
                  <span>지금 예약시 요금</span>
                  <strong>{formatPreviewStartingPrice(result.lowestPreviewPrice)}</strong>
                </div>
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
        <div>
          <h2>숙소 목록</h2>
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
