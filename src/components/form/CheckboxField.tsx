interface CheckboxFieldProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function CheckboxField({
  id,
  label,
  checked,
  onChange
}: CheckboxFieldProps): React.ReactElement {
  return (
    <div className="field field--checkbox">
      <label className="field__label field__label--checkbox" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          className="field__checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
        />
        {label}
      </label>
    </div>
  );
}
