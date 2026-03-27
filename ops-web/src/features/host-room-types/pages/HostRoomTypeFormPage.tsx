import { Field } from '../../../shared/ui/Field';
import { SectionCard } from '../../../shared/ui/SectionCard';

export function HostRoomTypeFormPage() {
  return (
    <SectionCard
      title="Room Type Form"
      subtitle="This becomes the UI contract for room-type create and edit APIs."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Room type name" defaultValue="Double Room" />
        <Field label="Base capacity" type="number" defaultValue="2" />
        <Field label="Max capacity" type="number" defaultValue="2" />
        <Field label="Base price" type="number" defaultValue="89000" />
      </div>
    </SectionCard>
  );
}
