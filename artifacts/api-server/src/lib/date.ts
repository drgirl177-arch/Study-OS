/** Returns YYYY-MM-DD for a Date, in UTC. */
export function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Validates a query-string date param (YYYY-MM-DD), returning it unchanged or undefined. */
export function parseDateParam(value: unknown): string | undefined {
  if (typeof value !== "string" || !DATE_RE.test(value)) {
    return undefined;
  }
  return value;
}
