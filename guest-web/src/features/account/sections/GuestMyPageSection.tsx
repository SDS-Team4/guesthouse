type AuthenticatedUser = {
  loginId: string;
  name: string;
  role: 'GUEST';
};

type GuestMyPageSectionProps = {
  user: AuthenticatedUser;
  onOpenProfile: () => void;
  onOpenPassword: () => void;
  onOpenHostRoleRequest: () => void;
  onOpenReservations: () => void;
  onLogout: () => void;
};

export function GuestMyPageSection({
  user,
  onOpenProfile,
  onOpenPassword,
  onOpenHostRoleRequest,
  onOpenReservations,
  onLogout
}: GuestMyPageSectionProps) {
  return (
    <section className="mypage-layout">
      <section className="panel mypage-profile-card">
        <div className="mypage-avatar" />
        <div className="stack">
          <div>
            <h2>{user.name}</h2>
            <p className="muted">{user.loginId}</p>
          </div>
          <div className="definition-list compact-definition-list">
            <div>
              <dt>역할</dt>
              <dd>{user.role}</dd>
            </div>
            <div>
              <dt>상태</dt>
              <dd>ACTIVE</dd>
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>마이페이지</h2>
          </div>
        </div>
        <div className="mypage-menu">
          <button type="button" className="mypage-menu-button" onClick={onOpenProfile}>
            <span>기본 정보</span>
            <small>프로필과 연락처 수정</small>
          </button>
          <button type="button" className="mypage-menu-button" onClick={onOpenPassword}>
            <span>비밀번호 변경</span>
            <small>현재 비밀번호 확인 후 변경</small>
          </button>
          <button type="button" className="mypage-menu-button" onClick={onOpenHostRoleRequest}>
            <span>호스트 권한 요청</span>
            <small>요청 상태 확인과 새 요청 작성</small>
          </button>
          <button type="button" className="mypage-menu-button" onClick={onOpenReservations}>
            <span>예약 목록</span>
            <small>예약 이력과 예약 상세 확인</small>
          </button>
          <button type="button" className="mypage-menu-button" onClick={onLogout}>
            <span>로그아웃</span>
            <small>현재 게스트 세션 종료</small>
          </button>
        </div>
      </section>
    </section>
  );
}
