import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private readonly config: ConfigService) {
    this.client = new Redis({
      host: this.config.get<string>('app.redis.host', 'localhost'),
      port: this.config.get<number>('app.redis.port', 6379),
      password: this.config.get<string>('app.redis.password'),
      family: 0,
      maxRetriesPerRequest: 3,
    });
  }

  /** Native client for connect-redis and other libraries that expect ioredis. */
  getClient(): Redis {
    return this.client;
  }

  get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  /** SET key value EX ttl NX — returns true when the lock was acquired. */
  async setNx(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    const result = await this.client.set(key, value, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  /** Deletes the key only when the stored value matches owner (safe lock release). */
  async releaseLockIfOwner(key: string, owner: string): Promise<void> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    await this.client.eval(script, 1, key, owner);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async flushAll(): Promise<void> {
    await this.client.flushall();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
