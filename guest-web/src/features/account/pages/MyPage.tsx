import { SectionCard } from '../../../shared/ui/SectionCard';

type MyPageProps = {
  onOpenAccount?: () => void;
  onOpenReservations?: () => void;
  onLogout?: () => void;
};

export function MyPage({
  onOpenAccount,
  onOpenReservations,
  onLogout
}: MyPageProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <SectionCard title="My Info" subtitle="Current signed-in guest profile snapshot from the draft.">
        <div className="mb-4 h-16 w-16 rounded-full bg-slate-100" />
        <div className="space-y-1 text-sm text-slate-600">
          <div className="text-xl font-bold text-slate-900">Draft Guest</div>
          <div>guest@example.com</div>
          <div>010-1234-5678</div>
        </div>
      </SectionCard>

      <SectionCard title="My Page" subtitle="Main guest account menu from the draft UI.">
        <div className="grid gap-3">
          <MenuButton label="Account management" onClick={onOpenAccount} />
          <MenuButton label="Reservation list" onClick={onOpenReservations} />
          <MenuButton label="Logout" onClick={onLogout} />
        </div>
      </SectionCard>
    </div>
  );
}

function MenuButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-4 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
    >
      <span>{label}</span>
      <span>›</span>
    </button>
  );
}
