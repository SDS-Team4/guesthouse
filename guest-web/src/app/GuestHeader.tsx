import { GuestPage } from './guestPages';
import daumStayMark from '../assets/daum-stay-mark.png';

type GuestHeaderProps = {
  signedIn: boolean;
  onNavigate: (page: GuestPage) => void;
  onLogout: () => void;
};

export function GuestHeader({
  signedIn,
  onNavigate,
  onLogout
}: GuestHeaderProps) {
  return (
    <header className="guest-header">
      <div className="guest-header-inner">
        <button type="button" className="guest-header-brand" onClick={() => onNavigate('search')}>
          <img src={daumStayMark} alt="" className="guest-header-brand-image" aria-hidden="true" />
          <span className="guest-header-brand-text">DAUM STAY</span>
        </button>

        <div className="guest-header-actions">
          {!signedIn ? (
            <>
              <button type="button" className="guest-header-link" onClick={() => onNavigate('login')}>
                로그인
              </button>
              <button type="button" className="guest-header-primary" onClick={() => onNavigate('signup')}>
                회원가입
              </button>
            </>
          ) : (
            <>
              <button type="button" className="guest-header-link" onClick={() => onNavigate('mypage')}>
                마이페이지
              </button>
              <button type="button" className="guest-header-outline" onClick={onLogout}>
                로그아웃
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
