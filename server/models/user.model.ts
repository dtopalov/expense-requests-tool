export type Role = 'employee' | 'manager' | 'finance';

export interface User {
  id: string;
  name: string;
  role: Role;
  managerId: string | null;
}
