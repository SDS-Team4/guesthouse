import type { FormEvent } from 'react';

type LoginPageProps = {
  loginId: string;
  password: string;
  loggingIn: boolean;
  onLoginIdChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function LoginPage({
  loginId,
  password,
  loggingIn,
  onLoginIdChange,
  onPasswordChange,
  onSubmit
}: LoginPageProps) {
  return (
    <div className="ops-login-layout">
      <section className="ops-login-hero">
        <p className="eyebrow">Guesthouse</p>
        <h1>Host and admin operations</h1>
        <p className="hero-copy">
          Review reservations, manage accommodations and rooms, control pricing and blocks, and handle admin
          governance from one sign-in.
        </p>
        <div className="ops-login-signals">
          <span>Session-based auth</span>
          <span>Host ownership enforced</span>
          <span>Admin override preserved</span>
        </div>
      </section>

      <section className="ops-login-card">
        <h2>Sign in</h2>
        <form className="stack" onSubmit={onSubmit}>
          <label>
            Login ID
            <input value={loginId} onChange={(event) => onLoginIdChange(event.target.value)} />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => onPasswordChange(event.target.value)} />
          </label>
          <button type="submit" disabled={loggingIn}>
            {loggingIn ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </div>
  );
}
