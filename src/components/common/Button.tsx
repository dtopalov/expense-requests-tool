interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  className,
  children,
  ...rest
}: ButtonProps): React.ReactElement {
  const cls = ['btn', `btn--${variant}`, className].filter(Boolean).join(' ');
  return (
    <button className={cls} tabIndex={0} {...rest}>
      {children}
    </button>
  );
}
