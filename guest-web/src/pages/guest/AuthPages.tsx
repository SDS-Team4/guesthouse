import { FormEvent } from 'react';
import { SectionCard } from '../../components/guest/SectionCard';
import { formatTimestamp } from '../../lib/date';
import { PageKey, ReservationIntent, SignupFormState, SignupTerm } from '../../lib/types';

type LoginPageProps = {
  loginId: string;
  password: string;
  pendingReservationIntent: ReservationIntent | null;
  loggingIn: boolean;
  onLogin: (event: FormEvent<HTMLFormElement>) => void;
  onLoginIdChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onNavigate: (page: PageKey) => void;
};

export function LoginPage({
  loginId,
  password,
  pendingReservationIntent,
  loggingIn,
  onLogin,
  onLoginIdChange,
  onPasswordChange,
  onNavigate
}: LoginPageProps) {
  return (
    <div className="auth-shell">
      <SectionCard
        title="게스트 로그인"
        subtitle="공개 탐색은 계속 열어두고, 예약 진입과 내 정보 접근만 로그인으로 보호합니다."
      >
        {pendingReservationIntent ? (
          <div className="info-card">
            <strong>저장된 예약 의도</strong>
            <p className="detail-line">
              숙소 {pendingReservationIntent.accommodationId}, 객실 타입 {pendingReservationIntent.roomTypeId}
            </p>
            <p className="muted">로그인 후 예약 요청 화면으로 안전하게 복귀합니다.</p>
          </div>
        ) : null}
        <form className="stack" onSubmit={onLogin}>
          <label>
            아이디
            <input value={loginId} onChange={(event) => onLoginIdChange(event.target.value)} />
          </label>
          <label>
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
            />
          </label>
          <button type="submit" disabled={loggingIn}>
            {loggingIn ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <div className="inline-link-row">
          <button type="button" className="ghost-link" onClick={() => onNavigate('find-id')}>
            아이디 찾기
          </button>
          <button type="button" className="ghost-link" onClick={() => onNavigate('find-password')}>
            비밀번호 찾기
          </button>
        </div>
        <p className="muted centered-text">
          계정이 없으신가요?{' '}
          <button type="button" className="ghost-link strong-link" onClick={() => onNavigate('signup')}>
            회원가입
          </button>
        </p>
      </SectionCard>
    </div>
  );
}

type SignupPageProps = {
  signupForm: SignupFormState;
  signupTerms: SignupTerm[];
  signingUp: boolean;
  loadingSignupTerms: boolean;
  onSignup: (event: FormEvent<HTMLFormElement>) => void;
  onRefreshTerms: () => void;
  onFormChange: (field: keyof SignupFormState, value: string) => void;
  onToggleTerm: (termId: number) => void;
};

export function SignupPage({
  signupForm,
  signupTerms,
  signingUp,
  loadingSignupTerms,
  onSignup,
  onRefreshTerms,
  onFormChange,
  onToggleTerm
}: SignupPageProps) {
  return (
    <div className="auth-shell auth-shell-wide">
      <SectionCard
        title="회원가입"
        subtitle="현재 검증된 백엔드에 맞춰 필수 약관 동의와 계정 생성까지 바로 연결합니다."
        actions={
          <button type="button" className="secondary-button" onClick={onRefreshTerms} disabled={loadingSignupTerms}>
            {loadingSignupTerms ? '불러오는 중...' : '약관 새로고침'}
          </button>
        }
      >
        <form className="signup-layout" onSubmit={onSignup}>
          <div className="stack">
            <label>
              아이디
              <input
                value={signupForm.loginId}
                onChange={(event) => onFormChange('loginId', event.target.value)}
              />
            </label>
            <label>
              비밀번호
              <input
                type="password"
                value={signupForm.password}
                onChange={(event) => onFormChange('password', event.target.value)}
              />
            </label>
            <label>
              비밀번호 확인
              <input
                type="password"
                value={signupForm.passwordConfirm}
                onChange={(event) => onFormChange('passwordConfirm', event.target.value)}
              />
            </label>
            <label>
              이름
              <input value={signupForm.name} onChange={(event) => onFormChange('name', event.target.value)} />
            </label>
            <label>
              이메일
              <input
                type="email"
                value={signupForm.email}
                onChange={(event) => onFormChange('email', event.target.value)}
              />
            </label>
            <label>
              연락처
              <input value={signupForm.phone} onChange={(event) => onFormChange('phone', event.target.value)} />
            </label>
          </div>
          <div className="stack">
            <div className="section-subheading">
              <strong>필수 약관</strong>
              <p className="muted">단일 체크박스 대신 현재 발행된 필수 약관 목록을 그대로 보여줍니다.</p>
            </div>
            {signupTerms.length === 0 ? (
              <p className="empty-state">현재 발행된 필수 약관이 없습니다.</p>
            ) : (
              <div className="terms-list">
                {signupTerms.map((term) => (
                  <label key={term.termId} className="checkbox-card">
                    <input
                      type="checkbox"
                      checked={signupForm.agreedTermIds.includes(term.termId)}
                      onChange={() => onToggleTerm(term.termId)}
                    />
                    <div>
                      <strong>
                        {term.title} ({term.version})
                      </strong>
                      <p className="detail-line">
                        {term.category} / 시행일 {formatTimestamp(term.effectiveAt)}
                      </p>
                      <p className="muted">{term.content}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <button type="submit" disabled={signingUp || loadingSignupTerms}>
              {signingUp ? '계정 생성 중...' : '회원가입'}
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}

type RecoveryPlaceholderPageProps = {
  title: string;
  description: string;
  onNavigate: (page: PageKey) => void;
};

export function RecoveryPlaceholderPage({
  title,
  description,
  onNavigate
}: RecoveryPlaceholderPageProps) {
  return (
    <div className="auth-shell">
      <SectionCard title={title} subtitle={description}>
        <div className="placeholder-card">
          <p className="detail-line">현재 검증된 guest-api 범위에는 이 복구 흐름이 아직 포함되지 않습니다.</p>
          <p className="muted">디자인 자리만 유지하고, 실제 동작은 다음 계정 복구 milestone에서 연결합니다.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="secondary-button" onClick={() => onNavigate('login')}>
            로그인으로 돌아가기
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
