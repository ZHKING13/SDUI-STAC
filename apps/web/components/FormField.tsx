import type { FieldErrors } from '@famille/shared';

interface FormFieldProps {
  name: string;
  label: string;
  errors?: FieldErrors;
  defaultValue?: string;
  type?: 'text' | 'email' | 'password' | 'tel';
  multiline?: boolean;
  hint?: string;
  autoComplete?: string;
  required?: boolean;
}

/** Champ avec libellé toujours visible et message d'erreur relié au champ. */
export function FormField({
  name,
  label,
  errors,
  defaultValue,
  type = 'text',
  multiline,
  hint,
  autoComplete,
  required = true,
}: FormFieldProps) {
  const id = `field-${name}`;
  const error = errors?.[name];
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  const common = {
    id,
    name,
    defaultValue,
    required,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    className: 'field__input',
  };

  return (
    <div className="field">
      <label htmlFor={id} className="field__label">
        {label}
        {!required && <span className="field__optional"> (facultatif)</span>}
      </label>
      {multiline ? (
        <textarea {...common} rows={5} />
      ) : (
        <input {...common} type={type} autoComplete={autoComplete} />
      )}
      {hint && (
        <p id={`${id}-hint`} className="field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field__error">
          {error}
        </p>
      )}
    </div>
  );
}

/** Champ piège invisible pour les humains : un robot qui le remplit est ignoré. */
export function Honeypot() {
  return (
    <div className="visually-hidden" aria-hidden="true">
      <label htmlFor="field-website">Ne pas remplir ce champ</label>
      <input id="field-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}
