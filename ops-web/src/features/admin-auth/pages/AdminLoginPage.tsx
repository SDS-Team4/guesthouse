import { Field } from '../../../shared/ui/Field';
import { SectionCard } from '../../../shared/ui/SectionCard';

type AdminLoginPageProps = {
  onLogin: () => void;
};

export function AdminLoginPage({ onLogin }: AdminLoginPageProps) {
  return (
    <SectionCard title="Admin Login" subtitle="Extracted from the admin draft for later session wiring.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Admin ID" placeholder="admin_root" />
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
