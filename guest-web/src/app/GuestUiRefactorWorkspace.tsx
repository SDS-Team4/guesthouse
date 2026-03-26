import { useState } from 'react';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { SignupPage } from '../features/auth/pages/SignupPage';
import { AccountPage } from '../features/account/pages/AccountPage';
import { MyPage } from '../features/account/pages/MyPage';
import { AccommodationDetailPage } from '../features/accommodations/pages/AccommodationDetailPage';
import { AccommodationsPage } from '../features/accommodations/pages/AccommodationsPage';
import { ReservationCompletePage } from '../features/reservations/pages/ReservationCompletePage';
import { ReservationDetailPage } from '../features/reservations/pages/ReservationDetailPage';
import { ReservationListPage } from '../features/reservations/pages/ReservationListPage';
import { ReservationRequestPage } from '../features/reservations/pages/ReservationRequestPage';
import { PlaceholderPage } from '../features/recovery/pages/PlaceholderPage';
import { SearchPage } from '../features/search/pages/SearchPage';
import { cn } from '../shared/lib/cn';

type GuestWorkspacePage =
  | 'login'
  | 'signup'
  | 'mypage'
  | 'account'
  | 'search'
  | 'accommodations'
  | 'accommodation-detail'
  | 'reservation-request'
  | 'reservation-complete'
  | 'reservation-list'
  | 'reservation-detail'
  | 'find-id'
  | 'find-password';

const guestWorkspacePages: GuestWorkspacePage[] = [
  'login',
  'signup',
  'mypage',
  'account',
  'search',
  'accommodations',
  'accommodation-detail',
  'reservation-request',
  'reservation-complete',
  'reservation-list',
  'reservation-detail',
  'find-id',
  'find-password'
];

export function GuestUiRefactorWorkspace() {
  const [page, setPage] = useState<GuestWorkspacePage>('search');

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
        <div className="mb-3">
          <h1 className="text-lg font-bold text-slate-900">Guest UI Refactor Workspace</h1>
          <p className="mt-1 text-sm text-slate-500">
            This is the first extracted workspace from the draft guest UI. It is not wired into the app yet.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {guestWorkspacePages.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPage(item)}
              className={cn(
                'rounded-full border px-3 py-2 text-sm font-medium',
                page === item
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {page === 'login' ? (
        <LoginPage onOpenSignup={() => setPage('signup')} />
      ) : null}

      {page === 'signup' ? <SignupPage onComplete={() => setPage('login')} /> : null}

      {page === 'mypage' ? (
        <MyPage
          onOpenAccount={() => setPage('account')}
          onOpenReservations={() => setPage('reservation-list')}
        />
      ) : null}

      {page === 'account' ? <AccountPage /> : null}

      {page === 'search' ? <SearchPage onSearch={() => setPage('accommodations')} /> : null}

      {page === 'accommodations' ? (
        <AccommodationsPage onOpenDetail={() => setPage('accommodation-detail')} />
      ) : null}

      {page === 'accommodation-detail' ? (
        <AccommodationDetailPage onStartReservation={() => setPage('reservation-request')} />
      ) : null}

      {page === 'reservation-request' ? (
        <ReservationRequestPage
          onSubmit={() => setPage('reservation-complete')}
          onBack={() => setPage('accommodation-detail')}
        />
      ) : null}

      {page === 'reservation-complete' ? (
        <ReservationCompletePage
          onOpenDetail={() => setPage('reservation-detail')}
          onOpenList={() => setPage('reservation-list')}
        />
      ) : null}

      {page === 'reservation-list' ? (
        <ReservationListPage onOpenDetail={() => setPage('reservation-detail')} />
      ) : null}

      {page === 'reservation-detail' ? <ReservationDetailPage /> : null}

      {page === 'find-id' ? (
        <PlaceholderPage
          title="Find ID"
          description="Placeholder page split from the guest draft."
          buttonText="Find ID"
          fields={['Name', 'Email or phone']}
        />
      ) : null}

      {page === 'find-password' ? (
        <PlaceholderPage
          title="Find Password"
          description="Placeholder page split from the guest draft."
          buttonText="Find password"
          fields={['Login ID or email', 'Verification info']}
        />
      ) : null}
    </div>
  );
}
