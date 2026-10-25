/**
 * F11b / D27: absorb S5 fleet-missing into S6 mid-trip strip when the strip
 * already exposes «Reasignar flota».
 */

import type { MidTripAdjustLink } from "./listMidTripAdjustLinks";

/**
 * Returns true when the in_progress `operation-missing` alert card must not
 * mount because the mid-trip strip includes the reassign_fleet chip.
 */
export function shouldSuppressInProgressFleetMissingAlert(
  midTripAdjustLinks: readonly Pick<MidTripAdjustLink, "id">[],
): boolean {
  return midTripAdjustLinks.some((link) => link.id === "reassign_fleet");
}
