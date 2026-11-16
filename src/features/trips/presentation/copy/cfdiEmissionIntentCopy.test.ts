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

  it("Q11: cashFreeze apunta a tab Cobro / Ver cobro (no Costos ni lote)", () => {
    const g = cfdiEmissionIntentCopy.governance;
    expect(g.cashFreeze).toMatch(/cobros activos/i);
    expect(g.cashFreeze).toMatch(/Ver cobro/);
    expect(g.cashFreezeHint).toMatch(/tab Cobro/);
    expect(g.cashFreezeHint).toMatch(/Ver cobro|Anular/);
    expect(g.cashFreezeHint).not.toMatch(/Costos/);
    expect(g.cashFreezeHint).not.toMatch(/Historial de abonos/);
    const freezeBlob = `${g.cashFreeze}\n${g.cashFreezeHint}`;
    expect(freezeBlob).not.toMatch(/congelado/i);
    expect(freezeBlob).not.toMatch(/\befectivo\b/i);
    expect(freezeBlob).not.toMatch(/Cobro en efectivo/i);
  });

  it("Q11: sheet y CTA usan Registrar cobro / Forma de pago", () => {
    const cash = cfdiEmissionIntentCopy.cash;
    expect(cash.ctaRegister).toBe("Registrar cobro");
    expect(cash.sheet.title).toBe("Registrar cobro");
    expect(cash.sheet.submit).toBe("Registrar cobro");
    expect(cash.sheet.paymentInstrument).toBe("Forma de pago");
    expect(cash.historyTitle).toBe("Cobros de este viaje");
    expect(cash.viewBatchCta).toBe("Ver cobro");
  });

  it("Sheet Historial: título sentence-case; description ≠ empties", () => {
    const g = cfdiEmissionIntentCopy.governance;
    expect(g.historyTitle).toBe("Historial de factura del viaje");
    expect(g.historyTitle).not.toMatch(/CFDI/i);
    expect(g.historyDescription).toMatch(/Sin factura/);
    expect(g.historyDescription).not.toBe(g.historyEmpty);
    expect(g.historyDescription).not.toBe(g.historyEmptyByProfile);
    expect(g.historyEmpty).toBe(
      "Aún no hay una solicitud de Sin factura en este viaje.",
    );
    expect(g.historyEmptyByProfile).toBe(
      "Este viaje es Sin factura por el perfil del cliente. No hay solicitudes de excepción.",
    );
    expect(g.requesterLabel).toBe("Solicitante");
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
