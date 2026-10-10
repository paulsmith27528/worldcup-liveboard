import { randomBytes } from 'crypto';

const POOL_ID_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const POOL_ID_LENGTH = 6;

// Same 6-char uppercase base36 shape pool ids have always had, but from
// crypto randomness rather than Math.random. Bytes >= 252 are skipped so
// every character is equally likely. Callers still create the pool with
// SET NX and retry on the (rare) clash.
export function genPoolId(): string {
  let id = '';
  while (id.length < POOL_ID_LENGTH) {
    const bytes = randomBytes(POOL_ID_LENGTH * 2);
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      if (b >= 252) continue;
      id += POOL_ID_ALPHABET[b % 36];
      if (id.length === POOL_ID_LENGTH) break;
    }
  }
  return id;
}

export const POOL_ID_ATTEMPTS = 5;
