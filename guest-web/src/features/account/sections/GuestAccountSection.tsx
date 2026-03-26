import { FormEventHandler } from 'react';

type AuthenticatedUser = {
  loginId: string;
  name: string;
  role: 'GUEST';
};

type HostRoleRequestStatus = 'PENDING' | 'APPROVED' | 'DENIED';

type HostRoleRequestState = {
  currentUserRole: 'GUEST' | 'HOST' | 'ADMIN';
  canSubmitNewRequest: boolean;
  blockedReason: string | null;
  latestRequest: {
    requestReason: string;
    status: HostRoleRequestStatus;
    reviewReason: string | null;
    createdAt: string;
    reviewedAt: string | null;
  } | null;
};

type GuestAccountProfile = {
  loginId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
};

type AccountProfileFormState = {
  name: string;
  email: string;
  phone: string;
};

type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
};

type GuestAccountSectionProps = {
  mode: 'profile' | 'password' | 'host-role-request';
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
  onOpenProfile: () => void;
  onOpenPassword: () => void;
  onOpenHostRoleRequest: () => void;
  onLogout: () => void;
  onRefreshProfile: () => void;
  onProfileSubmit: FormEventHandler<HTMLFormElement>;
  onPasswordSubmit: FormEventHandler<HTMLFormElement>;
  onRefreshHostRoleRequest: () => void;
  onCreateHostRoleRequest: FormEventHandler<HTMLFormElement>;
  onAccountProfileFieldChange: (field: keyof AccountProfileFormState, value: string) => void;
  onPasswordFieldChange: (field: keyof PasswordFormState, value: string) => void;
  onHostRoleReasonChange: (value: string) => void;
  formatTimestamp: (value: string | null) => string;
  formatHostRoleRequestStatus: (status: HostRoleRequestStatus) => string;
};

export function GuestAccountSection({
  mode,
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
  onOpenProfile,
  onOpenPassword,
  onOpenHostRoleRequest,
  onLogout,
  onRefreshProfile,
  onProfileSubmit,
  onPasswordSubmit,
  onRefreshHostRoleRequest,
  onCreateHostRoleRequest,
  onAccountProfileFieldChange,
  onPasswordFieldChange,
  onHostRoleReasonChange,
  formatTimestamp,
  formatHostRoleRequestStatus
}: GuestAccountSectionProps) {
  return (
    <section className="stack-layout">
      <section className="panel account-panel-shell">
        <div className="account-tab-row">
          <button
            type="button"
            className={`account-tab-button ${mode === 'profile' ? 'account-tab-button-active' : ''}`}
            onClick={onOpenProfile}
          >
            기본 정보
          </button>
          <button
            type="button"
            className={`account-tab-button ${mode === 'password' ? 'account-tab-button-active' : ''}`}
            onClick={onOpenPassword}
          >
            비밀번호 변경
          </button>
          <button
            type="button"
            className={`account-tab-button ${mode === 'host-role-request' ? 'account-tab-button-active' : ''}`}
            onClick={onOpenHostRoleRequest}
          >
            호스트 권한 요청
          </button>
          <button type="button" className="account-tab-button account-tab-button-quiet" onClick={onLogout}>
            로그아웃
          </button>
        </div>

        <div className="account-grid">
          {mode === 'profile' ? (
          <section className="panel account-subpanel account-subpanel-wide">
            <div className="panel-header">
              <div>
                <h2>기본 정보</h2>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={onRefreshProfile}
                disabled={loadingAccountProfile}
              >
                {loadingAccountProfile ? '불러오는 중...' : '새로고침'}
              </button>
            </div>
            {accountProfile ? (
              <form className="stack" onSubmit={onProfileSubmit}>
                <label>
                  이름
                  <input
                    value={accountProfileForm.name}
                    onChange={(event) => onAccountProfileFieldChange('name', event.target.value)}
                  />
                </label>
                <label>
                  이메일
                  <input
                    type="email"
                    value={accountProfileForm.email}
                    onChange={(event) => onAccountProfileFieldChange('email', event.target.value)}
                  />
                </label>
                <label>
                  연락처
                  <input
                    value={accountProfileForm.phone}
                    onChange={(event) => onAccountProfileFieldChange('phone', event.target.value)}
                  />
                </label>
                <div className="definition-list compact-definition-list">
                  <div>
                    <dt>아이디</dt>
                    <dd>{accountProfile.loginId}</dd>
                  </div>
                  <div>
                    <dt>상태</dt>
                    <dd>{accountProfile.status}</dd>
                  </div>
                  <div>
                    <dt>역할</dt>
                    <dd>{user.role}</dd>
                  </div>
                  <div>
                    <dt>예약 권한</dt>
                    <dd>사용 가능</dd>
                  </div>
                </div>
                <button type="submit" disabled={updatingProfile}>
                  {updatingProfile ? '저장 중...' : '저장'}
                </button>
              </form>
            ) : (
              <p className="empty-state">프로필 데이터가 아직 로드되지 않았습니다.</p>
            )}
          </section>
          ) : null}

          {mode === 'password' ? (
          <section className="panel account-subpanel account-subpanel-wide">
            <div className="panel-header">
              <div>
                <h2>비밀번호 변경</h2>
              </div>
            </div>
            <form className="stack" onSubmit={onPasswordSubmit}>
              <label>
                현재 비밀번호
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => onPasswordFieldChange('currentPassword', event.target.value)}
                />
              </label>
              <label>
                새 비밀번호
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => onPasswordFieldChange('newPassword', event.target.value)}
                />
              </label>
              <label>
                새 비밀번호 확인
                <input
                  type="password"
                  value={passwordForm.newPasswordConfirm}
                  onChange={(event) => onPasswordFieldChange('newPasswordConfirm', event.target.value)}
                />
              </label>
              <button type="submit" disabled={changingPassword}>
                {changingPassword ? '변경 중...' : '비밀번호 변경'}
              </button>
            </form>
          </section>
          ) : null}

          {mode === 'host-role-request' ? (
          <section className="panel account-subpanel account-subpanel-wide">
            <div className="panel-header">
              <div>
                <h2>호스트 권한 요청</h2>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={onRefreshHostRoleRequest}
                disabled={loadingHostRoleRequestState}
              >
                {loadingHostRoleRequestState ? '확인 중...' : '상태 새로고침'}
              </button>
            </div>

            {!hostRoleRequestState ? (
              <p className="empty-state">호스트 권한 요청 상태가 아직 로드되지 않았습니다.</p>
            ) : (
              <div className="host-role-request-grid">
                <section className="detail-card">
                  <h3>현재 상태</h3>
                  <p className="detail-line">현재 역할: {hostRoleRequestState.currentUserRole}</p>
                  <p className="detail-line">
                    {hostRoleRequestState.canSubmitNewRequest
                      ? '새 요청을 제출할 수 있습니다.'
                      : hostRoleRequestState.blockedReason ?? '현재는 새 요청을 제출할 수 없습니다.'}
                  </p>
                </section>

                <section className="detail-card">
                  <h3>최근 요청</h3>
                  {!hostRoleRequestState.latestRequest ? (
                    <p className="empty-state">기록된 호스트 권한 요청이 없습니다.</p>
                  ) : (
                    <>
                      <p className="detail-line">
                        <strong>{formatHostRoleRequestStatus(hostRoleRequestState.latestRequest.status)}</strong>
                      </p>
                      <p className="detail-line">{hostRoleRequestState.latestRequest.requestReason}</p>
                      <p className="detail-line">생성 {formatTimestamp(hostRoleRequestState.latestRequest.createdAt)}</p>
                      <p className="detail-line">검토 {formatTimestamp(hostRoleRequestState.latestRequest.reviewedAt)}</p>
                      {hostRoleRequestState.latestRequest.reviewReason ? (
                        <p className="detail-line history-reason">{hostRoleRequestState.latestRequest.reviewReason}</p>
                      ) : null}
                    </>
                  )}
                </section>

                <section className="detail-card detail-card-wide">
                  <h3>요청 작성</h3>
                  <form className="stack" onSubmit={onCreateHostRoleRequest}>
                    <label>
                      요청 사유
                      <textarea
                        rows={4}
                        value={hostRoleRequestReason}
                        onChange={(event) => onHostRoleReasonChange(event.target.value)}
                        placeholder="호스트 권한이 필요한 이유를 입력해 주세요."
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={!hostRoleRequestState.canSubmitNewRequest || creatingHostRoleRequest}
                    >
                      {creatingHostRoleRequest ? '제출 중...' : '호스트 권한 요청'}
                    </button>
                  </form>
                </section>
              </div>
            )}
          </section>
          ) : null}
        </div>
      </section>
    </section>
  );
}
