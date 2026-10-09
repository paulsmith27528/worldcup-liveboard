// Organiser pricing for Last Man Standing pools:
//   free        — up to 11 players (the 11th is a free bonus slot)
//   £5 upgrade  — up to 100 players
//   £20 upgrade — no limit
// Pools that paid the old £5 "no limit" upgrade before the £20 tier existed
// have organiserFeePaid but no organiserFeeTier — they keep what they paid for.
export const FREE_LIMIT = 11;
export const STANDARD_LIMIT = 100;
// Heads-up email to the organiser when a £5 pool reaches this many players.
export const BIG_POOL_WARNING_AT = 90;

export function poolPlayerLimit(pool: any): number {
  if (pool.organiserBigPoolPaid) return Infinity;
  if (pool.organiserFeePaid && !pool.organiserFeeTier) return Infinity;
  if (pool.organiserFeePaid) return STANDARD_LIMIT;
  return FREE_LIMIT;
}
