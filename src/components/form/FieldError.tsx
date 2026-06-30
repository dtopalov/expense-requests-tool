interface FieldErrorProps {
  id: string;
  message: string | undefined;
}

export function FieldError({ id, message }: FieldErrorProps): React.ReactElement | null {
  if (!message) return null;
  return (
    <span id={id} className="field__error" role="alert">
      {message}
    </span>
  );
}
