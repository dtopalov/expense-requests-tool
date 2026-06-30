import { useAuth } from '../context/AuthContext.tsx';
import type { User } from '../models/user.ts';

export function useUsers(): User[] {
  return useAuth().users;
}
