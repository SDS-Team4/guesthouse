import { SectionCard } from '../../../shared/ui/SectionCard';
import { guestAccommodationDrafts } from '../mock';

type AccommodationsPageProps = {
  onOpenDetail?: (accommodationId: number) => void;
};

export function AccommodationsPage({ onOpenDetail }: AccommodationsPageProps) {
  return (
    <SectionCard
      title="Accommodation Results"
      subtitle="Result list page extracted from the guest draft. It will later map to the search response contract."
    >
      <div className="grid gap-4">
        {guestAccommodationDrafts.map((item) => (
          <button
            key={item.accommodationId}
            type="button"
            onClick={() => onOpenDetail?.(item.accommodationId)}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-bold text-slate-900">{item.accommodationName}</div>
                <p className="mt-1 text-sm text-slate-500">{item.region}</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                {item.availabilityCategory}
              </span>
            </div>
          </button>
        ))}
      </div>
    </SectionCard>
  );
}
