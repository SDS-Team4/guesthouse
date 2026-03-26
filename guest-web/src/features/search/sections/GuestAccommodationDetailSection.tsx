type AccommodationAvailabilityCategory = 'AVAILABLE' | 'CONDITION_MISMATCH' | 'SOLD_OUT';

type AccommodationDetail = {
  accommodationId: number;
  accommodationName: string;
  region: string;
  address: string;
  infoText: string | null;
  checkInTime: string;
  checkOutTime: string;
  availabilityCategory: AccommodationAvailabilityCategory;
  roomTypes: Array<{
    roomTypeId: number;
    roomTypeName: string;
    baseCapacity: number;
    maxCapacity: number;
    basePrice: number;
    previewPrice: number;
    totalRoomCount: number;
    availableRoomCount: number;
    matchesGuestCount: boolean;
    availabilityCategory: AccommodationAvailabilityCategory;
  }>;
};

type RoomTypeCalendarDay = {
  date: string;
  availableRoomCount: number;
  soldOut: boolean;
};

type RoomTypeCalendar = {
  days: RoomTypeCalendarDay[];
};

type GuestAccommodationDetailSectionProps = {
  businessToday: string;
  searchCheckInDate: string;
  searchCheckOutDate: string;
  searchGuestCount: string;
  selectedAccommodationId: number | null;
  selectedRoomTypeId: number | null;
  selectedRoomTypeName: string | null;
  accommodationDetail: AccommodationDetail | null;
  calendar: RoomTypeCalendar | null;
  userSignedIn: boolean;
  creatingReservation: number | null;
  onOpenCalendar: (roomTypeId: number) => void;
  onCloseCalendar: () => void;
  onReserve: (roomTypeId: number) => void;
};

type CalendarCell = {
  key: string;
  label: string;
  fullDate: string;
  availableRoomCount: number | null;
  soldOut: boolean | null;
  isToday: boolean;
  isCheckIn: boolean;
  isCheckOut: boolean;
  hasInfo: boolean;
  isPlaceholder: boolean;
};

type CalendarMonthSection = {
  key: string;
  title: string;
  cells: CalendarCell[];
};

const currencyFormatter = new Intl.NumberFormat('ko-KR');
const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토'];

function formatCurrency(amount: number | null) {
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
      return '매진';
  }
}

function formatCalendarTitle(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  return `${parsed.getFullYear()}년 ${parsed.getMonth() + 1}월`;
}

function formatCalendarRangeTitle(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const sameMonth =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth();

  if (sameMonth) {
    return formatCalendarTitle(startDate);
  }

  return `${formatCalendarTitle(startDate)} - ${formatCalendarTitle(endDate)}`;
}

function toDateOnly(value: string) {
  return new Date(`${value}T00:00:00`);
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeekSunday(date: Date) {
  return addDays(date, -date.getDay());
}

function endOfWeekSaturday(date: Date) {
  return addDays(date, 6 - date.getDay());
}

function laterDate(left: Date, right: Date) {
  return left >= right ? left : right;
}

function buildCalendarCells(
  days: RoomTypeCalendarDay[],
  businessToday: string,
  searchCheckInDate: string,
  searchCheckOutDate: string
): CalendarCell[] {
  const today = toDateOnly(businessToday);
  const checkIn = toDateOnly(searchCheckInDate);
  const checkOut = toDateOnly(searchCheckOutDate);
  const desiredWeekStart = startOfWeekSunday(checkIn);
  const displayStart = laterDate(today, desiredWeekStart);

  const dayMap = new Map(days.map((day) => [day.date, day]));
  const lastKnownDate = days.length > 0 ? toDateOnly(days[days.length - 1].date) : checkOut;
  const displayEnd = endOfWeekSaturday(laterDate(lastKnownDate, checkOut));

  const cells: CalendarCell[] = [];
  for (let index = 0; index < displayStart.getDay(); index += 1) {
    cells.push({
      key: `placeholder-${index}`,
      label: '',
      fullDate: '',
      availableRoomCount: null,
      soldOut: null,
      isToday: false,
      isCheckIn: false,
      isCheckOut: false,
      hasInfo: false,
      isPlaceholder: true
    });
  }
  let cursor = new Date(displayStart);

  while (cursor <= displayEnd) {
    const isoDate = formatIsoDate(cursor);
    const info = dayMap.get(isoDate);
    cells.push({
      key: isoDate,
      label: String(cursor.getDate()),
      fullDate: isoDate,
      availableRoomCount: info?.availableRoomCount ?? null,
      soldOut: info ? info.soldOut : null,
      isToday: isoDate === businessToday,
      isCheckIn: isoDate === searchCheckInDate,
      isCheckOut: isoDate === searchCheckOutDate,
      hasInfo: Boolean(info),
      isPlaceholder: false
    });
    cursor = addDays(cursor, 1);
  }

  return cells;
}

function buildMonthSections(cells: CalendarCell[]): CalendarMonthSection[] {
  const actualCells = cells.filter((cell) => !cell.isPlaceholder && cell.fullDate);
  if (actualCells.length === 0) {
    return [];
  }

  const sections: CalendarMonthSection[] = [];
  let currentKey: string | null = null;
  let currentCells: CalendarCell[] = [];
  let currentTitle = '';

  for (const cell of actualCells) {
    const date = new Date(`${cell.fullDate}T00:00:00`);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

    if (monthKey !== currentKey) {
      if (currentKey !== null) {
        while (currentCells.length % 7 !== 0) {
          currentCells.push({
            key: `${currentKey}-tail-${currentCells.length}`,
            label: '',
            fullDate: '',
            availableRoomCount: null,
            soldOut: null,
            isToday: false,
            isCheckIn: false,
            isCheckOut: false,
            hasInfo: false,
            isPlaceholder: true
          });
        }

        sections.push({
          key: currentKey,
          title: currentTitle,
          cells: currentCells
        });
      }

      currentKey = monthKey;
      currentTitle = formatCalendarTitle(cell.fullDate);
      currentCells = [];

      for (let index = 0; index < date.getDay(); index += 1) {
        currentCells.push({
          key: `${monthKey}-head-${index}`,
          label: '',
          fullDate: '',
          availableRoomCount: null,
          soldOut: null,
          isToday: false,
          isCheckIn: false,
          isCheckOut: false,
          hasInfo: false,
          isPlaceholder: true
        });
      }
    }

    currentCells.push(cell);
  }

  while (currentCells.length % 7 !== 0) {
    currentCells.push({
      key: `${currentKey}-tail-${currentCells.length}`,
      label: '',
      fullDate: '',
      availableRoomCount: null,
      soldOut: null,
      isToday: false,
      isCheckIn: false,
      isCheckOut: false,
      hasInfo: false,
      isPlaceholder: true
    });
  }

  sections.push({
    key: currentKey ?? 'calendar',
    title: currentTitle,
    cells: currentCells
  });

  return sections;
}

export function GuestAccommodationDetailSection({
  businessToday,
  searchCheckInDate,
  searchCheckOutDate,
  searchGuestCount,
  selectedAccommodationId,
  selectedRoomTypeId,
  selectedRoomTypeName,
  accommodationDetail,
  calendar,
  userSignedIn,
  creatingReservation,
  onOpenCalendar,
  onCloseCalendar,
  onReserve
}: GuestAccommodationDetailSectionProps) {
  const calendarOpen = Boolean(selectedRoomTypeId);
  const selectedRoomType = accommodationDetail?.roomTypes.find(
    (roomType) => roomType.roomTypeId === selectedRoomTypeId
  ) ?? null;
  const calendarCells = buildCalendarCells(
    calendar?.days ?? [],
    businessToday,
    searchCheckInDate,
    searchCheckOutDate
  );
  const actualCalendarDates = calendarCells.filter((cell) => !cell.isPlaceholder && cell.fullDate);
  const firstVisibleDate = actualCalendarDates[0]?.fullDate ?? searchCheckInDate;
  const lastVisibleDate = actualCalendarDates[actualCalendarDates.length - 1]?.fullDate ?? searchCheckOutDate;
  const calendarTitle = formatCalendarRangeTitle(firstVisibleDate, lastVisibleDate);
  const calendarMonthSections = buildMonthSections(calendarCells);

  return (
    <section className="detail-page">
      {!accommodationDetail ? (
        <div className="panel">
          <p className="empty-state">숙소 목록에서 숙소를 먼저 선택해 주세요.</p>
        </div>
      ) : (
        <div className="detail-stack">
          <section className="detail-hero-card">
            <div className="detail-hero-copy">
              <span className="detail-hero-region">{accommodationDetail.region}</span>
              <h2>{accommodationDetail.accommodationName}</h2>
              <p>{accommodationDetail.address}</p>
              <p>{accommodationDetail.infoText ?? '추가 숙소 소개 문구는 아직 등록되지 않았습니다.'}</p>
            </div>

            <div className="detail-hero-meta">
              <span className={`status-pill status-${accommodationDetail.availabilityCategory.toLowerCase()}`}>
                {formatClassification(accommodationDetail.availabilityCategory)}
              </span>
              <div>체크인 {accommodationDetail.checkInTime}</div>
              <div>체크아웃 {accommodationDetail.checkOutTime}</div>
              <div>현재 검색 인원 {searchGuestCount}명</div>
            </div>
          </section>

          <section className="roomtype-grid">
            {accommodationDetail.roomTypes.map((roomType) => {
              const canReserve = roomType.matchesGuestCount && roomType.availabilityCategory === 'AVAILABLE';

              return (
                <article
                  key={roomType.roomTypeId}
                  className={`roomtype-card ${selectedRoomTypeId === roomType.roomTypeId ? 'roomtype-card-active' : ''}`}
                >
                  <div className="roomtype-card-top">
                    <div>
                      <div className="roomtype-card-kicker">객실 타입</div>
                      <h3>{roomType.roomTypeName}</h3>
                    </div>
                    <span className={`status-pill status-${roomType.availabilityCategory.toLowerCase()}`}>
                      {formatClassification(roomType.availabilityCategory)}
                    </span>
                  </div>

                  <div className="roomtype-info-grid">
                    <div>
                      <span>정원</span>
                      <strong>
                        {roomType.baseCapacity}명 - {roomType.maxCapacity}명
                      </strong>
                    </div>
                    <div>
                      <span>지금 예약시 요금</span>
                      <strong>{formatCurrency(roomType.previewPrice)}</strong>
                    </div>
                    <div>
                      <span>예약 가능 객실 수</span>
                      <strong>{roomType.availableRoomCount}개</strong>
                    </div>
                    <div className="roomtype-action-box">
                      <div className="roomtype-action-buttons">
                        <button type="button" className="secondary-button" onClick={() => onOpenCalendar(roomType.roomTypeId)}>
                          캘린더 보기
                        </button>
                        <button
                          type="button"
                          onClick={() => onReserve(roomType.roomTypeId)}
                          disabled={!canReserve || creatingReservation === roomType.roomTypeId}
                        >
                          {creatingReservation === roomType.roomTypeId
                            ? '진행 중...'
                            : userSignedIn
                              ? '예약 요청'
                              : '로그인 후 예약'}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          {calendarOpen ? (
            <div className="calendar-modal-backdrop" role="presentation" onClick={onCloseCalendar}>
              <section
                className="calendar-modal"
                role="dialog"
                aria-modal="true"
                aria-label="객실 타입 캘린더"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="calendar-modal-header">
                  <div>
                    <p className="sidebar-kicker">room type calendar</p>
                    <h3>{selectedRoomTypeName ?? '객실 타입'} 캘린더</h3>
                    <p className="muted">{calendarTitle}</p>
                  </div>
                  <button type="button" className="secondary-button" onClick={onCloseCalendar}>
                    닫기
                  </button>
                </div>

                <div className="calendar-summary-row">
                  <span className="calendar-summary-pill">오늘 {businessToday}</span>
                  <span className="calendar-summary-pill">체크인 {searchCheckInDate}</span>
                  <span className="calendar-summary-pill">체크아웃 {searchCheckOutDate}</span>
                </div>

                {!calendar ? (
                  <p className="empty-state">캘린더를 불러오는 중입니다.</p>
                ) : (
                  <div className="calendar-month-list">
                    {calendarMonthSections.map((section) => (
                      <section key={section.key} className="calendar-month-section">
                        <div className="calendar-month-heading">{section.title}</div>
                        <div className="calendar-weekdays">
                          {weekdayLabels.map((weekday) => (
                            <div key={`${section.key}-${weekday}`} className="calendar-weekday">
                              {weekday}
                            </div>
                          ))}
                        </div>
                        <div className="calendar-month-grid">
                          {section.cells.map((cell) => (
                            <article
                              key={cell.key}
                              className={[
                                'calendar-day-cell',
                                cell.isPlaceholder ? 'calendar-day-placeholder' : '',
                                !cell.hasInfo ? 'calendar-day-empty' : '',
                                cell.soldOut ? 'calendar-day-soldout' : '',
                                cell.isToday ? 'calendar-day-today' : '',
                                cell.isCheckIn ? 'calendar-day-checkin' : '',
                                cell.isCheckOut ? 'calendar-day-checkout' : ''
                              ]
                                .filter(Boolean)
                                .join(' ')}
                            >
                              <div className="calendar-day-top">
                                <strong>{cell.label}</strong>
                                <div className="calendar-day-badges">
                                  {cell.isCheckIn ? <span className="calendar-flag-badge">체크인</span> : null}
                                  {cell.isCheckOut ? <span className="calendar-flag-badge">체크아웃</span> : null}
                                </div>
                              </div>
                              <div className="calendar-day-meta">
                                {cell.isPlaceholder ? null : cell.hasInfo ? (
                                  <>
                                    <span>잔여 {cell.availableRoomCount}실</span>
                                    <span>{cell.soldOut ? '매진' : '예약 가능'}</span>
                                  </>
                                ) : null}
                              </div>
                            </article>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </section>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

