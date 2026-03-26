import { SectionCard } from '../../../shared/ui/SectionCard';

type ReservationRequestPageProps = {
  onSubmit?: () => void;
  onBack?: () => void;
};

export function ReservationRequestPage({
  onSubmit,
  onBack
}: ReservationRequestPageProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_360px]">
      <SectionCard title="Reservation Request" subtitle="Review and submit the request from the guest draft flow.">
        <div className="space-y-5">
          <div className="grid gap-4 rounded-2xl border border-slate-200 p-4 sm:grid-cols-2">
            <InfoBlock label="Accommodation" value="Draft Guesthouse One" />
            <InfoBlock label="Room type" value="Double Room" />
            <InfoBlock label="Stay" value="2026-04-12 ~ 2026-04-14" />
            <InfoBlock label="Guests" value="2 guests" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Special request</label>
            <textarea
              rows={5}
              placeholder="Add a message for the host"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
            />
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            After submission, the reservation stays pending until operations confirms it. Inventory may still reject the request.
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Summary" subtitle="Final review before request">
        <div className="space-y-3 text-sm text-slate-600">
          <div className="flex justify-between gap-3">
            <span>Base amount</span>
            <span className="font-medium text-slate-900">178,000 KRW</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>Guests</span>
            <span className="font-medium text-slate-900">2</span>
          </div>
          <div className="flex justify-between gap-3 border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
            <span>Total</span>
            <span>178,000 KRW</span>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={onSubmit}
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Submit reservation request
          </button>
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Back to detail
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}
