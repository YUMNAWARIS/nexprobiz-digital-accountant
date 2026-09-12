export interface Clock {
  now(): Date;
}
export const systemClock: Clock = { now: () => new Date() };
/** YYYY-MM-DD in UTC — accounting dates are DATE columns (§10). */
export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
export function yearOf(isoDate: string): number {
  return Number(isoDate.slice(0, 4));
}
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toIsoDate(d);
}
