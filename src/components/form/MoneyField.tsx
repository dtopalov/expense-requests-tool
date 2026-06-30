import { useState } from 'react';
import { FieldError } from './FieldError.tsx';

interface MoneyFieldProps {
  id: string;
  label: string;
  valueCents: number | undefined;
  onChange: (cents: number | undefined) => void;
  error?: string;
  required?: boolean;
  hint?: string;
}

function centsToDisplay(cents: number | undefined): string {
  if (cents === undefined) return '';

  return (cents / 100).toFixed(2);
}

function parseToCents(raw: string): number | undefined {
  const trimmed = raw.trim().replace(/^\$/, '');

  if (trimmed === '') return undefined;

  const parsed = parseFloat(trimmed);

  if (isNaN(parsed) || parsed < 0) return undefined;

  return Math.round(parsed * 100);
}

export function MoneyField({
  id,
  label,
  valueCents,
  onChange,
  error,
  required,
  hint
}: MoneyFieldProps): React.ReactElement {
  const [display, setDisplay] = useState(centsToDisplay(valueCents));
  const [touched, setTouched] = useState(false);
  const [localInvalidError, setLocalInvalidError] = useState<string | undefined>(undefined);
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const isEmpty = valueCents === undefined;
  const localRequiredError = touched && required && isEmpty && !localInvalidError
    ? 'This field is required.'
    : undefined;
  const localError = localInvalidError ?? localRequiredError;
  const displayError = error ?? localError;
  const hasError = Boolean(displayError);
  const showHint = Boolean(hint) && isEmpty && !hasError;

  const describedBy =
    [hasError ? errorId : '', showHint ? hintId : ''].filter(Boolean).join(' ') || undefined;

  function handleChange(raw: string): void {
    setDisplay(raw);
    setLocalInvalidError(undefined);
    onChange(parseToCents(raw));
  }

  function handleBlur(): void {
    const trimmed = display.trim().replace(/^\$/, '');
    const cents = parseToCents(display);

    if (trimmed !== '' && cents === undefined) {
      setLocalInvalidError('Enter a valid amount');
    } else {
      setLocalInvalidError(undefined);
      setDisplay(centsToDisplay(cents));
      onChange(cents);
    }

    setTouched(true);
  }

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
      <div className="field__money-wrapper">
        <span className="field__currency" aria-hidden="true">
          $
        </span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          className="field__input field__input--money"
          value={display}
          onChange={e => handleChange(e.target.value)}
          onBlur={handleBlur}
          aria-required={required}
          aria-describedby={describedBy}
          aria-invalid={hasError}
          placeholder="0.00"
        />
      </div>
      <FieldError id={errorId} message={displayError} />
    </div>
  );
}
