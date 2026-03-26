import { Field } from '../../../shared/ui/Field';
import { SectionCard } from '../../../shared/ui/SectionCard';

type SearchPageProps = {
  onSearch?: () => void;
};

export function SearchPage({ onSearch }: SearchPageProps) {
  return (
    <SectionCard
      title="Search"
      subtitle="Initial guest search page extracted from the draft. This keeps the search contract visible before API wiring."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Region" defaultValue="SEOUL" />
        <Field label="Check-in" type="date" defaultValue="2026-04-12" />
        <Field label="Check-out" type="date" defaultValue="2026-04-14" />
        <Field label="Guests" type="number" defaultValue="2" />
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onSearch}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Search accommodations
        </button>
      </div>
    </SectionCard>
  );
}
