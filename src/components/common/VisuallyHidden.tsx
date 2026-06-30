interface VisuallyHiddenProps {
  children: React.ReactNode;
}

export function VisuallyHidden({ children }: VisuallyHiddenProps): React.ReactElement {
  return <span className="visually-hidden">{children}</span>;
}
