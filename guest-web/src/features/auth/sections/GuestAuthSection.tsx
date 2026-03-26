import { FormEventHandler } from 'react';

type SignupTerm = {
  termId: number;
  category: string;
  title: string;
  content: string;
  version: string;
  effectiveAt: string;
};

type SignupFormState = {
  loginId: string;
  password: string;
  passwordConfirm: string;
  name: string;
  email: string;
  phone: string;
  agreedTermIds: number[];
};

type GuestAuthSectionProps = {
  mode: 'login' | 'signup';
  pendingReservationIntent: {
    accommodationId: number;
    roomTypeId: number;
  } | null;
  loginId: string;
  password: string;
  signupForm: SignupFormState;
  signupTerms: SignupTerm[];
  loggingIn: boolean;
  signingUp: boolean;
  loadingSignupTerms: boolean;
  onLoginSubmit: FormEventHandler<HTMLFormElement>;
  onSignupSubmit: FormEventHandler<HTMLFormElement>;
  onRefreshTerms: () => void;
  onLoginIdChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSignupFieldChange: (field: keyof SignupFormState, value: string | number[]) => void;
  onToggleAgreedTerm: (termId: number) => void;
  formatTimestamp: (value: string | null) => string;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  onOpenFindId: () => void;
  onOpenFindPassword: () => void;
};

export function GuestAuthSection({
  mode,
  pendingReservationIntent,
  loginId,
  password,
  signupForm,
  signupTerms,
  loggingIn,
  signingUp,
  loadingSignupTerms,
  onLoginSubmit,
  onSignupSubmit,
  onRefreshTerms,
  onLoginIdChange,
  onPasswordChange,
  onSignupFieldChange,
  onToggleAgreedTerm,
  formatTimestamp,
  onOpenLogin,
  onOpenSignup,
  onOpenFindId,
  onOpenFindPassword
}: GuestAuthSectionProps) {
  return (
    <section className="auth-screen">
      {mode === 'login' ? (
        <section className="auth-card-shell">
          <div className="auth-card">
            <div className="auth-card-header">
              <h2>게스트 로그인</h2>
            </div>

            {pendingReservationIntent ? (
              <div className="auth-info-card">
                <strong>저장된 예약 의도</strong>
                <p>
                  숙소 {pendingReservationIntent.accommodationId}, 객실 타입 {pendingReservationIntent.roomTypeId}
                </p>
                <small>로그인 후 같은 객실 타입에서 예약 요청을 이어갈 수 있습니다.</small>
              </div>
            ) : null}

            <form className="stack" onSubmit={onLoginSubmit}>
              <label>
                아이디
                <input value={loginId} onChange={(event) => onLoginIdChange(event.target.value)} />
              </label>
              <label>
                비밀번호
                <input type="password" value={password} onChange={(event) => onPasswordChange(event.target.value)} />
              </label>
              <button type="submit" disabled={loggingIn}>
                {loggingIn ? '로그인 중...' : '로그인'}
              </button>
            </form>

            <div className="auth-helper-row">
              <button type="button" className="ghost-link-button" onClick={onOpenFindId}>
                아이디 찾기
              </button>
              <button type="button" className="ghost-link-button" onClick={onOpenFindPassword}>
                비밀번호 찾기
              </button>
            </div>

            <div className="auth-footer-note">
              계정이 없으신가요?
              <button type="button" className="inline-link-button" onClick={onOpenSignup}>
                회원가입
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {mode === 'signup' ? (
        <section className="auth-card-shell">
          <div className="auth-card auth-card-wide">
            <div className="auth-card-header auth-card-header-with-action">
              <div>
                <h2>회원가입</h2>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={onRefreshTerms}
                disabled={loadingSignupTerms}
              >
                {loadingSignupTerms ? '약관 새로고침 중...' : '약관 새로고침'}
              </button>
            </div>

            <form className="stack" onSubmit={onSignupSubmit}>
              <div className="auth-form-grid">
                <label>
                  아이디
                  <input
                    value={signupForm.loginId}
                    onChange={(event) => onSignupFieldChange('loginId', event.target.value)}
                  />
                </label>
                <label>
                  이름
                  <input value={signupForm.name} onChange={(event) => onSignupFieldChange('name', event.target.value)} />
                </label>
                <label>
                  비밀번호
                  <input
                    type="password"
                    value={signupForm.password}
                    onChange={(event) => onSignupFieldChange('password', event.target.value)}
                  />
                </label>
                <label>
                  비밀번호 확인
                  <input
                    type="password"
                    value={signupForm.passwordConfirm}
                    onChange={(event) => onSignupFieldChange('passwordConfirm', event.target.value)}
                  />
                </label>
                <label>
                  이메일
                  <input
                    type="email"
                    value={signupForm.email}
                    onChange={(event) => onSignupFieldChange('email', event.target.value)}
                  />
                </label>
                <label>
                  연락처
                  <input value={signupForm.phone} onChange={(event) => onSignupFieldChange('phone', event.target.value)} />
                </label>
              </div>

              <div className="terms-list">
                <strong>필수 약관</strong>
                {signupTerms.length === 0 ? (
                  <p className="empty-state">현재 게시된 필수 약관이 없습니다.</p>
                ) : (
                  signupTerms.map((term) => (
                    <label key={term.termId} className="checkbox-card">
                      <input
                        type="checkbox"
                        checked={signupForm.agreedTermIds.includes(term.termId)}
                        onChange={() => onToggleAgreedTerm(term.termId)}
                      />
                      <div>
                        <strong>
                          {term.title} ({term.version})
                        </strong>
                        <p className="detail-line">
                          시행일 {formatTimestamp(term.effectiveAt)} / {term.category}
                        </p>
                        <p className="muted">{term.content}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>

              <button type="submit" disabled={signingUp || loadingSignupTerms}>
                {signingUp ? '회원가입 처리 중...' : '회원가입'}
              </button>
            </form>

            <div className="auth-footer-note">
              이미 계정이 있으신가요?
              <button type="button" className="inline-link-button" onClick={onOpenLogin}>
                로그인
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </section>
  );
}
