import { formatDateTime } from "@shared/utils/dateUtils";

import type { TrackingPrimaryActionKind } from "./trackingNextAction";
import { trackingCopy } from "../../copy";

function formatShortTime(value: Date): string {
  return formatDateTime(value.toISOString());
}

export type TrackingHeaderSituation = "on_site" | "in_transit";

/** Primary kinds where the unit is already at the stop (not en route to it). */
export const TRACKING_ON_SITE_PRIMARY_KINDS: ReadonlySet<TrackingPrimaryActionKind> =
  new Set(["cargo_blocked", "depart", "depart_origin", "close"]);

/**
 * Frase canónica de Z1 (F7): situacional.
 * - En sitio/espera: «En sitio · {parada} · En espera» (sin «Siguiente:»).
 * - En tránsito: «Siguiente: … · Llega ~…» (o sin ETA).
 */
export function buildTrackingHeaderContextPhrase(input: {
  situation?: TrackingHeaderSituation;
  /** Parada actual (on_site) o siguiente hito (in_transit). */
  stopLabel?: string | null;
  /**
   * Alias de `stopLabel` (ProgressStrip / callers F5).
   * Preferir `stopLabel` en código nuevo.
   */
  nextStopLabel?: string | null;
  estimatedArrival?: Date | null;
  /** Si true en on_site, añade «En espera». Default true cuando situation=on_site. */
  waitingPhase?: boolean;
}): string {
  const label = (input.stopLabel ?? input.nextStopLabel)?.trim() || null;
  const situation: TrackingHeaderSituation =
    input.situation ??
    (input.waitingPhase === true ? "on_site" : "in_transit");

  if (situation === "on_site" && label) {
    const parts = [trackingCopy.label.onSite, label];
    const includeWaiting = input.waitingPhase !== false;
    if (includeWaiting) {
      parts.push(trackingCopy.label.waitingPhase);
    }
    return parts.join(" · ");
  }

  const parts: string[] = [];
  if (label) {
    parts.push(trackingCopy.label.nextStop(label));
  }
  if (input.estimatedArrival != null) {
    parts.push(
      trackingCopy.label.arrivesAt(formatShortTime(input.estimatedArrival)),
    );
  } else {
    parts.push(trackingCopy.state.noEta);
  }
  return parts.join(" · ");
}
