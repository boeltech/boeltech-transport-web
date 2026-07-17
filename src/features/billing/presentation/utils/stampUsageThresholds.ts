/** Umbrales SoT §4.7 — avisos de consumo de timbres (70 / 80 / 100%). */

export const STAMP_USAGE_WATCH_PERCENT = 70;
export const STAMP_USAGE_WARNING_PERCENT = 80;
export const STAMP_USAGE_EXHAUSTED_PERCENT = 100;

export type StampUsageAlertLevel = "none" | "watch" | "warning" | "exhausted";

export type StampUsageAlertVariant = "info" | "warning" | "destructive";

export function computeStampUsagePercent(
  stampsUsed: number,
  includedStamps: number,
): number {
  if (includedStamps <= 0) return 0;
  return Math.min(
    100,
    Math.round((stampsUsed / includedStamps) * 100),
  );
}

/** Nivel más alto cruzado (un solo aviso, no apilados). */
export function resolveStampUsageAlertLevel(
  usagePercent: number,
): StampUsageAlertLevel {
  if (usagePercent >= STAMP_USAGE_EXHAUSTED_PERCENT) return "exhausted";
  if (usagePercent >= STAMP_USAGE_WARNING_PERCENT) return "warning";
  if (usagePercent >= STAMP_USAGE_WATCH_PERCENT) return "watch";
  return "none";
}

export function getStampUsageAlertVariant(
  level: StampUsageAlertLevel,
): StampUsageAlertVariant | null {
  switch (level) {
    case "watch":
      return "info";
    case "warning":
      return "warning";
    case "exhausted":
      return "destructive";
    default:
      return null;
  }
}
