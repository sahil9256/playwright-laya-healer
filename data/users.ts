export type UserRole = 'admin' | 'customer' | 'guest';

export interface UserCredentials {
  role: UserRole;
  email: string;
  password: string;
  name: string;
}

export const users: Record<UserRole, UserCredentials> = {
  admin: {
    role: 'admin',
    email: 'admin@practicesoftwaretesting.com',
    password: 'welcome01',
    name: 'Jane Doe',
  },
  customer: {
    role: 'customer',
    email: 'customer@practicesoftwaretesting.com',
    password: 'welcome01',
    name: 'Jane Doe',
  },
  guest: {
    role: 'guest',
    email: '',
    password: '',
    name: 'Guest',
  },
};

export function getUserByRole(role: UserRole): UserCredentials {
  const user = users[role];
  if (!user) {
    const availableRoles = Object.keys(users).join(', ');
    throw new Error(`Unknown user role: "${role}". Available roles: ${availableRoles}`);
  }
  return user;
}
