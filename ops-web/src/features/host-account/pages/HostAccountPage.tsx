import { Field } from '../../../shared/ui/Field';
import { SectionCard } from '../../../shared/ui/SectionCard';

export function HostAccountPage() {
  return (
    <SectionCard title="Host Account" subtitle="Account management slice from the host draft.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name" defaultValue="Moon Host" />
        <Field label="Email" defaultValue="host@example.com" />
        <Field label="Phone" defaultValue="010-1234-5678" />
        <Field label="Login ID" defaultValue="host_moon" disabled />
      </div>
    </SectionCard>
  );
}
