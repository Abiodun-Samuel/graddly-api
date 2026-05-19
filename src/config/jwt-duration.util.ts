const DURATION_UNITS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86_400,
};

/** Parses JWT-style durations (`15m`, `7d`) to seconds. */
export function parseDurationToSeconds(
  duration: string,
  fallbackSeconds = 604_800,
): number {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());
  if (!match) {
    return fallbackSeconds;
  }
  return parseInt(match[1], 10) * (DURATION_UNITS[match[2]] ?? 1);
}
