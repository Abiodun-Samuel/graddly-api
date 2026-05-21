import Redis from 'ioredis';

function createTestRedis(): Redis {
  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  });
}

/** Finds the opaque accept token for a given invitation id (parallel-safe scan). */
export async function findInvitationAcceptTokenForInvitationId(
  invitationId: string,
): Promise<string | null> {
  const redis = createTestRedis();
  try {
    const keys = await redis.keys('invitation-accept:*');
    for (const key of keys) {
      const value = await redis.get(key);
      if (value === invitationId) {
        return key.replace('invitation-accept:', '');
      }
    }
    return null;
  } finally {
    await redis.quit();
  }
}
