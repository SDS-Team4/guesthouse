import type { ReactNode } from 'react';

type StatusPillProps = {
  children: ReactNode;
  tone?:
    | 'default'
    | 'brand'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'preview';
  className?: string;
};

export function StatusPill({ children, tone = 'default', className }: StatusPillProps) {
  const classes = ['ops-pill', `ops-pill-${tone}`, className].filter(Boolean).join(' ');
  return <span className={classes}>{children}</span>;
}
