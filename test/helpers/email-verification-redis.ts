import Redis from 'ioredis';

function createTestRedis(): Redis {
  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  });
}

export async function clearEmailVerificationTokens(): Promise<void> {
  const redis = createTestRedis();
  try {
    const keys = await redis.keys('email-verify:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } finally {
    await redis.quit();
  }
}

/** Finds the verification token for a specific user (safe under parallel e2e). */
export async function findEmailVerificationTokenForUserId(
  userId: string,
): Promise<string | null> {
  const redis = createTestRedis();
  try {
    const keys = await redis.keys('email-verify:*');
    for (const key of keys) {
      const value = await redis.get(key);
      if (value === userId) {
        return key.replace('email-verify:', '');
      }
    }
    return null;
  } finally {
    await redis.quit();
  }
}

/**
 * @deprecated Prefer {@link findEmailVerificationTokenForUserId} to avoid cross-test races.
 */
export async function getLatestEmailVerificationToken(): Promise<
  string | null
> {
  const redis = createTestRedis();
  try {
    const keys = await redis.keys('email-verify:*');
    if (keys.length === 0) {
      return null;
    }
    const key = keys[keys.length - 1];
    return key.replace('email-verify:', '');
  } finally {
    await redis.quit();
  }
}
