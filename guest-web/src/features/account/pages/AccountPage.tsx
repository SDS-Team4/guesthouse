import { Field } from '../../../shared/ui/Field';

export function AccountPage() {
  return (
    <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        <button
          type="button"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Profile
        </button>
        <button
          type="button"
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          Password
        </button>
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-lg px-4 py-2 text-sm font-medium text-slate-400"
        >
          Host role request
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Profile</h2>
          <Field label="Name" defaultValue="Draft Guest" />
          <Field label="Email" type="email" defaultValue="guest@example.com" />
          <Field label="Phone" defaultValue="010-1234-5678" />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Password Change</h2>
          <Field label="Current password" type="password" placeholder="Enter current password" />
          <Field label="New password" type="password" placeholder="Enter new password" />
          <Field label="Confirm new password" type="password" placeholder="Repeat new password" />
        </section>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Save
        </button>
      </div>
    </div>
  );
}
