/**
 * C20 — compone `{km} km × $…` cuando hay distancia + tarifa/km
 * (campo o parse de `applied_rule` `$N/km`).
 */

const RATE_PER_KM_RE = /\$([\d.]+)\/km/i;

export function parseRatePerKmFromAppliedRule(
  appliedRule: string | null | undefined,
): number | null {
  if (!appliedRule) return null;
  const match = appliedRule.match(RATE_PER_KM_RE);
  if (!match?.[1]) return null;
  const rate = Number(match[1]);
  return Number.isFinite(rate) ? rate : null;
}

export function formatKmTimesRateRule(args: {
  distanceKm: number | null | undefined;
  ratePerKm: number | null | undefined;
  appliedRule: string | null | undefined;
  formatRate: (rate: number) => string;
  compose: (km: string, rate: string) => string;
  fallback: string;
}): string {
  const km =
    args.distanceKm != null && Number.isFinite(Number(args.distanceKm))
      ? Number(args.distanceKm)
      : null;
  const rate =
    args.ratePerKm != null && Number.isFinite(Number(args.ratePerKm))
      ? Number(args.ratePerKm)
      : parseRatePerKmFromAppliedRule(args.appliedRule);

  if (km != null && rate != null) {
    return args.compose(
      km.toLocaleString("es-MX"),
      args.formatRate(rate),
    );
  }
  return args.appliedRule?.trim() || args.fallback;
}
