import fs from 'fs';
import path from 'path';

export const SESSION_VALIDITY_HOURS = 0.5;
export const LOCK_POLL_INTERVAL_MS = 250;
export const LOCK_MAX_WAIT_MS = 30_000;

/**
 * Checks whether an existing session file is still valid.
 * A session is valid if the file exists, was modified within the validity TTL,
 * and contains non-empty valid JSON.
 */
export function isSessionValid(
  sessionPath: string,
  validityHours: number = SESSION_VALIDITY_HOURS
): boolean {
  try {
    if (!fs.existsSync(sessionPath)) {
      return false;
    }

    const stats = fs.statSync(sessionPath);
    const fileAgeHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
    if (fileAgeHours > validityHours) {
      return false;
    }

    const content = fs.readFileSync(sessionPath, 'utf-8');
    if (!content || !content.trim()) {
      return false;
    }

    const parsed = JSON.parse(content);
    if (typeof parsed !== 'object' || parsed === null) {
      return false;
    }

    if (Array.isArray(parsed.origins)) {
      for (const origin of parsed.origins) {
        if (Array.isArray(origin.localStorage)) {
          const tokenItem = origin.localStorage.find(
            (item: any) => item.name === 'auth-token' || item.name === 'token'
          );
          if (tokenItem && typeof tokenItem.value === 'string') {
            try {
              const parts = tokenItem.value.split('.');
              if (parts.length === 3) {
                const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                if (payload.exp && Date.now() / 1000 >= payload.exp - 30) {
                  return false;
                }
              }
            } catch {
              return false;
            }
          }
        }
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Executes a function under a file-based lock.
 * If the lock exists, waits up to LOCK_MAX_WAIT_MS.
 * Once released, if the session is already valid, returns early without re-executing fn().
 */
export async function withSessionLock(
  lockPath: string,
  sessionPath: string,
  fn: () => Promise<void>
): Promise<void> {
  const startTime = Date.now();
  let waited = false;

  while (fs.existsSync(lockPath)) {
    waited = true;
    if (Date.now() - startTime >= LOCK_MAX_WAIT_MS) {
      throw new Error(
        `Timeout waiting for lockfile "${lockPath}" after ${LOCK_MAX_WAIT_MS}ms`
      );
    }
    await new Promise((resolve) => setTimeout(resolve, LOCK_POLL_INTERVAL_MS));
  }

  // When released, if session became valid, return early without re-executing fn()
  if (waited && isSessionValid(sessionPath)) {
    return;
  }

  const lockDir = path.dirname(lockPath);
  if (!fs.existsSync(lockDir)) {
    fs.mkdirSync(lockDir, { recursive: true });
  }

  fs.writeFileSync(lockPath, String(process.pid));

  try {
    await fn();
  } finally {
    try {
      if (fs.existsSync(lockPath)) {
        fs.unlinkSync(lockPath);
      }
    } catch {
      // ignore error if already removed
    }
  }
}
