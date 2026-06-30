import { useState } from 'react';
import { FieldError } from './FieldError.tsx';

interface TextAreaFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  hint?: string;
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  error,
  required,
  placeholder,
  rows = 3,
  hint
}: TextAreaFieldProps): React.ReactElement {
  const [touched, setTouched] = useState(false);
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const isEmpty = value === '';
  const localError = touched && required && isEmpty ? 'This field is required.' : undefined;
  const displayError = error ?? localError;
  const hasError = Boolean(displayError);
  const showHint = Boolean(hint) && isEmpty && !hasError;

  const describedBy =
    [hasError ? errorId : '', showHint ? hintId : ''].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`field${hasError ? ' field--invalid' : ''}`}>
      <label className="field__label" htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden="true" className="field__required-mark">
            {' '}
            *
          </span>
        )}
      </label>
      {showHint && (
        <span id={hintId} className="field__hint">
          {hint}
        </span>
      )}
      <textarea
        id={id}
        className="field__input field__input--textarea"
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        rows={rows}
        aria-required={required}
        aria-describedby={describedBy}
        aria-invalid={hasError}
        placeholder={placeholder}
      />
      <FieldError id={errorId} message={displayError} />
    </div>
  );
}
