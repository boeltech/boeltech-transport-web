import { describe, expect, it } from "vitest";

import { shellCopy } from "./shellCopy";

function flattenCopy(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "function") {
    try {
      return String((value as (arg: never) => unknown)("x" as never));
    } catch {
      return "";
    }
  }
  if (value && typeof value === "object") {
    return Object.values(value).map(flattenCopy).join("\n");
  }
  return "";
}

describe("shellCopy — léxico operativo (Capa 1 D8)", () => {
  const visible = flattenCopy({
    alert: shellCopy.alert,
    action: shellCopy.action,
    tab: shellCopy.tab,
    readiness: {
      title: shellCopy.readiness.title,
      titleScheduled: shellCopy.readiness.titleScheduled,
      scheduleGroup: shellCopy.readiness.scheduleGroup,
      operateGroup: shellCopy.readiness.operateGroup,
    },
  });

  it("no usa CFDI, UUID, SAT ni timbrar en superficie", () => {
    expect(visible).not.toMatch(/\bCFDI\b/);
    expect(visible).not.toMatch(/\bUUID\b/i);
    expect(visible).not.toMatch(/\bSAT\b/);
    expect(visible).not.toMatch(/timbrar/i);
    expect(visible).not.toMatch(/Carta Porte/i);
  });

  it("nombra el menú secundario Más", () => {
    expect(shellCopy.action.more).toBe("Más");
  });

  it("orienta atención fiscal al camino Operación → sustituir (T4-041)", () => {
    expect(shellCopy.alert.fiscalAttentionBody).toMatch(/Operación/i);
    expect(shellCopy.alert.fiscalAttentionBody).toMatch(/docs vencidos|reasigna/i);
    expect(shellCopy.alert.fiscalAttentionBody).toMatch(/sustituye/i);
  });

  it("split: multi-porción sin pretender un solo flete (T4-041-split)", () => {
    expect(shellCopy.alert.fiscalAttentionSplitBody).toMatch(/cada porción/i);
    expect(shellCopy.alert.fiscalAttentionSplitBody).toMatch(/sustituye/i);
    expect(shellCopy.alert.fiscalAttentionSplitBody).not.toMatch(
      /sustituye la factura/i,
    );
    expect(shellCopy.alert.fiscalAttentionSplitCta).toMatch(/porción/i);
    expect(shellCopy.alert.fiscalAttentionSplitNoInvoiceBody).toMatch(
      /Facturación/i,
    );
    expect(shellCopy.alert.fiscalAttentionSplitNoInvoiceBody).toMatch(
      /prorrateo/i,
    );
  });

  it("post-cancel: cancelación + factura vigente, sin mid-trip / sustituir / flota", () => {
    expect(shellCopy.alert.postCancelFiscalAttentionTitle).toMatch(
      /tras la cancelación/i,
    );
    expect(shellCopy.alert.postCancelFiscalAttentionBody).toMatch(/Cancelado/i);
    expect(shellCopy.alert.postCancelFiscalAttentionBody).toMatch(
      /cancélala|motivo de operación no realizada/i,
    );
    expect(shellCopy.alert.postCancelFiscalAttentionBody).not.toMatch(/sustitu/i);
    expect(shellCopy.alert.postCancelFiscalAttentionBody).not.toMatch(
      /docs vencidos|no bloquea la operación|flota/i,
    );
    expect(shellCopy.alert.postCancelFiscalAttentionCta).toBe("Abrir factura");
    expect(shellCopy.alert.postCancelFiscalAttentionSplitCta).toMatch(/porción/i);
    expect(shellCopy.alert.postCancelFiscalAttentionSplitBody).not.toMatch(
      /sustitu/i,
    );
    expect(shellCopy.alert.postCancelFiscalAttentionSplitBody).toMatch(
      /1\)|Cancela cada factura/i,
    );
    expect(shellCopy.alert.postCancelFiscalAttentionSplitBody).toMatch(
      /se cierra solo/i,
    );
    expect(shellCopy.alert.postCancelFiscalAttentionSplitBody).not.toMatch(
      /Cerrar reparto/i,
    );
    expect(shellCopy.alert.postCancelFiscalAttentionSplitBody).not.toMatch(
      /pendiente de facturar/i,
    );
    expect(shellCopy.alert.postCancelFiscalAttentionSplitNoInvoiceBody).toMatch(
      /no deben emitirse|se cierra solo/i,
    );
    expect(shellCopy.alert.postCancelFiscalAttentionSplitNoInvoiceBody).not.toMatch(
      /pendiente de facturación/i,
    );
    expect(shellCopy.alert.postCancelFiscalActionLine).toMatch(
      /Cancela la\(s\) factura\(s\) vigente\(s\)/i,
    );
    expect(shellCopy.alert.postCancelFiscalActionLine).not.toMatch(
      /request_cancellation|keep_cfdi/,
    );
  });

  it("usa léxico de incidente registrado (T4-039 / web #29)", () => {
    expect(shellCopy.alert.openIncidentTitle).toBe(
      "Incidente registrado en el viaje",
    );
    expect(shellCopy.alert.openIncidentBody).toBe(
      "Quedó en la bitácora de Seguimiento. La marca se limpia al finalizar o cancelar el viaje.",
    );
    expect(shellCopy.alert.openIncidentCta).toBe("Ir a Seguimiento");
    expect(shellCopy.tab.trackingIncident).toBe("Incidente");
    expect(shellCopy.alert.openIncidentTitle).not.toMatch(/sin cerrar/i);
    expect(shellCopy.alert.openIncidentBody).not.toMatch(/sin cerrar/i);
    expect(shellCopy.alert.openIncidentBody).not.toMatch(/pendiente de atención/i);
    expect(shellCopy.tab.trackingIncident).not.toMatch(/sin cerrar/i);
  });
});
