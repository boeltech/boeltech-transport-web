import { describe, expect, it } from "vitest";

import { cfdiEmissionIntentCopy } from "./cfdiEmissionIntentCopy";

describe("cfdiEmissionIntentCopy — Liquidación Operate-first (D8)", () => {
  it("label primario sin jerga CFDI; CFDI solo en hint", () => {
    expect(cfdiEmissionIntentCopy.field.label).toBe("Liquidación");
    expect(cfdiEmissionIntentCopy.field.label).not.toMatch(/CFDI/i);
    expect(cfdiEmissionIntentCopy.field.hint).toMatch(/CFDI/i);
    expect(cfdiEmissionIntentCopy.options.emitir_cfdi).toBe("Con factura");
    expect(cfdiEmissionIntentCopy.options.sin_cfdi_efectivo).toBe(
      "Efectivo sin factura",
    );
    expect(cfdiEmissionIntentCopy.options.emitir_cfdi).not.toMatch(/CFDI/i);
    expect(cfdiEmissionIntentCopy.options.sin_cfdi_efectivo).not.toMatch(
      /CFDI/i,
    );
    expect(cfdiEmissionIntentCopy.chip.conCfdi).toBe("Con factura");
    expect(cfdiEmissionIntentCopy.chip.sinCfdi).toBe("Efectivo sin factura");
  });
});
