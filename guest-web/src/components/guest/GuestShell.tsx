import { ReactNode } from 'react';
import { AuthenticatedUser, PageKey } from '../../lib/types';

type GuestShellProps = {
  user: AuthenticatedUser | null;
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
  onLogout: () => void;
  children: ReactNode;
};

export function GuestShell({ user, currentPage, onNavigate, onLogout, children }: GuestShellProps) {
  const isSearchSection =
    currentPage === 'search' || currentPage === 'accommodations' || currentPage === 'accommodation-detail';

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <button type="button" className="brand-button" onClick={() => onNavigate('search')}>
            Guesthouse
          </button>
          <nav className="site-nav">
            <button
              type="button"
              className={`nav-button ${isSearchSection ? 'nav-button-active' : ''}`}
              onClick={() => onNavigate('search')}
            >
              숙소 탐색
            </button>
            {user ? (
              <>
                <button
                  type="button"
                  className={`nav-button ${currentPage === 'reservation-list' || currentPage === 'reservation-detail' ? 'nav-button-active' : ''}`}
                  onClick={() => onNavigate('reservation-list')}
                >
                  내 예약
                </button>
                <button
                  type="button"
                  className={`nav-button ${currentPage === 'mypage' || currentPage === 'account' ? 'nav-button-active' : ''}`}
                  onClick={() => onNavigate('mypage')}
                >
                  마이페이지
                </button>
              </>
            ) : null}
          </nav>
          <div className="site-header-actions">
            {user ? (
              <>
                <span className="session-chip">{user.loginId}</span>
                <button type="button" className="secondary-button" onClick={onLogout}>
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <button type="button" className="ghost-button" onClick={() => onNavigate('login')}>
                  로그인
                </button>
                <button type="button" onClick={() => onNavigate('signup')}>
                  회원가입
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="site-main">{children}</main>
    </div>
  );
}
