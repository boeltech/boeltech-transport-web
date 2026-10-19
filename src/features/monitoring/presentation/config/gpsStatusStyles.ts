import type { GpsPositionStatusType } from "../../domain";

/**
 * Semáforo map-first. Fill/ring usan tokens semánticos del DS (success/warning/muted)
 * para pasar lint de tokens; hex sigue siendo la paleta de marcadores Mapbox/SVG.
 */
export const GPS_STATUS_COLOR: Record<
  GpsPositionStatusType,
  { fill: string; ring: string; labelClass: string; hex: string }
> = {
  online: {
    fill: "bg-success",
    ring: "ring-success/40",
    labelClass: "text-success",
    hex: "10b981",
  },
  stale: {
    fill: "bg-warning",
    ring: "ring-warning/40",
    labelClass: "text-warning",
    hex: "f59e0b",
  },
  offline: {
    fill: "bg-zinc-400",
    ring: "ring-zinc-400/30",
    labelClass: "text-muted-foreground",
    hex: "a1a1aa",
  },
};
