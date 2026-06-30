import { useState } from 'react';
import { FieldError } from './FieldError.tsx';

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
}

export function TextField({
  id,
  label,
  value,
  onChange,
  error,
  required,
  placeholder,
  hint
}: TextFieldProps): React.ReactElement {
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
      <input
        id={id}
        type="text"
        className="field__input"
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        aria-required={required}
        aria-describedby={describedBy}
        aria-invalid={hasError}
        placeholder={placeholder}
      />
      <FieldError id={errorId} message={displayError} />
    </div>
  );
}
