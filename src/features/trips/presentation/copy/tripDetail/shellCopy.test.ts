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

  it("CTA header scheduled navega a Seguimiento; no afirma mutación start (D3)", () => {
    expect(shellCopy.action.startTrip).toBe("Ir a Seguimiento");
    expect(shellCopy.action.startTrip).toBe(shellCopy.action.goToTracking);
    expect(shellCopy.action.startTrip).not.toMatch(/iniciar viaje/i);
  });

  it("next-step F2: copy Operate sin mutación falsa de start", () => {
    expect(shellCopy.nextStep.title).toBe("Siguiente paso");
    expect(shellCopy.nextStep.completeRouteCargo).toMatch(/ruta y cargas/i);
    expect(shellCopy.nextStep.confirmReserve).toBe("Confirmar reserva");
    expect(shellCopy.nextStep.goToTracking).toBe("Ir a Seguimiento");
    expect(shellCopy.nextStep.invoice).toBe("Facturar");
    expect(shellCopy.nextStep.descriptionScheduled).toMatch(/Programado/i);
    expect(shellCopy.nextStep.goToTracking).not.toMatch(/iniciar viaje/i);
  });

  it("mid-trip strip F4: tres deep-links Operate sin tab nuevo", () => {
    expect(shellCopy.midTripStrip.title).toMatch(/ajustes/i);
    expect(shellCopy.midTripStrip.pendingStops).toMatch(/paradas pendientes/i);
    expect(shellCopy.midTripStrip.pendingStopsCount(1)).toBe("1 parada pendiente");
    expect(shellCopy.midTripStrip.pendingStopsCount(3)).toBe(
      "3 paradas pendientes",
    );
    expect(shellCopy.midTripStrip.addCargo).toMatch(/carga/i);
    expect(shellCopy.midTripStrip.reassignFleet).toMatch(/reasignar/i);
    expect(flattenCopy(shellCopy.midTripStrip)).not.toMatch(/\bCFDI\b/);
  });

  it("accountant: abrir factura y pide gerente, sin CTA Sustituir", () => {
    expect(shellCopy.alert.fiscalAttentionOpenInvoiceCta).toBe("Abrir factura");
    expect(shellCopy.alert.fiscalAttentionAskManagerBody).toMatch(/gerente/i);
    expect(shellCopy.alert.fiscalAttentionAskManagerBody).not.toMatch(
      /Sustituir factura/i,
    );
    expect(shellCopy.alert.fiscalAttentionEscalateBody).toMatch(
      /Avisa a facturación/i,
    );
  });

  it("manager mid-trip: trámite en la factura, sin Operación como paso 1", () => {
    expect(shellCopy.alert.fiscalAttentionManagerBody).toMatch(/sustituye/i);
    expect(shellCopy.alert.fiscalAttentionManagerBody).not.toMatch(/Operación/i);
    expect(shellCopy.alert.fiscalAttentionCta).toBe("Sustituir factura");
    expect(shellCopy.alert.fiscalAttentionSplitManagerBody).toMatch(
      /cada porción/i,
    );
    expect(shellCopy.alert.fiscalAttentionSplitManagerBody).not.toMatch(
      /Operación/i,
    );
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
      "Quedó en la bitácora de Seguimiento. Ciérralo con una nota desde Seguimiento, o la marca se limpia al finalizar o cancelar el viaje.",
    );
    expect(shellCopy.alert.openIncidentBody).not.toMatch(/resuelto|borrar/i);
    expect(shellCopy.alert.openIncidentCta).toBe("Ir a Seguimiento");
    expect(shellCopy.tab.trackingIncident).toBe("Incidente");
    expect(shellCopy.tab.trackingIncidentAria).toBe("Con incidente abierto");
    expect(shellCopy.alert.openIncidentTitle).not.toMatch(/sin cerrar/i);
    expect(shellCopy.alert.openIncidentBody).not.toMatch(/sin cerrar/i);
    expect(shellCopy.alert.openIncidentBody).not.toMatch(/pendiente de atención/i);
    expect(shellCopy.tab.trackingIncident).not.toMatch(/sin cerrar/i);
  });

  it("cliente 403: no es tuyo o pide vínculo; back a Mis envíos (D9)", () => {
    expect(shellCopy.state.accessDeniedDescriptionClient).toMatch(
      /no es tuyo|vinculado/i,
    );
    expect(shellCopy.state.accessDeniedDescriptionClient).toMatch(
      /administración/i,
    );
    expect(shellCopy.state.backToListClient).toBe("Volver a Mis envíos");
    expect(shellCopy.state.backToInvoice).toBe("Volver a la factura");
    expect(shellCopy.state.backToInvoices).toBe("Volver a facturas");
    expect(shellCopy.state.accessDeniedDescriptionClient).not.toBe(
      shellCopy.state.accessDeniedDescriptionDriver,
    );
  });

  it("conductor 403: no es tuyo o pide vínculo; back a Mis viajes (D9)", () => {
    expect(shellCopy.state.accessDeniedDescriptionDriver).toMatch(
      /no es tuyo|vinculado/i,
    );
    expect(shellCopy.state.accessDeniedDescriptionDriver).toMatch(
      /administración/i,
    );
    expect(shellCopy.state.backToListDriver).toBe("Volver a Mis viajes");
    expect(shellCopy.state.accessDeniedDescription).not.toBe(
      shellCopy.state.accessDeniedDescriptionDriver,
    );
  });
});
