import { useState, useRef, useEffect, useId } from 'react';
import { FieldError } from './FieldError.tsx';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  id: string;
  label: React.ReactNode;
  ariaLabel?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  error?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
}

export function SelectField({
  id,
  label,
  ariaLabel,
  value,
  onChange,
  options,
  error,
  required,
  placeholder = 'Select…',
  hint
}: SelectFieldProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [touched, setTouched] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const listId = `${id}-list`;
  const uid = useId();

  const selectedOption = options.find(o => o.value === value);
  const isEmpty = value === '';
  const localError = touched && required && isEmpty ? 'This field is required.' : undefined;
  const displayError = error ?? localError;
  const hasError = Boolean(displayError);
  const showHint = Boolean(hint) && isEmpty && !hasError;

  const describedBy =
    [hasError ? errorId : '', showHint ? hintId : ''].filter(Boolean).join(' ') || undefined;

  function optionId(index: number): string {
    return `${uid}-option-${index}`;
  }

  function openList(): void {
    const idx = options.findIndex(o => o.value === value);

    setActiveIndex(idx >= 0 ? idx : 0);
    setOpen(true);
  }

  function closeList(): void {
    setOpen(false);
    setActiveIndex(-1);
    setTouched(true);
    triggerRef.current?.focus();
  }

  function closeListSilent(): void {
    setOpen(false);
    setActiveIndex(-1);
    setTouched(true);
  }

  function handleContainerBlur(e: React.FocusEvent<HTMLDivElement>): void {
    if (open && !e.currentTarget.contains(e.relatedTarget as Node)) {
      closeListSilent();
    }
  }

  function select(val: string): void {
    onChange(val);
    closeList();
  }

  function handleTriggerKeyDown(e: React.KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      openList();
    }
  }

  function handleListKeyDown(e: React.KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeList();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();

      if (activeIndex >= 0 && options[activeIndex]) {
        select(options[activeIndex].value);
      }
    }
  }

  useEffect(() => {
    if (!open) return;

    function handleMouseDown(e: MouseEvent): void {
      const trigger = triggerRef.current;
      const list = listRef.current;

      if (!trigger?.contains(e.target as Node) && !list?.contains(e.target as Node)) {
        closeListSilent();
      }
    }

    document.addEventListener('mousedown', handleMouseDown);

    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  useEffect(() => {
    if (open && activeIndex >= 0) {
      const items = listRef.current?.querySelectorAll<HTMLElement>('[role="option"]');

      items?.[activeIndex]?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [open, activeIndex]);

  useEffect(() => {
    if (open) {
      listRef.current?.focus();
    }
  }, [open]);

  return (
    <div className={`field select${hasError ? ' field--invalid' : ''}`} onBlur={handleContainerBlur}>
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
      <div className="select__container">
        <button
          ref={triggerRef}
          id={id}
          type="button"
          className="select__trigger"
          tabIndex={0}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-required={required}
          aria-describedby={describedBy}
          aria-invalid={hasError}
          onClick={() => (open ? closeList() : openList())}
          onKeyDown={handleTriggerKeyDown}
        >
          <span className={selectedOption ? '' : 'select__placeholder'}>
            {selectedOption?.label ?? placeholder}
          </span>
          <span className="select__arrow" aria-hidden="true">
            ▾
          </span>
        </button>
        {open && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            className="select__list"
            aria-label={ariaLabel ?? (typeof label === 'string' ? label : undefined)}
            aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
            onKeyDown={handleListKeyDown}
          >
            {options.map((opt, i) => (
              <li
                key={opt.value}
                id={optionId(i)}
                role="option"
                aria-selected={opt.value === value}
                className={[
                  'select__option',
                  opt.value === value ? 'select__option--selected' : '',
                  i === activeIndex ? 'select__option--active' : ''
                ]
                  .filter(Boolean)
                  .join(' ')}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={e => {
                  e.preventDefault();
                  select(opt.value);
                }}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      <FieldError id={errorId} message={displayError} />
    </div>
  );
}
