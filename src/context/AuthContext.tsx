import { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { setCurrentUserId, getCurrentUserId } from '../api/client.ts';
import { fetchUsers } from '../api/users.api.ts';
import type { User } from '../models/user.ts';

interface AuthContextValue {
  currentUser: User | null;
  users: User[];
  setCurrentUser: (user: User) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers()
      .then(data => {
        setUsers(data);

        if (data.length > 0) {
          const stored = getCurrentUserId();
          const initial = (stored ? data.find(u => u.id === stored) : null) ?? data[0]!;

          setCurrentUserState(initial);
          setCurrentUserId(initial.id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function setCurrentUser(user: User): void {
    setCurrentUserState(user);
    setCurrentUserId(user.id);
  }

  return (
    <AuthContext.Provider value={{ currentUser, users, setCurrentUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);

  if (!ctx) throw new Error('useAuth must be used within AuthProvider');

  return ctx;
}
