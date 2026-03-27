import { FormEvent } from 'react';
import { SectionCard } from '../../components/guest/SectionCard';
import { StatusBadge } from '../../components/guest/StatusBadge';
import { formatTimestamp } from '../../lib/date';
import {
  AccountProfileFormState,
  AuthenticatedUser,
  GuestAccountProfile,
  HostRoleRequestState,
  PageKey,
  PasswordFormState
} from '../../lib/types';

function hostRoleBadge(status: NonNullable<HostRoleRequestState['latestRequest']>['status']) {
  switch (status) {
    case 'PENDING':
      return { variant: 'pending' as const, label: '검토 대기' };
    case 'APPROVED':
      return { variant: 'approved' as const, label: '승인됨' };
    case 'DENIED':
      return { variant: 'denied' as const, label: '거절됨' };
  }
}

type MyPageProps = {
  user: AuthenticatedUser;
  accountProfile: GuestAccountProfile | null;
  onNavigate: (page: PageKey) => void;
  onLogout: () => void;
};

export function MyPage({ user, accountProfile, onNavigate, onLogout }: MyPageProps) {
  return (
    <div className="page-grid page-grid-aside">
      <SectionCard title="내 정보" subtitle="현재 로그인된 게스트 계정입니다.">
        <div className="profile-summary">
          <div className="profile-avatar">{user.name.slice(0, 1)}</div>
          <div className="stack compact-stack">
            <strong>{user.name}</strong>
            <span>{user.loginId}</span>
            <span>{accountProfile?.email ?? '이메일 미입력'}</span>
            <span>{accountProfile?.phone ?? '연락처 미입력'}</span>
          </div>
        </div>
      </SectionCard>
      <SectionCard title="마이페이지" subtitle="현재 동작하는 계정/예약 흐름으로 바로 이동합니다.">
        <div className="stack">
          <button type="button" className="list-nav-button" onClick={() => onNavigate('account')}>
            계정 정보 관리
          </button>
          <button type="button" className="list-nav-button" onClick={() => onNavigate('reservation-list')}>
            예약 내역
          </button>
          <button type="button" className="list-nav-button" onClick={onLogout}>
            로그아웃
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

type AccountPageProps = {
  user: AuthenticatedUser;
  accountProfile: GuestAccountProfile | null;
  accountProfileForm: AccountProfileFormState;
  passwordForm: PasswordFormState;
  hostRoleRequestState: HostRoleRequestState | null;
  hostRoleRequestReason: string;
  loadingAccountProfile: boolean;
  updatingProfile: boolean;
  changingPassword: boolean;
  loadingHostRoleRequestState: boolean;
  creatingHostRoleRequest: boolean;
  onRefreshProfile: () => void;
  onRefreshHostRoleState: () => void;
  onProfileChange: (field: keyof AccountProfileFormState, value: string) => void;
  onPasswordChange: (field: keyof PasswordFormState, value: string) => void;
  onHostRoleReasonChange: (value: string) => void;
  onSubmitProfile: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitPassword: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitHostRoleRequest: (event: FormEvent<HTMLFormElement>) => void;
};

export function AccountPage({
  user,
  accountProfile,
  accountProfileForm,
  passwordForm,
  hostRoleRequestState,
  hostRoleRequestReason,
  loadingAccountProfile,
  updatingProfile,
  changingPassword,
  loadingHostRoleRequestState,
  creatingHostRoleRequest,
  onRefreshProfile,
  onRefreshHostRoleState,
  onProfileChange,
  onPasswordChange,
  onHostRoleReasonChange,
  onSubmitProfile,
  onSubmitPassword,
  onSubmitHostRoleRequest
}: AccountPageProps) {
  return (
    <div className="stack">
      <section className="account-banner">
        <div>
          <p className="eyebrow">Account</p>
          <h1>{user.name}님의 계정 관리</h1>
          <p className="hero-copy">프로필 수정, 비밀번호 변경, 호스트 권한 요청을 한 화면에서 이어서 처리합니다.</p>
        </div>
      </section>

      <div className="page-grid page-grid-account">
        <SectionCard
          title="기본 정보"
          subtitle="현재 guest-api에서 바로 저장되는 프로필 정보입니다."
          actions={
            <button type="button" className="secondary-button" onClick={onRefreshProfile} disabled={loadingAccountProfile}>
              {loadingAccountProfile ? '불러오는 중...' : '프로필 새로고침'}
            </button>
          }
        >
          {accountProfile ? (
            <form className="stack" onSubmit={onSubmitProfile}>
              <label>
                이름
                <input
                  value={accountProfileForm.name}
                  onChange={(event) => onProfileChange('name', event.target.value)}
                />
              </label>
              <label>
                이메일
                <input
                  type="email"
                  value={accountProfileForm.email}
                  onChange={(event) => onProfileChange('email', event.target.value)}
                />
              </label>
              <label>
                연락처
                <input
                  value={accountProfileForm.phone}
                  onChange={(event) => onProfileChange('phone', event.target.value)}
                />
              </label>
              <div className="definition-list compact-definition-list">
                <div>
                  <dt>로그인 ID</dt>
                  <dd>{accountProfile.loginId}</dd>
                </div>
                <div>
                  <dt>상태</dt>
                  <dd>{accountProfile.status}</dd>
                </div>
              </div>
              <button type="submit" disabled={updatingProfile}>
                {updatingProfile ? '저장 중...' : '기본 정보 저장'}
              </button>
            </form>
          ) : (
            <p className="empty-state">프로필을 아직 불러오지 못했습니다.</p>
          )}
        </SectionCard>

        <SectionCard title="비밀번호 변경" subtitle="현재 비밀번호 검증을 통과해야 새 비밀번호가 저장됩니다.">
          <form className="stack" onSubmit={onSubmitPassword}>
            <label>
              현재 비밀번호
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) => onPasswordChange('currentPassword', event.target.value)}
              />
            </label>
            <label>
              새 비밀번호
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => onPasswordChange('newPassword', event.target.value)}
              />
            </label>
            <label>
              새 비밀번호 확인
              <input
                type="password"
                value={passwordForm.newPasswordConfirm}
                onChange={(event) => onPasswordChange('newPasswordConfirm', event.target.value)}
              />
            </label>
            <button type="submit" disabled={changingPassword}>
              {changingPassword ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        </SectionCard>
      </div>

      <SectionCard
        title="호스트 권한 요청"
        subtitle="이미 동작하는 guest-authenticated 요청 흐름을 새 디자인에 맞춰 유지합니다."
        actions={
          <button
            type="button"
            className="secondary-button"
            onClick={onRefreshHostRoleState}
            disabled={loadingHostRoleRequestState}
          >
            {loadingHostRoleRequestState ? '불러오는 중...' : '상태 새로고침'}
          </button>
        }
      >
        {!hostRoleRequestState ? (
          <p className="empty-state">권한 요청 상태를 아직 불러오지 못했습니다.</p>
        ) : (
          <div className="page-grid page-grid-account">
            <div className="detail-card">
              <h3>현재 상태</h3>
              <p className="detail-line">현재 역할: {hostRoleRequestState.currentUserRole}</p>
              <p className="detail-line">
                {hostRoleRequestState.canSubmitNewRequest
                  ? '새 요청을 제출할 수 있습니다.'
                  : hostRoleRequestState.blockedReason ?? '현재 새 요청이 막혀 있습니다.'}
              </p>
            </div>
            <div className="detail-card">
              <h3>최근 요청</h3>
              {!hostRoleRequestState.latestRequest ? (
                <p className="empty-state">아직 요청 이력이 없습니다.</p>
              ) : (
                <div className="stack compact-stack">
                  <StatusBadge {...hostRoleBadge(hostRoleRequestState.latestRequest.status)} />
                  <p className="detail-line">{hostRoleRequestState.latestRequest.requestReason}</p>
                  <p className="detail-line">생성 {formatTimestamp(hostRoleRequestState.latestRequest.createdAt)}</p>
                  <p className="detail-line">검토 {formatTimestamp(hostRoleRequestState.latestRequest.reviewedAt)}</p>
                  {hostRoleRequestState.latestRequest.reviewReason ? (
                    <p className="muted">{hostRoleRequestState.latestRequest.reviewReason}</p>
                  ) : null}
                </div>
              )}
            </div>
            <form className="detail-card detail-card-wide stack" onSubmit={onSubmitHostRoleRequest}>
              <h3>새 요청 작성</h3>
              <label>
                요청 사유
                <textarea
                  rows={4}
                  value={hostRoleRequestReason}
                  onChange={(event) => onHostRoleReasonChange(event.target.value)}
                  placeholder="호스트 권한이 필요한 이유를 입력하세요."
                />
              </label>
              <button
                type="submit"
                disabled={!hostRoleRequestState.canSubmitNewRequest || creatingHostRoleRequest}
              >
                {creatingHostRoleRequest ? '제출 중...' : '호스트 권한 요청'}
              </button>
            </form>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
