import { Field } from '../../../shared/ui/Field';

type SignupPageProps = {
  onComplete?: () => void;
};

export function SignupPage({ onComplete }: SignupPageProps) {
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-8 text-center">
        <div className="text-2xl font-bold text-slate-900">Guest Signup</div>
        <p className="mt-2 text-sm text-slate-500">Draft page split from the original guest UI.</p>
      </div>

      <div className="space-y-4">
        <Field label="Login ID" placeholder="Create a login ID" />
        <Field label="Password" type="password" placeholder="Create a password" />
        <Field label="Password Confirm" type="password" placeholder="Repeat your password" />
        <Field label="Name" placeholder="Enter your name" />
        <Field label="Email" type="email" placeholder="example@email.com" />
        <Field label="Phone" placeholder="010-0000-0000" />

        <label className="flex items-start gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
          <input type="checkbox" className="mt-0.5" />
          <span>Required terms agreement placeholder from the guest draft UI.</span>
        </label>

        <button
          type="button"
          onClick={onComplete}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Sign up
        </button>
      </div>
    </div>
  );
}
