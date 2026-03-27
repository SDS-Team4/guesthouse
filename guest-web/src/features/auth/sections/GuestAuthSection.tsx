import { FormEventHandler } from 'react';
import { type SignupFormErrors, type SignupLoginIdAvailability } from '../../../app/guestAppState';

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
  loginError: string | null;
  signupForm: SignupFormState;
  signupErrors: SignupFormErrors;
  signupLoginIdAvailability: SignupLoginIdAvailability | null;
  signupTerms: SignupTerm[];
  loggingIn: boolean;
  signingUp: boolean;
  checkingSignupLoginId: boolean;
  loadingSignupTerms: boolean;
  onLoginSubmit: FormEventHandler<HTMLFormElement>;
  onSignupSubmit: FormEventHandler<HTMLFormElement>;
  onCheckSignupLoginId: () => void;
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
  pendingReservationIntent: _pendingReservationIntent,
  loginId,
  password,
  loginError,
  signupForm,
  signupErrors,
  signupLoginIdAvailability,
  signupTerms,
  loggingIn,
  signingUp,
  checkingSignupLoginId,
  loadingSignupTerms,
  onLoginSubmit,
  onSignupSubmit,
  onCheckSignupLoginId,
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

            <form className="stack" onSubmit={onLoginSubmit}>
              <label>
                아이디
                <input value={loginId} onChange={(event) => onLoginIdChange(event.target.value)} />
              </label>
              <label>
                비밀번호
                <input type="password" value={password} onChange={(event) => onPasswordChange(event.target.value)} />
              </label>
              {loginError ? <p className="form-error-banner">{loginError}</p> : null}
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
                {loadingSignupTerms ? '약관 불러오는 중...' : '약관 새로고침'}
              </button>
            </div>

            <form className="stack" onSubmit={onSignupSubmit}>
              <div className="auth-form-grid">
                <label>
                  아이디
                  <div className="signup-inline-action">
                    <input
                      value={signupForm.loginId}
                      onChange={(event) => onSignupFieldChange('loginId', event.target.value)}
                    />
                    <button
                      type="button"
                      className="secondary-button signup-inline-button"
                      onClick={onCheckSignupLoginId}
                      disabled={checkingSignupLoginId}
                    >
                      {checkingSignupLoginId ? '확인 중...' : '중복확인'}
                    </button>
                  </div>
                  <small className="input-hint">4~50자 사이로 입력해주세요.</small>
                  {signupErrors.loginId ? <small className="field-error">{signupErrors.loginId}</small> : null}
                  {!signupErrors.loginId && signupLoginIdAvailability ? (
                    <small className={signupLoginIdAvailability.available ? 'field-success' : 'field-error'}>
                      {signupLoginIdAvailability.message}
                    </small>
                  ) : null}
                </label>

                <label>
                  이름
                  <input value={signupForm.name} onChange={(event) => onSignupFieldChange('name', event.target.value)} />
                  <small className="input-hint">이름은 50자 이하로 입력할 수 있어요.</small>
                  {signupErrors.name ? <small className="field-error">{signupErrors.name}</small> : null}
                </label>

                <label>
                  비밀번호
                  <input
                    type="password"
                    value={signupForm.password}
                    onChange={(event) => onSignupFieldChange('password', event.target.value)}
                  />
                  <small className="input-hint">8~100자 사이로 입력해주세요.</small>
                  {signupErrors.password ? <small className="field-error">{signupErrors.password}</small> : null}
                </label>

                <label>
                  비밀번호 확인
                  <input
                    type="password"
                    value={signupForm.passwordConfirm}
                    onChange={(event) => onSignupFieldChange('passwordConfirm', event.target.value)}
                  />
                  <small className="input-hint">위에 입력한 비밀번호를 한 번 더 입력해주세요.</small>
                  {signupErrors.passwordConfirm ? (
                    <small className="field-error">{signupErrors.passwordConfirm}</small>
                  ) : null}
                </label>

                <label>
                  이메일
                  <input
                    type="email"
                    value={signupForm.email}
                    onChange={(event) => onSignupFieldChange('email', event.target.value)}
                  />
                  <small className="input-hint">필수 입력이고, 올바른 이메일 형식으로 입력해주세요.</small>
                  {signupErrors.email ? <small className="field-error">{signupErrors.email}</small> : null}
                </label>

                <label>
                  연락처
                  <input value={signupForm.phone} onChange={(event) => onSignupFieldChange('phone', event.target.value)} />
                  <small className="input-hint">필수 입력이고, 이미 사용 중인 번호로는 가입할 수 없어요.</small>
                  {signupErrors.phone ? <small className="field-error">{signupErrors.phone}</small> : null}
                </label>
              </div>

              <div className="terms-list">
                <strong>필수 약관</strong>
                {signupTerms.length === 0 ? (
                  <p className="empty-state">현재 게시된 필수 약관을 불러오지 못했습니다.</p>
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
                {signupErrors.agreedTermIds ? (
                  <small className="field-error">{signupErrors.agreedTermIds}</small>
                ) : null}
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
