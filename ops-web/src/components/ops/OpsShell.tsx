import type { ReactNode } from 'react';

import type { AuthenticatedUser, BannerState, OpsNavItem, OpsPageKey } from '../../lib/types';

type OpsShellProps = {
  user: AuthenticatedUser;
  currentPage: OpsPageKey;
  navItems: OpsNavItem[];
  banner: BannerState;
  onNavigate: (page: OpsPageKey) => void;
  onLogout: () => void;
  children: ReactNode;
};

export function OpsShell({
  user,
  currentPage,
  navItems,
  banner,
  onNavigate,
  onLogout,
  children
}: OpsShellProps) {
  const roleLabel = user.role === 'ADMIN' ? 'Admin operations' : 'Host operations';

  return (
    <div className="ops-layout">
      <aside className="ops-sidebar">
        <div className="ops-brand">
          <p className="ops-brand-kicker">Guesthouse</p>
          <h1>{roleLabel}</h1>
          <p className="ops-brand-copy">Operations center for reservations, properties, rooms, pricing, blocks, and governance.</p>
        </div>

        <div className="ops-user-card">
          <div>
            <p className="ops-user-name">{user.name}</p>
            <p className="ops-user-meta">{user.loginId}</p>
          </div>
          <span className="ops-user-meta">{user.role}</span>
        </div>

        <nav className="ops-nav" aria-label="Operations navigation">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={['ops-nav-item', currentPage === item.key ? 'ops-nav-item-active' : ''].filter(Boolean).join(' ')}
              onClick={() => onNavigate(item.key)}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="ops-sidebar-footer">
          <button type="button" className="secondary-button" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="ops-main">
        <header className="ops-topbar">
          <div>
            <p className="eyebrow">{user.role === 'ADMIN' ? 'Admin operations' : 'Host operations'}</p>
            <h1>{navItems.find((item) => item.key === currentPage)?.label ?? roleLabel}</h1>
          </div>
          <div className="ops-topbar-meta">
            <span className="ops-user-meta">{user.name}</span>
          </div>
        </header>

        {banner ? <div className={`banner banner-${banner.tone}`}>{banner.text}</div> : null}

        <main className="ops-main-content">{children}</main>
      </div>
    </div>
  );
}
