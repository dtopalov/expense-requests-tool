import { createRequire } from 'module';
import type { User, Role } from '../models/user.model.ts';

const require = createRequire(import.meta.url);
const seedUsers: User[] = require('../../data/users.json');

const users = new Map<string, User>(seedUsers.map(u => [u.id, u]));

export const userStore = {
  findAll(): User[] {
    return Array.from(users.values());
  },

  findById(id: string): User | undefined {
    return users.get(id);
  },

  findByRole(role: Role): User | undefined {
    return Array.from(users.values()).find(u => u.role === role);
  },

  findAllByRole(role: Role): User[] {
    return Array.from(users.values()).filter(u => u.role === role);
  }
};
