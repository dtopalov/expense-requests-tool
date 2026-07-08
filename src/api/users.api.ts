import { apiFetch } from './client.ts';
import type { User } from '../models/user.ts';

export function fetchUsers(): Promise<User[]> {
  return apiFetch<User[]>('/api/users');
}
