import { useEffect, useRef } from 'react';
import { Button } from './Button.tsx';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps): React.ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();

    return () => dialogRef.current?.close();
  }, []);

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>): void {
    if (e.target === dialogRef.current) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby="modal-title"
      onClick={handleBackdropClick}
      onClose={onClose}
    >
      <div className="modal__content">
        <div className="modal__header">
          <h2 id="modal-title" className="modal__title">
            {title}
          </h2>
          <Button variant="secondary" onClick={onClose} aria-label="Close dialog">
            ✕
          </Button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </dialog>
  );
}
