import type { ReactNode } from 'react';

type SectionCardProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function SectionCard({ title, subtitle, actions, children, className }: SectionCardProps) {
  const classes = ['ops-section', className].filter(Boolean).join(' ');

  return (
    <section className={classes}>
      <div className="ops-section-header">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p className="muted">{subtitle}</p> : null}
        </div>
        {actions ? <div className="ops-section-actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
