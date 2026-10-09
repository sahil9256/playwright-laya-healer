import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { request } from '@playwright/test';
import { getUserByRole, type UserRole } from '@data/users';
import { isSessionValid, withSessionLock } from './lock-helper.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '../..');
const authDir = path.resolve(projectRoot, 'setup/session-storage/.auth');

export function getAuthDir(): string {
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  return authDir;
}

export function getSessionPath(role: UserRole): string {
  return path.join(getAuthDir(), `${role}.json`);
}

export function getLockPath(role: UserRole): string {
  return path.join(getAuthDir(), `${role}.lock`);
}

/**
 * Ensures an authenticated storage state exists for the given user role.
 * Uses direct API authentication to generate the session state in localStorage,
 * completely bypassing UI-level Cloudflare bot challenges and avoiding orphan browser processes.
 * Returns the path to the storage state file, or null if role is 'guest'.
 */
export async function ensureAuthenticatedSession(
  role: UserRole,
  baseURL?: string
): Promise<string | null> {
  if (role === 'guest') {
    return null;
  }

  const dir = getAuthDir();
  const sessionPath = path.join(dir, `${role}.json`);
  const lockPath = path.join(dir, `${role}.lock`);

  if (isSessionValid(sessionPath)) {
    return sessionPath;
  }

  const user = getUserByRole(role);

  await withSessionLock(lockPath, sessionPath, async () => {
    const baseApi = (process.env.API_URL || 'https://api.practicesoftwaretesting.com').replace(/\/+$/, '');
    const webOrigin = (baseURL || process.env.BASE_URL || 'https://practicesoftwaretesting.com').replace(/\/+$/, '');

    const apiContext = await request.newContext({ baseURL: baseApi });
    try {
      const response = await apiContext.post('/users/login', {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        data: {
          email: user.email,
          password: user.password,
        },
      });

      if (!response.ok()) {
        throw new Error(
          `Authentication failed for role "${role}": ${response.status()} ${await response.text()}`
        );
      }

      const body = await response.json();
      const token = body.access_token as string;
      if (!token) {
        throw new Error(`Authentication for role "${role}" returned no access_token.`);
      }

      const storageState = {
        cookies: [],
        origins: [
          {
            origin: webOrigin,
            localStorage: [
              {
                name: 'auth-token',
                value: token,
              },
            ],
          },
        ],
      };

      const tmpPath = `${sessionPath}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(storageState, null, 2), 'utf-8');
      fs.renameSync(tmpPath, sessionPath);
    } finally {
      await apiContext.dispose();
    }
  });

  return sessionPath;
}
