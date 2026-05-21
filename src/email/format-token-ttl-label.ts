/** Human-readable duration for transactional email copy (not calendar dates). */
export function formatTokenTtlLabel(ttlSeconds: number): string {
  if (ttlSeconds >= 3600 && ttlSeconds % 3600 === 0) {
    const hours = ttlSeconds / 3600;
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
  if (ttlSeconds >= 60 && ttlSeconds % 60 === 0) {
    const minutes = ttlSeconds / 60;
    return minutes === 1 ? '1 minute' : `${minutes} minutes`;
  }
  return `${ttlSeconds} seconds`;
}
