/**
 * Capa 1 → 3 — copy split_share en /invoices/new (ADR-0081).
 */
import { describe, expect, it } from "vitest";
import { invoicingCopy } from "./invoicingCopy";

const userFacingStrings = [
  invoicingCopy.create.titleSplitShare,
  invoicingCopy.create.blockedSubtitleSplitShare,
  invoicingCopy.create.submitHint,
  invoicingCopy.blocked.titleSplitShare,
  invoicingCopy.blocked.bodySplitShare,
  invoicingCopy.scopeBanner.primary.notThis,
  invoicingCopy.scopeBanner.accessory.notThis,
  invoicingCopy.scopeBanner.falseTrip.notThis,
  invoicingCopy.scopeBanner.splitShare.title,
  invoicingCopy.scopeBanner.splitShare.body,
  invoicingCopy.scopeBanner.splitShare.notThis,
  invoicingCopy.splitShare.missingLegIdTitle,
  invoicingCopy.splitShare.missingLegIdBody,
  invoicingCopy.splitShare.alreadyInvoicedTitle,
  invoicingCopy.splitShare.alreadyInvoicedBody,
  invoicingCopy.splitShare.attachCartaPorteHint,
  invoicingCopy.splitShare.attachCartaPorteDisabledHint,
  invoicingCopy.createContext.splitSharePercent(60),
  invoicingCopy.createContext.splitShareProgress(1, 2),
  invoicingCopy.createContext.receiverHeading,
  invoicingCopy.comprobante.title,
  invoicingCopy.comprobante.edit,
] as const;

describe("invoicingCopy split_share product handoff", () => {
  it("no usa pierna ni multi-RFC en strings visibles", () => {
    for (const line of userFacingStrings) {
      expect(line.toLowerCase()).not.toMatch(/pierna/);
      expect(line.toLowerCase()).not.toMatch(/multi-rfc/);
    }
  });

  it("copy operativo del alta sin timbrar ni borrador en hint principal", () => {
    expect(invoicingCopy.create.submit).toBe("Guardar para revisar");
    expect(invoicingCopy.create.submitHint).not.toMatch(/timbrar/i);
    expect(invoicingCopy.create.submitHint).not.toMatch(/borrador/i);
    expect(invoicingCopy.createContext.receiverHeading).toBe("Cliente a cobrar");
  });

  it("hint CP apunta al reparto como fuente de verdad (opción 2 / #37)", () => {
    expect(invoicingCopy.splitShare.attachCartaPorteHint).toMatch(/reparto del flete/i);
    expect(invoicingCopy.splitShare.attachCartaPorteHint).toMatch(/edita el reparto/i);
  });
});
