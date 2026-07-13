/** Computes current and longest streaks (in days) from a set of distinct study dates. */
export function computeStreaks(
  isoDates: string[],
  todayIso: string,
): { currentStreak: number; longestStreak: number } {
  const days = new Set(isoDates);
  if (days.size === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const sorted = Array.from(days).sort();
  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]! + "T00:00:00Z");
    const curr = new Date(sorted[i]! + "T00:00:00Z");
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
    );
    run = diffDays === 1 ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
  }

  // Current streak: walk backwards from today (or yesterday, so a day not
  // yet studied doesn't zero out an active streak) while consecutive days exist.
  let currentStreak = 0;
  const cursor = new Date(todayIso + "T00:00:00Z");
  if (!days.has(todayIso)) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  while (days.has(cursor.toISOString().slice(0, 10))) {
    currentStreak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return { currentStreak, longestStreak };
}
