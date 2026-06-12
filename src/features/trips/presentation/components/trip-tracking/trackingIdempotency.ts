export function createTrackingIdempotencyKey(): string {
  return crypto.randomUUID();
}
