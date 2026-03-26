import { Field } from '../../../shared/ui/Field';

type PlaceholderPageProps = {
  title: string;
  description: string;
  buttonText: string;
  fields: string[];
};

export function PlaceholderPage({
  title,
  description,
  buttonText,
  fields
}: PlaceholderPageProps) {
  return (
    <div className="auth-card-shell">
      <div className="auth-card">
        <div className="auth-card-header">
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <div className="stack">
          {fields.map((field) => (
            <Field key={field} label={field} disabled placeholder={`${field} 입력`} />
          ))}

          <button type="button" disabled className="placeholder-disabled-button">
            {buttonText}
          </button>

          <p className="auth-footer-copy">현재 단계에서는 이 화면을 플레이스홀더로만 유지합니다.</p>
        </div>
      </div>
    </div>
  );
}
