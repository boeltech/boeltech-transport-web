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
    expect(cfdiEmissionIntentCopy.overrideConfirm.description).toBe(
      cfdiEmissionIntentCopy.governance.dialogBodySin,
    );
    expect(cfdiEmissionIntentCopy.overrideConfirm.description).not.toMatch(
      /efectivo/i,
    );
    expect(cfdiEmissionIntentCopy.overrideConfirm.confirm).toBe(
      "Usar Sin factura",
    );
    expect(cfdiEmissionIntentCopy.blockEmitir.description).toMatch(/RFC y régimen/);
  });

  it("D10: canal Sin factura sin «Cobro en efectivo» / «Efectivo acumulado»", () => {
    const cash = cfdiEmissionIntentCopy.cash;
    expect(cash.sectionTitle).toBe("Cobro sin factura");
    expect(cash.scorecardAccumulatedLabel).toBe("Cobrado");
    expect(cash.sheet.description).toMatch(/Sin factura/);
    expect(cash.toast.notAllowed).toMatch(/cobros sin factura/i);
    const blob = JSON.stringify(cash);
    expect(blob).not.toMatch(/Cobro en efectivo/);
    expect(blob).not.toMatch(/Efectivo acumulado/);
    expect(blob).not.toMatch(/\bREP\b/);
  });

  it("D7=A: cashFreeze title + hint sin CTA ni «congelado» / efectivo canal", () => {
    const g = cfdiEmissionIntentCopy.governance;
    expect(g.cashFreeze).toBe(
      "No se puede pasar a Con factura mientras haya abonos activos.",
    );
    expect(g.cashFreezeHint).toBe(
      "En Costos, en Cobro sin factura, usa Anular en cada abono activo del Historial de abonos.",
    );
    expect(g.cashFreezeHint).toMatch(/Costos/);
    expect(g.cashFreezeHint).toMatch(/Cobro sin factura/);
    expect(g.cashFreezeHint).toMatch(/Anular/);
    expect(g.cashFreezeHint).toMatch(/Historial de abonos/);
    const freezeBlob = `${g.cashFreeze}\n${g.cashFreezeHint}`;
    expect(freezeBlob).not.toMatch(/congelado/i);
    expect(freezeBlob).not.toMatch(/\befectivo\b/i);
    expect(freezeBlob).not.toMatch(/Cobro en efectivo/i);
  });

  it("dialog bodies: un description por caso; regularize no reusa copy Sin", () => {
    const g = cfdiEmissionIntentCopy.governance;
    expect(g.dialogBodySin).toBe(
      "Este viaje no aparecerá en Por facturar ni llevará Carta Porte. Si el patio necesita Carta Porte, elige Con factura.",
    );
    expect(g.dialogBodyRegularize).toBe(
      "El viaje volverá a Con factura y podrá aparecer en Por facturar. Podrás emitir CFDI y Carta Porte según el acuerdo.",
    );
    expect(g.dialogBodyReject).toBe(
      "La solicitud de Sin factura se rechazará. El viaje seguirá Con factura.",
    );
    expect(g.dialogBodyCancel).toBe(
      "Se cancelará la solicitud de Sin factura. El viaje seguirá Con factura.",
    );
    expect(g.approveBody).toBe(
      "El viaje pasará a Sin factura. No emitirá CFDI ni Carta Porte.",
    );

    expect(g.dialogBodyRegularize).not.toMatch(/no aparecerá en Por facturar/i);
    expect(g.dialogBodyRegularize).not.toMatch(/no llevará Carta Porte/i);
    expect(g.dialogBodyRegularize).toMatch(/Con factura/);
    expect(g.dialogBodyRegularize).toMatch(/Por facturar/);
    expect(g.dialogBodyReject).toMatch(/seguirá Con factura/);
    expect(g.dialogBodyCancel).toMatch(/seguirá Con factura/);

    const dialogBlob = [
      g.dialogBodySin,
      g.dialogBodyRegularize,
      g.dialogBodyReject,
      g.dialogBodyCancel,
      g.approveBody,
      cfdiEmissionIntentCopy.complianceNotice,
    ].join("\n");
    expect(dialogBlob).not.toMatch(/congelado/i);
    expect(dialogBlob).not.toMatch(/\befectivo\b/i);
  });
});
