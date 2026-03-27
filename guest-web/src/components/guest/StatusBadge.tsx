type StatusBadgeProps = {
  variant:
    | 'pending'
    | 'confirmed'
    | 'cancelled'
    | 'available'
    | 'condition_mismatch'
    | 'sold_out'
    | 'approved'
    | 'denied'
    | 'neutral';
  label: string;
};

export function StatusBadge({ variant, label }: StatusBadgeProps) {
  return <span className={`status-pill status-${variant}`}>{label}</span>;
}
