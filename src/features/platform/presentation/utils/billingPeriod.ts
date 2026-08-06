/**
 * Billing period helpers (America/Mexico_City calendar) — mirror of API
 * saas-billing/application/billing-period.ts for platform UI defaults.
 */

const MEXICO_TIME_ZONE = "America/Mexico_City";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** Current CDMX calendar month as `YYYY-MM`. */
export function getMexicoCityPeriodKey(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: MEXICO_TIME_ZONE,
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);

  const year = Number(parts.find((p) => p.type === "year")!.value);
  const month = Number(parts.find((p) => p.type === "month")!.value);
  return `${year}-${pad2(month)}`;
}

/**
 * Instant at local CDMX start of the calendar month containing `now`
 * (UTC 06:00 on day 1 — same convention as API).
 */
function mexicoCityMonthStartUtc(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: MEXICO_TIME_ZONE,
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year")!.value);
  const month = Number(parts.find((p) => p.type === "month")!.value);
  return new Date(Date.UTC(year, month - 1, 1, 6, 0, 0, 0));
}

/** Last closed CDMX calendar month (`YYYY-MM`). */
export function getLastClosedMexicoCityPeriodKey(now: Date = new Date()): string {
  const start = mexicoCityMonthStartUtc(now);
  return getMexicoCityPeriodKey(new Date(start.getTime() - 1));
}

/** True when periodKey is strictly before the current CDMX calendar month. */
export function isClosedBillingPeriodKey(
  periodKey: string,
  now: Date = new Date(),
): boolean {
  return periodKey < getMexicoCityPeriodKey(now);
}

const PERIOD_KEY_RE = /^\d{4}-\d{2}$/;

export function isValidBillingPeriodKey(periodKey: string): boolean {
  if (!PERIOD_KEY_RE.test(periodKey)) return false;
  const month = Number(periodKey.slice(5));
  return month >= 1 && month <= 12;
}
