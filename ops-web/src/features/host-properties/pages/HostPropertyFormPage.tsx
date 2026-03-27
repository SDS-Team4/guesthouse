import { Field } from '../../../shared/ui/Field';
import { SectionCard } from '../../../shared/ui/SectionCard';

export function HostPropertyFormPage() {
  return (
    <SectionCard
      title="Property Form"
      subtitle="Draft-based form slice for create and edit flows."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Property name" defaultValue="Aurora Guesthouse" />
        <Field label="Region" defaultValue="Seoul Mapo" />
        <Field label="Address" defaultValue="31 Daeyeosan-ro 12-gil, Mapo-gu, Seoul" />
        <Field label="Contact" defaultValue="02-123-4567" />
        <Field label="Check-in time" defaultValue="15:00" />
        <Field label="Check-out time" defaultValue="11:00" />
      </div>
      <div className="mt-5">
        <label className="mb-2 block text-sm font-medium text-slate-700">Property info</label>
        <textarea
          defaultValue="Urban guesthouse with lounge and rooftop access."
          className="min-h-32 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
        />
      </div>
    </SectionCard>
  );
}
