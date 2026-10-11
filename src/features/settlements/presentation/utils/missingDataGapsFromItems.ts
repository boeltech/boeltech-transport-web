import type { SettlementItem } from "../../domain/entities";

/** Viaje con gap post-mínimo que exige confirmación al enviar (espejo API H-2). */
export interface MissingDataGapTrip {
  readonly tripId: string | null;
  readonly tripCode: string;
  readonly gap: "zero_km" | "zero_freight";
}

/**
 * Partidas `trip_commission` post-mínimo (`minimumGuaranteedApplied` presente)
 * con `calculationGap` km/flete. Legacy sin la clave no pide ack (paridad API).
 */
export function missingDataGapsFromItems(
  items: readonly SettlementItem[] | null | undefined,
): MissingDataGapTrip[] {
  if (!items?.length) return [];

  const gaps: MissingDataGapTrip[] = [];
  for (const item of items) {
    if (item.itemType !== "trip_commission") continue;
    const details = item.calculationDetails;
    if (!details || !("minimumGuaranteedApplied" in details)) continue;
    const gap = details.calculationGap;
    if (gap !== "zero_km" && gap !== "zero_freight") continue;
    gaps.push({
      tripId: item.tripId,
      tripCode: item.tripCode?.trim() || item.description,
      gap,
    });
  }
  return gaps;
}
