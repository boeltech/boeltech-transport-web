import { describe, expect, it } from "vitest";
import { platformCopy } from "./platformCopy";

describe("platformCopy.ar views counts", () => {
  it("builds chip label and a11y name with the total", () => {
    const { pending, overdue, all, chipWithCount, chipAria } =
      platformCopy.ar.views;

    expect(chipWithCount(pending, 4)).toBe("Pendientes 4");
    expect(chipWithCount(overdue, 1)).toBe("Atrasados 1");
    expect(chipWithCount(all, 9)).toBe("Todos 9");
    expect(chipAria(pending, 4)).toBe("Pendientes, 4");
    expect(chipAria(overdue, 1)).toBe("Atrasados, 1");
  });

  it("replaces export→emitir hint and keeps CSV as CFDI fuera", () => {
    expect(platformCopy.ar.closeHint).not.toMatch(/Nuevo cobro/i);
    expect(platformCopy.ar.closeHint).toMatch(/CFDI fuera/i);
    expect(platformCopy.ar.card.closeExportDescription).not.toMatch(
      /para emitir/i,
    );
    expect(platformCopy.ar.card.closeExportDescription).toMatch(/CFDI fuera/i);
  });

  it("keeps CSV/CFDI out of close-run body and page RO copy", () => {
    const { closeRun, description, readOnlyAlert, origin } = platformCopy.ar;
    expect(closeRun.notYetDescription).not.toMatch(/CSV|CFDI/i);
    expect(closeRun.zeroDescription).not.toMatch(/CSV|CFDI/i);
    expect(closeRun.actionableDescription).not.toMatch(/CSV|CFDI/i);
    expect(closeRun.actionableOnExceptions).not.toMatch(/CSV|CFDI/i);
    expect(closeRun.csvCaption).toMatch(/CFDI fuera/i);
    expect(description).not.toMatch(/registra el pago/i);
    expect(readOnlyAlert).not.toMatch(/registra el pago/i);
    expect(origin.auto).toBe("Auto-emitido");
  });

  it("keeps charge-run copy free of CFDI/flete and points to Pendientes", () => {
    const { chargeRun, chargeChip } = platformCopy.ar;
    expect(chargeRun.notYetDescription).not.toMatch(/CSV|CFDI|flete/i);
    expect(chargeRun.attentionDescription).not.toMatch(/CSV|CFDI|flete/i);
    expect(chargeRun.attentionOnPending).not.toMatch(/CSV|CFDI|flete/i);
    expect(chargeRun.viewPending).toMatch(/pendientes/i);
    expect(chargeRun.countsLine({
      charged: 8,
      noPaymentMethod: 2,
      failed: 1,
      requiresAction: 1,
      processing: 0,
    })).toBe("8 cobrados · 2 sin tarjeta · 1 falló · 1 por confirmar");
    expect(chargeChip.charged).toBe("Cobrado");
    expect(chargeChip.noPaymentMethod).toBe("Sin tarjeta");
    expect(chargeChip.failed).toBe("Falló");
    expect(chargeChip.requiresAction).toBe("Confirmar tarjeta");
    expect(chargeChip.processing).toBe("Procesando");
  });

  it("does not expose Emitir N elegibles copy", () => {
    expect(JSON.stringify(platformCopy.ar)).not.toMatch(/Emitir N elegibles/i);
  });

  it("names a Q=0 cut as no billable fleet, not an unready cut", () => {
    expect(platformCopy.ar.skipReasons.CUT_NO_FLEET).toBe(
      "Sin flota cobrable en ese mes",
    );
    expect(platformCopy.ar.skipReasons.CUT_NO_FLEET).not.toMatch(
      /listo para emitir/i,
    );
  });

  it("labels the period filter without a fake selected month", () => {
    expect(platformCopy.ar.filters.periodKey).toBe("Mes de cobro");
    expect(platformCopy.ar.filters.periodKeyPlaceholder).toBe("Elegir mes");
    expect(platformCopy.ar.filters.periodKeyPlaceholder).not.toMatch(
      /^\d{4}-\d{2}$/,
    );
  });

  it("scopes the tenant card as subscription cargos, not freight CFDI", () => {
    const { card } = platformCopy.ar;
    expect(card.description).toBe("Cargos de esta empresa · últimos 12 meses.");
    expect(card.viewAll).toBe("Ver todos en Cobros");
    expect(card.paidCaption).toBe("Cobrado");
    expect(card.description).not.toMatch(/CFDI|flete/i);
    expect(card.viewAll).not.toMatch(/CFDI|flete/i);
  });

  it("labels the payment rail without last4 or CFDI/flete", () => {
    expect(platformCopy.ar.columns.method).toBe("Método");
    expect(platformCopy.ar.markPaid.methods.manual).toBe("Manual");
    expect(platformCopy.ar.markPaid.methods.spei).toBe("Transferencia");
    expect(platformCopy.ar.markPaid.methods.card_external).toBe("Tarjeta");
    expect(platformCopy.ar.markPaid.methods.other).toBe("Otro");
    expect(platformCopy.ar.markPaid.methods.stripe).toBe("Tarjeta");
    expect(platformCopy.ar.columns.method).not.toMatch(/CFDI|flete/i);
    expect(platformCopy.ar.markPaid.methods.stripe).not.toMatch(/last4|4242/i);
  });
});
