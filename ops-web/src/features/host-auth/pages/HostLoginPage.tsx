import { Field } from '../../../shared/ui/Field';
import { SectionCard } from '../../../shared/ui/SectionCard';

type HostLoginPageProps = {
  onLogin: () => void;
};

export function HostLoginPage({ onLogin }: HostLoginPageProps) {
  return (
    <SectionCard
      title="Host Login"
      subtitle="Extracted from the draft host UI for later API wiring."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Login ID" placeholder="host_login" />
        <Field label="Password" type="password" placeholder="••••••••" />
      </div>
      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onLogin}
          className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
        >
          Login
        </button>
      </div>
    </SectionCard>
  );
}
