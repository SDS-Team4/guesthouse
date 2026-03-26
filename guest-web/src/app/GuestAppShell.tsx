import { ReactNode } from 'react';
import { GuestHeader } from './GuestHeader';
import { GuestPage } from './guestPages';

type GuestAppShellProps = {
  sidebar?: ReactNode;
  children: ReactNode;
  showSidebar?: boolean;
  signedIn: boolean;
  onNavigate: (page: GuestPage) => void;
  onLogout: () => void;
};

export function GuestAppShell({
  sidebar,
  children,
  showSidebar = true,
  signedIn,
  onNavigate,
  onLogout
}: GuestAppShellProps) {
  return (
    <main className={showSidebar ? 'workspace-layout' : 'workspace-layout workspace-layout-no-sidebar'}>
      {showSidebar && sidebar ? sidebar : null}
      <section className="workspace-content">
        <div className="page-shell">
          <GuestHeader signedIn={signedIn} onNavigate={onNavigate} onLogout={onLogout} />
          <div className="page-shell-main">{children}</div>
        </div>
      </section>
    </main>
  );
}
