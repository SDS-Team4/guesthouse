import { Field } from '../../../shared/ui/Field';

type LoginPageProps = {
  onLogin?: () => void;
  onOpenSignup?: () => void;
  onOpenFindId?: () => void;
  onOpenFindPassword?: () => void;
};

export function LoginPage({
  onLogin,
  onOpenSignup,
  onOpenFindId,
  onOpenFindPassword
}: LoginPageProps) {
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-8 text-center">
        <div className="text-2xl font-bold text-slate-900">Guest Login</div>
        <p className="mt-2 text-sm text-slate-500">Draft page split from the original guest UI.</p>
      </div>

      <div className="space-y-4">
        <Field label="Login ID" placeholder="Enter your login ID" />
        <Field label="Password" type="password" placeholder="Enter your password" />
        <button
          type="button"
          onClick={onLogin}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Login
        </button>
      </div>

      <div className="mt-5 flex items-center justify-between text-sm">
        <button type="button" onClick={onOpenFindId} className="text-slate-500 transition hover:text-slate-900">
          Find ID
        </button>
        <button
          type="button"
          onClick={onOpenFindPassword}
          className="text-slate-500 transition hover:text-slate-900"
        >
          Find password
        </button>
      </div>

      <div className="mt-6 border-t border-slate-200 pt-5 text-center text-sm text-slate-500">
        Need an account?{' '}
        <button
          type="button"
          onClick={onOpenSignup}
          className="font-semibold text-slate-900 underline underline-offset-4"
        >
          Sign up
        </button>
      </div>
    </div>
  );
}
