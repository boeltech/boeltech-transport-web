import { describe, expect, it } from "vitest";
import type { SettlementItem } from "../../domain/entities";
import { missingDataGapsFromItems } from "./missingDataGapsFromItems";

function tripItem(
  overrides: Partial<SettlementItem> & {
    calculationDetails?: SettlementItem["calculationDetails"];
  },
): SettlementItem {
  return {
    id: "item-1",
    settlementId: "set-1",
    itemType: "trip_commission",
    tripId: "trip-1",
    tripCode: "TRP-1",
    tripExpenseId: null,
    advanceId: null,
    description: "Comisión",
    quantity: 1,
    unitRate: 0,
    amount: 0,
    isDeduction: false,
    createdAt: "2026-10-01T00:00:00Z",
    ...overrides,
  };
}

describe("missingDataGapsFromItems", () => {
  it("devuelve vacío sin partidas o sin gaps", () => {
    expect(missingDataGapsFromItems(undefined)).toEqual([]);
    expect(missingDataGapsFromItems([])).toEqual([]);
    expect(
      missingDataGapsFromItems([
        tripItem({
          calculationDetails: {
            minimumGuaranteedApplied: false,
            calculationGap: null,
          },
        }),
      ]),
    ).toEqual([]);
  });

  it("incluye zero_km y zero_freight post-mínimo", () => {
    const gaps = missingDataGapsFromItems([
      tripItem({
        tripId: "t-km",
        tripCode: "TRP-KM",
        calculationDetails: {
          minimumGuaranteedApplied: true,
          calculationGap: "zero_km",
        },
      }),
      tripItem({
        id: "item-2",
        tripId: "t-flete",
        tripCode: "TRP-FLETE",
        calculationDetails: {
          minimumGuaranteedApplied: false,
          calculationGap: "zero_freight",
        },
      }),
    ]);
    expect(gaps).toEqual([
      { tripId: "t-km", tripCode: "TRP-KM", gap: "zero_km" },
      { tripId: "t-flete", tripCode: "TRP-FLETE", gap: "zero_freight" },
    ]);
  });

  it("ignora legacy sin minimumGuaranteedApplied y no-comisiones", () => {
    expect(
      missingDataGapsFromItems([
        tripItem({
          calculationDetails: { calculationGap: "zero_km", zeroReason: "zero_km" },
        }),
        tripItem({
          id: "bonus",
          itemType: "bonus",
          calculationDetails: {
            minimumGuaranteedApplied: true,
            calculationGap: "zero_km",
          },
        }),
      ]),
    ).toEqual([]);
  });
});
