import { useState } from 'react';

interface WhyRequiredProps {
  reason: string;
}

export function WhyRequired({ reason }: WhyRequiredProps): React.ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <span className="why-required">
      <button
        type="button"
        className="why-required__trigger"
        tabIndex={0}
        aria-label="Why is this required?"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        ?
      </button>
      {open && (
        <span className="why-required__tooltip" role="tooltip">
          {reason}
        </span>
      )}
    </span>
  );
}
