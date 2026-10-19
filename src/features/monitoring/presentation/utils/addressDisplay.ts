import type { GpsAddressStatusType } from "../../domain";

/**
 * Dirección geocodificada o fallback UX (PRD D28).
 */
export function addressDisplay(
  address: string | null | undefined,
  addressStatus: GpsAddressStatusType | null | undefined,
  unavailableLabel: string,
): string | null {
  if (address && address.trim()) return address.trim();
  if (addressStatus === "ok") return address?.trim() || null;
  if (addressStatus === "unavailable" || addressStatus === "skipped") {
    return unavailableLabel;
  }
  if (addressStatus == null && address == null) return null;
  return unavailableLabel;
}
