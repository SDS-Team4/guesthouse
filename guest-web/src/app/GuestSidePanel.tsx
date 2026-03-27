import { GuestPage } from './guestPages';

type NavigationItem = {
  key: GuestPage;
  label: string;
  description: string;
  section: 'auth' | 'browse' | 'reservation';
  auth: 'all' | 'logged-in' | 'logged-out';
};

type GuestSidePanelProps = {
  currentPage: GuestPage;
  userLoginId: string | null;
  businessToday: string;
  banner: {
    tone: 'success' | 'error' | 'info';
    text: string;
  } | null;
  pendingReservationIntent: {
    accommodationId: number;
    roomTypeId: number;
  } | null;
  actions?: Array<{
    label: string;
    disabled?: boolean;
    onClick: () => void;
  }>;
  onNavigate: (page: GuestPage) => void;
};

const navigationCatalog: NavigationItem[] = [
  { key: 'login', label: '로그인', description: '게스트 로그인 화면', section: 'auth', auth: 'logged-out' },
  { key: 'signup', label: '회원가입', description: '게스트 회원가입 화면', section: 'auth', auth: 'logged-out' },
  { key: 'mypage', label: '마이페이지', description: '로그인 후 진입 허브 화면', section: 'auth', auth: 'logged-in' },
  { key: 'account-profile', label: '기본 정보', description: '프로필 조회 및 수정 화면', section: 'auth', auth: 'logged-in' },
  { key: 'account-password', label: '비밀번호 변경', description: '비밀번호 변경 전용 화면', section: 'auth', auth: 'logged-in' },
  {
    key: 'account-host-role-request',
    label: '호스트 권한 요청',
    description: '호스트 권한 요청 및 상태 확인 화면',
    section: 'auth',
    auth: 'logged-in'
  },
  { key: 'find-id', label: '아이디 찾기', description: '복구 플레이스홀더 화면', section: 'auth', auth: 'all' },
  { key: 'find-password', label: '비밀번호 찾기', description: '복구 플레이스홀더 화면', section: 'auth', auth: 'all' },
  { key: 'search', label: '메인 검색', description: '숙소 검색 조건 입력 화면', section: 'browse', auth: 'all' },
  { key: 'accommodations', label: '숙소 목록', description: '검색 결과 목록 화면', section: 'browse', auth: 'all' },
  {
    key: 'accommodation-detail',
    label: '숙소 상세',
    description: '숙소, 객실 타입, 캘린더 확인 화면',
    section: 'browse',
    auth: 'all'
  },
  {
    key: 'reservation-request',
    label: '예약 요청',
    description: '객실 타입 기준 예약 요청 화면',
    section: 'reservation',
    auth: 'logged-in'
  },
  {
    key: 'reservation-complete',
    label: '예약 완료',
    description: '예약 접수 완료 안내 화면',
    section: 'reservation',
    auth: 'logged-in'
  },
  {
    key: 'reservation-list',
    label: '예약 목록',
    description: '내 예약 목록 조회 화면',
    section: 'reservation',
    auth: 'logged-in'
  },
  {
    key: 'reservation-detail',
    label: '예약 상세',
    description: '내 예약 상세 및 취소 화면',
    section: 'reservation',
    auth: 'logged-in'
  }
];

const pageSummaries: Record<GuestPage, { title: string; detail: string }> = {
  login: { title: '로그인', detail: '게스트 세션을 시작하고 예약 흐름으로 진입합니다.' },
  signup: { title: '회원가입', detail: '필수 약관 동의와 기본 계정 정보를 입력합니다.' },
  mypage: { title: '마이페이지', detail: '계정관리와 예약 목록으로 이동하는 허브 화면입니다.' },
  'account-profile': { title: '기본 정보', detail: '이름, 이메일, 연락처를 확인하고 수정합니다.' },
  'account-password': { title: '비밀번호 변경', detail: '현재 비밀번호 확인 후 새 비밀번호로 변경합니다.' },
  'account-host-role-request': {
    title: '호스트 권한 요청',
    detail: '호스트 권한 요청 상태를 확인하고 새 요청을 제출합니다.'
  },
  'find-id': { title: '아이디 찾기', detail: '현재는 플레이스홀더로만 제공되는 복구 화면입니다.' },
  'find-password': { title: '비밀번호 찾기', detail: '현재는 플레이스홀더로만 제공되는 복구 화면입니다.' },
  search: { title: '메인 검색', detail: '체크인, 체크아웃, 지역, 인원으로 숙소를 탐색합니다.' },
  accommodations: { title: '숙소 목록', detail: '검색 결과 숙소 목록을 확인하고 상세로 이동합니다.' },
  'accommodation-detail': { title: '숙소 상세', detail: '객실 타입과 캘린더를 보고 예약 요청으로 이동합니다.' },
  'reservation-request': { title: '예약 요청', detail: '선택한 객실 타입으로 예약을 접수합니다.' },
  'reservation-complete': { title: '예약 완료', detail: '접수된 예약 요약을 확인하고 상세나 목록으로 이동합니다.' },
  'reservation-list': { title: '예약 목록', detail: '내 예약 이력을 목록으로 확인합니다.' },
  'reservation-detail': { title: '예약 상세', detail: '예약 상태, 숙박일, 취소 가능 여부를 확인합니다.' }
};

export function GuestSidePanel({
  currentPage,
  userLoginId,
  businessToday,
  banner,
  pendingReservationIntent,
  actions = [],
  onNavigate
}: GuestSidePanelProps) {
  const authState = userLoginId ? 'logged-in' : 'logged-out';
  const summary = pageSummaries[currentPage];
  const sections: Array<{ title: string; section: NavigationItem['section'] }> = [
    { title: '인증 및 계정', section: 'auth' },
    { title: '탐색', section: 'browse' },
    { title: '예약', section: 'reservation' }
  ];

  function getAccessLabel(item: NavigationItem) {
    if (item.auth === 'all') {
      return '공개';
    }
    return item.auth === authState ? '접근 가능' : '로그인 필요';
  }

  function getAccessClassName(item: NavigationItem) {
    if (item.auth === 'all') {
      return 'sidebar-access sidebar-access-public';
    }
    return item.auth === authState ? 'sidebar-access sidebar-access-allowed' : 'sidebar-access sidebar-access-locked';
  }

  return (
    <aside className="workspace-sidebar">
      <section className="sidebar-card sidebar-card-accent">
        <p className="sidebar-kicker">guest-web 워크스페이스</p>
        <h1>게스트 서비스 흐름 점검 패널</h1>
        <p className="muted">
          좌측 패널은 현재 흐름과 상태를 빠르게 확인하는 용도이고, 우측 영역에는 실제 사용자 화면만 보이도록 분리해두었습니다.
        </p>
      </section>

      <section className="sidebar-card">
        <h2>세션 상태</h2>
        <div className="sidebar-meta-list">
          <div>
            <span className="sidebar-meta-label">로그인 상태</span>
            <strong>{userLoginId ? `${userLoginId} 로그인 중` : '비로그인 탐색 모드'}</strong>
          </div>
          <div>
            <span className="sidebar-meta-label">예약 권한</span>
            <strong>{userLoginId ? '예약 요청 가능' : '예약 요청 전 로그인 필요'}</strong>
          </div>
          <div>
            <span className="sidebar-meta-label">업무 기준일</span>
            <strong>{businessToday}</strong>
          </div>
        </div>
      </section>

      <section className="sidebar-card">
        <h2>현재 화면</h2>
        <p className="sidebar-view-title">{summary.title}</p>
        <p className="muted">{summary.detail}</p>
      </section>

      <section className="sidebar-card">
        <h2>화면 목록</h2>
        {sections.map((section) => (
          <div key={section.section} className="sidebar-nav-group">
            <div className="sidebar-nav-group-title">{section.title}</div>
            <div className="sidebar-nav">
              {navigationCatalog
                .filter((item) => item.section === section.section)
                .map((item) => {
                  const disabled = item.auth !== 'all' && item.auth !== authState;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      disabled={disabled}
                      className={currentPage === item.key ? 'sidebar-nav-active' : 'secondary-button'}
                      onClick={() => onNavigate(item.key)}
                    >
                      <div className="sidebar-nav-row">
                        <span>{item.label}</span>
                        <span className={getAccessClassName(item)}>{getAccessLabel(item)}</span>
                      </div>
                      <small>{item.description}</small>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </section>

      {actions.length > 0 ? (
        <section className="sidebar-card">
          <h2>현재 액션</h2>
          <div className="sidebar-nav">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                className="secondary-button"
                disabled={action.disabled}
                onClick={action.onClick}
              >
                {action.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {pendingReservationIntent ? (
        <section className="sidebar-card">
          <h2>저장된 예약 의도</h2>
          <p className="detail-line">
            숙소 {pendingReservationIntent.accommodationId}, 객실 타입 {pendingReservationIntent.roomTypeId}
          </p>
          <p className="muted">로그인 후 같은 객실 타입으로 다시 진입하면 예약 요청으로 이어집니다.</p>
        </section>
      ) : null}

      {banner ? <div className={`banner banner-${banner.tone}`}>{banner.text}</div> : null}
    </aside>
  );
}
