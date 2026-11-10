import { describe, expect, it } from "vitest";

import { cfdiEmissionIntentCopy } from "./cfdiEmissionIntentCopy";

describe("cfdiEmissionIntentCopy — Factura del viaje (D3′)", () => {
  it("prefijo y pareja sin jerga de la decisión; CFDI solo en el hint", () => {
    expect(cfdiEmissionIntentCopy.field.label).toBe("Factura del viaje");
    expect(cfdiEmissionIntentCopy.field.label).not.toMatch(/CFDI/i);
    expect(cfdiEmissionIntentCopy.field.hint).toMatch(/Carta Porte/);
    expect(cfdiEmissionIntentCopy.field.hint).toMatch(/CFDI/i);
    expect(cfdiEmissionIntentCopy.options.emitir_cfdi).toBe("Con factura");
    expect(cfdiEmissionIntentCopy.options.sin_cfdi_efectivo).toBe("Sin factura");
    expect(cfdiEmissionIntentCopy.options.emitir_cfdi).not.toMatch(/CFDI/i);
    expect(cfdiEmissionIntentCopy.options.sin_cfdi_efectivo).not.toMatch(
      /CFDI/i,
    );
    expect(cfdiEmissionIntentCopy.chip.conCfdi).toBe("Con factura");
    expect(cfdiEmissionIntentCopy.chip.sinCfdi).toBe("Sin factura");
    expect(cfdiEmissionIntentCopy.overrideConfirm.description).toMatch(
      /Carta Porte/,
    );
    expect(cfdiEmissionIntentCopy.overrideConfirm.confirm).toBe(
      "Usar Sin factura",
    );
    expect(cfdiEmissionIntentCopy.blockEmitir.description).toMatch(/RFC y régimen/);
  });
});
