import { Redis } from '@upstash/redis';
import { createHash } from 'crypto';

// Reads pool and player records exactly as stored (no automatic JSON parsing),
// so a later save can check that nothing else changed them in the meantime.
// Without that, a pick saved while grading runs (or the other way round)
// silently overwrote the other: picks vanished, or eliminated players came
// back.
export const rawRedis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  automaticDeserialization: false,
});

export function parse<T = any>(raw: unknown): T {
  return (typeof raw === 'string' ? JSON.parse(raw) : raw) as T;
}

export async function readPool(poolId: string) {
  const raw = await rawRedis.get<string>(`lms:pool:${poolId}`);
  return raw ? { raw, pool: parse(raw) } : null;
}

export async function readPlayer(poolId: string, token: string) {
  const raw = await rawRedis.hget<string>(`lms:pool:${poolId}:players`, token);
  return raw ? { raw, player: parse(raw) } : null;
}

export async function readPlayers(poolId: string) {
  // Without automatic parsing the client hands HGETALL back as a flat
  // [field, value, field, value, ...] list.
  const all: unknown = await rawRedis.hgetall(`lms:pool:${poolId}:players`);
  const pairs: [string, string][] = [];
  if (Array.isArray(all)) {
    for (let i = 0; i + 1 < all.length; i += 2) pairs.push([String(all[i]), String(all[i + 1])]);
  } else if (all && typeof all === 'object') {
    for (const [k, v] of Object.entries(all)) pairs.push([k, typeof v === 'string' ? v : JSON.stringify(v)]);
  }
  return pairs.map(([token, raw]) => ({ token, raw, player: parse(raw) }));
}

// "Only save if these records are still exactly as I read them."
export type Check =
  | { hash: string; field: string; was: string | null }
  | { key: string; was: string | null };
export type Write =
  | { hash: string; field: string; value: string }
  | { key: string; value: string; ttl?: number | 'keep' };

const COMMIT = `
local ops = cjson.decode(ARGV[1])
for _, c in ipairs(ops.c) do
  local cur
  if c[1] == 'h' then cur = redis.call('HGET', c[2], c[3]) else cur = redis.call('GET', c[2]) end
  if c[4] == false then
    if cur then return 0 end
  elseif not cur or redis.sha1hex(cur) ~= c[4] then
    return 0
  end
end
for _, w in ipairs(ops.w) do
  if w[1] == 'h' then
    redis.call('HSET', w[2], w[3], w[4])
  elseif w[5] == -1 then
    redis.call('SET', w[2], w[4], 'KEEPTTL')
  elseif w[5] > 0 then
    redis.call('SET', w[2], w[4], 'EX', w[5])
  else
    redis.call('SET', w[2], w[4])
  end
end
return 1
`;

// Applies every write together, and only if every check still holds.
// Returns false (and changes nothing) if anything moved underneath.
export async function commit(checks: Check[], writes: Write[]): Promise<boolean> {
  // Checks send a fingerprint of the record, not the record itself, so a
  // pool full of big avatars doesn't double the size of the request.
  const digest = (v: string | null) => v == null ? false : createHash('sha1').update(v, 'utf8').digest('hex');
  const c = checks.map(ch => 'hash' in ch ? ['h', ch.hash, ch.field, digest(ch.was)] : ['k', ch.key, '', digest(ch.was)]);
  const w = writes.map(wr => 'hash' in wr
    ? ['h', wr.hash, wr.field, wr.value, 0]
    : ['k', wr.key, '', wr.value, wr.ttl === 'keep' ? -1 : (wr.ttl || 0)]);
  const keys = Array.from(new Set([...checks, ...writes].map(x => 'hash' in x ? x.hash : x.key)));
  const result = await rawRedis.eval(COMMIT, keys, [JSON.stringify({ c, w })]);
  return Number(result) === 1;
}

// Runs a read-change-save step, retrying from a fresh read if something else
// saved in between. The step returns null to stop without saving.
export async function withRetry<T>(attempts: number, step: () => Promise<T | 'conflict'>): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    const out = await step();
    if (out !== 'conflict') return out;
    await new Promise(r => setTimeout(r, 100 + Math.random() * 300));
  }
  throw new Error('Too many concurrent changes, please try again');
}

// Read-change-save for one pool record, safe against anything else saving
// it at the same time. `change` returns false to leave it untouched.
export async function updatePool(poolId: string, change: (pool: any) => boolean | void): Promise<any | null> {
  return withRetry(8, async () => {
    const rec = await readPool(poolId);
    if (!rec) return null;
    if (change(rec.pool) === false) return rec.pool;
    const key = `lms:pool:${poolId}`;
    const ok = await commit([{ key, was: rec.raw }], [{ key, value: JSON.stringify(rec.pool), ttl: 'keep' }]);
    return ok ? rec.pool : 'conflict';
  });
}

// The same for one player record.
export async function updatePlayer(poolId: string, token: string, change: (player: any) => boolean | void): Promise<any | null> {
  return withRetry(8, async () => {
    const rec = await readPlayer(poolId, token);
    if (!rec) return null;
    if (change(rec.player) === false) return rec.player;
    const hash = `lms:pool:${poolId}:players`;
    const ok = await commit([{ hash, field: token, was: rec.raw }], [{ hash, field: token, value: JSON.stringify(rec.player) }]);
    return ok ? rec.player : 'conflict';
  });
}
