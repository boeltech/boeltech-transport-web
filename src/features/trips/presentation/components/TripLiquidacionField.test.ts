import { describe, expect, it } from "vitest";
import { deriveLiquidacionFromProfile } from "./TripLiquidacionField";
import { defaultLiquidacionForClientProfile } from "./TripLiquidacionChip";

describe("ADR-0096 liquidación helpers", () => {
  it("comercial_only → sin_cfdi_efectivo", () => {
    expect(deriveLiquidacionFromProfile("comercial_only")).toBe(
      "sin_cfdi_efectivo",
    );
    expect(defaultLiquidacionForClientProfile("comercial_only")).toBe(
      "sin_cfdi_efectivo",
    );
  });

  it("receptor_cfdi → emitir_cfdi", () => {
    expect(deriveLiquidacionFromProfile("receptor_cfdi")).toBe("emitir_cfdi");
    expect(defaultLiquidacionForClientProfile("receptor_cfdi")).toBe(
      "emitir_cfdi",
    );
  });
});
