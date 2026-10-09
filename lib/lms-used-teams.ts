import type { Redis } from '@upstash/redis';

// A team picked in a wipeout week (everyone went out, so everyone was put
// back in) still counts as used. Grading used to skip recording it, which let
// players pick the same team again. This finds those missing teams from the
// permanent per-gameweek pick snapshots so existing pools can be repaired.
export async function wipeoutPicks(redis: Redis, poolId: string, pool: any) {
  const weeks: number[] = pool.wipeoutWeeks || [];
  const snapshots = await Promise.all(weeks.map(gw => redis.get<any>(`lms:pool:${poolId}:picks:${gw}`)));
  const picks: { id?: number; name: string; team: string }[] = [];
  for (const raw of snapshots) {
    if (!raw) continue;
    const snap = typeof raw === 'string' ? JSON.parse(raw) : raw;
    for (const p of snap.picks || []) picks.push(p);
  }
  // Older snapshots have no player id, so fall back to matching by name.
  return (player: { id: number; name: string }) =>
    picks.filter(p => (p.id != null ? p.id === player.id : p.name === player.name)).map(p => p.team);
}

// Adds any missing teams to the player's used list; true if anything changed.
export function addUsedTeams(player: { usedTeams: string[] }, teams: string[]) {
  let changed = false;
  for (const team of teams) {
    if (team && !player.usedTeams.includes(team)) {
      player.usedTeams.push(team);
      changed = true;
    }
  }
  return changed;
}
