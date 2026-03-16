import { createClient } from "redis";

const client = createClient({
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
});

client.on('error', (err) => console.error('[Redis] Client error:', err))
client.on('connect', () => console.log('[Redis] Connected:'))

await client.connect();

export const redis = {
    // ─── 1. 缓存（GET moods 用） ───────────────────────────
    async cache(key, ttlSec, fn) {
        const cached = await client.get(key);
        if(cached) return JSON.parse(cached);
        const data = await fn()
        await client.setEx(key, ttlSec, JSON.stringify(data));
        return data
    },

    async invalidate(key) {
       await client.del(key); 
    },

    // ─── 2. Token 黑名单（logout 用） ──────────────────────
    async blacklistToken(token, ttlSec) {
        await client.setEx(`blacklist:${token}`, ttlSec, '1');
    },

    async isTokenBlacklisted(token) {
        return (await client.exists(`blacklist:${token}`) === 1)
    },

    // ─── 3. 限流（API 保护用） ─────────────────────────────
    async rateLimit(ip, maxReq = 60, windowSec = 60) {
        const key = `ratelimit:${ip}`;
        const count = await client.incr(key);
        if (count === 1) await client.expire(key, windowSec);
        return count > maxReq;
    },
}

