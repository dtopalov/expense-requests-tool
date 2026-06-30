import { useAuth } from '../context/AuthContext.tsx';
import type { User } from '../models/user.ts';

export function useCurrentUser(): User | null {
  return useAuth().currentUser;
}
