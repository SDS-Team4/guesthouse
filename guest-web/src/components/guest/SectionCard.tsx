import { ReactNode } from 'react';

type SectionCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function SectionCard({ title, subtitle, children, actions, className }: SectionCardProps) {
  return (
    <section className={`section-card ${className ?? ''}`.trim()}>
      <div className="section-card-header">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p className="muted">{subtitle}</p> : null}
        </div>
        {actions ? <div className="section-card-actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
