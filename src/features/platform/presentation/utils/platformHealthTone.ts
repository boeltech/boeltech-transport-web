import {
  PLATFORM_HEALTH_AT_RISK_THRESHOLD,
} from "../../domain/entities";

/** Display-only bands for an API-provided score. Does not recompute health. */
export type PlatformHealthTone = "healthy" | "watch" | "risk" | "unknown";

const HEALTHY_MIN = 70;

export function resolvePlatformHealthTone(
  score: number | null | undefined,
): PlatformHealthTone {
  if (score == null) return "unknown";
  if (score < PLATFORM_HEALTH_AT_RISK_THRESHOLD) return "risk";
  if (score < HEALTHY_MIN) return "watch";
  return "healthy";
}

export function healthToneDotClass(tone: PlatformHealthTone): string {
  switch (tone) {
    case "healthy":
      return "bg-success";
    case "watch":
      return "bg-warning";
    case "risk":
      return "bg-destructive";
    default:
      return "bg-muted-foreground/40";
  }
}
