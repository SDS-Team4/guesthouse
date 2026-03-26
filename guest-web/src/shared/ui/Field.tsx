import { cn } from '../lib/cn';

type FieldProps = {
  label: string;
  placeholder?: string;
  type?: string;
  defaultValue?: string;
  disabled?: boolean;
};

export function Field({
  label,
  placeholder,
  type = 'text',
  defaultValue,
  disabled
}: FieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-xl border px-4 py-3 text-sm outline-none transition',
          disabled
            ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
            : 'border-slate-300 focus:border-slate-900'
        )}
      />
    </div>
  );
}
