import { useAuth } from '../../context/AuthContext.tsx';
import { SelectField } from '../form/SelectField.tsx';

function UserIcon(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      width="18"
      height="18"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <title>Current user</title>
      <path d="M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4z" />
    </svg>
  );
}

export function UserPicker(): React.ReactElement {
  const { currentUser, users, setCurrentUser } = useAuth();

  const userOptions = users.map(u => ({ value: u.id, label: `${u.name} (${u.role})` }));

  return (
    <div className="user-picker">
      <SelectField
        id="user-select"
        label={<UserIcon />}
        ariaLabel="Current user"
        value={currentUser?.id ?? ''}
        onChange={id => {
          const user = users.find(u => u.id === id);
          if (user) setCurrentUser(user);
        }}
        options={userOptions}
      />
    </div>
  );
}
