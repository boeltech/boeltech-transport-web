import { describe, expect, it } from "vitest";
import { resolveGenericReceiverAdjustment } from "./genericReceiverAdjustment";

describe("resolveGenericReceiverAdjustment", () => {
  it("XAXX con 626 / G03: devuelve 616 / S01 y los dos cambios", () => {
    expect(
      resolveGenericReceiverAdjustment({
        receiverRfc: "XAXX010101000",
        receiverTaxRegime: "626",
        cfdiUsage: "G03",
      }),
    ).toEqual({
      kind: "national",
      receiverTaxRegime: "616",
      cfdiUsage: "S01",
      changes: [
        { field: "receiver_tax_regime", from: "626", to: "616" },
        { field: "cfdi_usage", from: "G03", to: "S01" },
      ],
    });
  });

  it("XEXX ya correcto: sin cambios", () => {
    expect(
      resolveGenericReceiverAdjustment({
        receiverRfc: "XEXX010101000",
        receiverTaxRegime: "616",
        cfdiUsage: "S01",
      }),
    ).toEqual({
      kind: "foreign",
      receiverTaxRegime: "616",
      cfdiUsage: "S01",
      changes: [],
    });
  });

  it("vacíos cuentan como cambio", () => {
    expect(
      resolveGenericReceiverAdjustment({
        receiverRfc: "XAXX010101000",
        receiverTaxRegime: null,
        cfdiUsage: undefined,
      })?.changes,
    ).toEqual([
      { field: "receiver_tax_regime", from: "", to: "616" },
      { field: "cfdi_usage", from: "", to: "S01" },
    ]);
  });

  it("RFC normal: null (sin cambio de comportamiento)", () => {
    expect(
      resolveGenericReceiverAdjustment({
        receiverRfc: "CSA010101AB1",
        receiverTaxRegime: "626",
        cfdiUsage: "G03",
      }),
    ).toBeNull();
  });
});
