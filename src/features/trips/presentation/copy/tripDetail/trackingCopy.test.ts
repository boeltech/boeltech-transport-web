import { describe, expect, it } from "vitest";

import { trackingCopy } from "./trackingCopy";

describe("trackingCopy — portal cliente (D11)", () => {
  it("narra estado del envío sin Iniciar/Registrar/Completar/falso", () => {
    expect(trackingCopy.section.statusClient).toBe("Estado del envío");
    expect(trackingCopy.hint.clientScheduledBody).toMatch(/aún no sale/i);
    expect(trackingCopy.hint.clientInProgressBody).toMatch(/en camino/i);
    const hub = [
      trackingCopy.hint.clientScheduledTitle,
      trackingCopy.hint.clientScheduledBody,
      trackingCopy.hint.clientInProgressTitle,
      trackingCopy.hint.clientInProgressBody,
      trackingCopy.hint.clientCompletedTitle,
      trackingCopy.hint.clientCompletedBody,
    ].join("\n");
    expect(hub).not.toMatch(/Iniciar|Registrar|Completar|falso/i);
  });
});

describe("trackingCopy — Nota/Incidente (PD10)", () => {
  it("preasociación usa copy «Se asociará a {parada}»", () => {
    expect(trackingCopy.sheet.willAssociateToStop("Parada 1 · Origen")).toBe(
      "Se asociará a Parada 1 · Origen",
    );
  });
});

describe("trackingCopy — StartTripSheet (PD6 / CA5)", () => {
  it("separa despacho de salida de origen y ofrece intención de ubicación", () => {
    expect(trackingCopy.sheet.startDescription).toMatch(/despachar/i);
    expect(trackingCopy.sheet.startDescription).toMatch(/salida de origen/i);
    // Evita el status label «En Ruta»; «en ruta» en prosa operativa sí es válido.
    expect(trackingCopy.sheet.startDescription).not.toMatch(/\bEn Ruta\b/);
    expect(trackingCopy.sheet.dispatchIntentAtDock).toMatch(/andén de carga/i);
    expect(trackingCopy.sheet.dispatchIntentEnRoute).toMatch(/va en camino/i);
    expect(trackingCopy.action.dispatchAtDock).toBe("Despachar en origen");
    expect(trackingCopy.action.dispatchEnRoute).toMatch(/va en camino/i);
  });

  it("usa léxico de despacho en labels y toast (≠ salida)", () => {
    expect(trackingCopy.label.startMileage).toBe("Kilometraje al despachar");
    expect(trackingCopy.label.occurredAtDispatch).toBe(
      "¿A qué hora se despacha?",
    );
    expect(trackingCopy.toast.tripStarted).toBe("Viaje despachado");
    expect(trackingCopy.toast.tripDispatchedAtDock).toMatch(/origen/i);
    expect(trackingCopy.toast.tripStartedDescription("V-1")).toBe(
      "V-1 listo para seguimiento",
    );
    expect(trackingCopy.toast.tripStartedDescription("V-1")).not.toMatch(
      /En Ruta/i,
    );
    expect(trackingCopy.toast.startMileageRequiredDescription).not.toMatch(
      /od[oó]metro/i,
    );
  });

  it("incluye hint PD7 y no copy de flota «Recursos asignados»", () => {
    expect(trackingCopy.hint.dispatchOriginAlreadyArrived).toMatch(
      /ya está registrada/i,
    );
    const sheetJson = JSON.stringify(trackingCopy.sheet);
    expect(sheetJson).not.toMatch(/Recursos asignados/);
  });
});

describe("trackingCopy — Paradas y cargas (Capa 1 lean)", () => {
  it("usa léxico de cargas (no mercancía/Arribo como primario)", () => {
    expect(trackingCopy.section.cargosAtStop).toBe("Cargas en esta parada");
    expect(trackingCopy.hint.cargoBlockedBody(2)).toMatch(/cargas pendientes/i);
    expect(trackingCopy.hint.cargoBlockedBody(2)).not.toMatch(/mercanc/i);
    expect(trackingCopy.action.markPickup).toMatch(/recogida/i);
    expect(trackingCopy.action.registerCargosAtStop("Origen")).toMatch(
      /Registrar cargas en Origen/i,
    );
    expect(trackingCopy.action.goToCargos).not.toMatch(/^Ver /i);
  });

  it("conductor: cargo_blocked escala a operación, no «Completa las cargas» (D11)", () => {
    expect(trackingCopy.hint.cargoBlockedTitleDriver("Origen")).toMatch(
      /Operación registra la carga/i,
    );
    expect(trackingCopy.hint.cargoBlockedTitleDriver("Origen")).not.toMatch(
      /Patio|Completa las cargas/i,
    );
    expect(trackingCopy.hint.cargoBlockedBodyDriver).toMatch(/Avísales/i);
    expect(trackingCopy.hint.cargoBlockedBodyDriver).not.toMatch(
      /Patio|Completa las cargas/i,
    );
    expect(trackingCopy.hint.cargoBlockedBeforeDepartureDriver).toMatch(
      /Avísales/i,
    );
    expect(trackingCopy.hint.cargoBlockedBeforeDepartureDriver).not.toMatch(
      /patio/i,
    );
    expect(trackingCopy.hint.startBlockedEscalatePatio).toMatch(/operación/i);
    expect(trackingCopy.hint.startBlockedEscalatePatio).not.toMatch(/patio/i);
    expect(trackingCopy.hint.startBlockedEscalatePatio).not.toMatch(
      /asignar|Confirmar/i,
    );
  });
});

describe("trackingCopy — Registrar llegada/salida (Capa 1 lean)", () => {
  it("usa descripción operativa corta sin repetir el formulario", () => {
    expect(trackingCopy.sheet.arrivalDescription).toMatch(/en curso/i);
    expect(trackingCopy.sheet.arrivalDescription).not.toMatch(
      /fecha y hora en que ocurrió/i,
    );
    expect(trackingCopy.sheet.departureDescription).toMatch(/completada/i);
  });

  it("nombra el CTA del footer como la acción", () => {
    expect(trackingCopy.action.confirmArrival).toBe("Registrar llegada");
    expect(trackingCopy.action.confirmDeparture).toBe("Registrar salida");
  });
});

describe("trackingCopy — Salida de origen (Capa 1 lean)", () => {
  it("describe el resultado operativo sin léxico fiscal", () => {
    expect(trackingCopy.sheet.departOriginDescription).toMatch(/salida del origen/i);
    expect(trackingCopy.sheet.departOriginDescription).not.toMatch(/fiscal/i);
    expect(trackingCopy.sheet.departOriginDescription).not.toMatch(
      /iniciar el tránsito/i,
    );
    expect(trackingCopy.action.departOrigin).toBe("Salida de origen");
  });
});

describe("trackingCopy — Finalizar viaje (Capa 1 lean)", () => {
  it("usa copy de cierre operativo sin odómetro/fiscal", () => {
    expect(trackingCopy.sheet.closeDescription).toMatch(/completado/i);
    expect(trackingCopy.sheet.closeDescription).not.toMatch(
      /fiscal|od[oó]metro|costos|libera/i,
    );
    expect(trackingCopy.label.endMileage).toBe("Kilometraje final");
    expect(trackingCopy.toast.endMileageRequired).not.toMatch(/od[oó]metro/i);
    expect(trackingCopy.action.close).toBe("Finalizar en destino");
    expect(trackingCopy.action.quickClose).toBe(
      "Cerrar sin bitácora completa",
    );
    expect(trackingCopy.action.start).toBe("Despachar…");
    expect(trackingCopy.state.live).toBe("En vivo");
    expect(trackingCopy.section.itinerary).toBe("Paradas");
    expect(trackingCopy.section.timeline).toBe("Historial del viaje");
  });

  it("desglosa km inicial + distancia planificada en el sugerido de cierre", () => {
    expect(
      trackingCopy.sheet.suggestedEndMileageHint({
        startKm: "3,200",
        distanceKm: "1,200",
        endKm: "4,400",
      }),
    ).toBe(
      "Sugerido: 3,200 km (inicial) + 1,200 km (distancia planificada) = 4,400 km (final)",
    );
  });

  it("usa soft-warn de incidente en bitácora sin resolución aparte (T4-039 / F3)", () => {
    expect(trackingCopy.sheet.closeOpenIncidentWarning).toBe(
      "Este viaje tiene un incidente en bitácora. Puedes cerrarlo con una nota en Seguimiento; al finalizar, la marca también se limpia. El incidente permanece en la bitácora.",
    );
    expect(trackingCopy.sheet.closeOpenIncidentWarning).not.toMatch(
      /sin cerrar|atender|resolver|borrar/i,
    );
    expect(trackingCopy.hint.openIncident).toBe(
      "Hay un incidente en bitácora. Ciérralo con una nota o revísalo antes de finalizar el viaje.",
    );
    expect(trackingCopy.hint.openIncident).not.toMatch(/sin cerrar|abierto|resuelto/i);
    expect(trackingCopy.hint.openIncidentTitle).toBe("Incidente abierto");
    expect(trackingCopy.hint.openIncidentSummary("Pinchadura")).toBe(
      "Pinchadura",
    );
    expect(trackingCopy.hint.openIncidentSummary(null)).toBe(
      trackingCopy.hint.openIncident,
    );
    expect(trackingCopy.label.onSite).toBe("En sitio");
    expect(trackingCopy.label.trafficLightAria).toBe("Semáforo operativo");
    expect(trackingCopy.action.closeIncident).toBe("Cerrar incidente");
    expect(trackingCopy.sheet.closeIncidentTitle).toBe("Cerrar incidente");
    expect(trackingCopy.sheet.closeIncidentDescription).not.toMatch(
      /resuelto|borrar|elimin/i,
    );
    expect(trackingCopy.hint.incidentClosedChip).toBe("Cerrado");
  });
});

describe("trackingCopy — Declarar viaje en falso (ADR-0079)", () => {
  it("describe cobro operativo sin CFDI ni Carta Porte", () => {
    expect(trackingCopy.sheet.declareFalseTripDescription).toMatch(/facturar/i);
    expect(trackingCopy.sheet.declareFalseTripEffectInvoice).toMatch(/facturar/i);
    expect(trackingCopy.sheet.declareFalseTripEffectInvoice).not.toMatch(
      /CFDI|Carta Porte|timbrar|SAT/i,
    );
    expect(trackingCopy.action.declareFalseTrip).toBe("Declarar viaje en falso");
  });

  it("conductor: declara sin facturar ni Costos (D12)", () => {
    expect(trackingCopy.sheet.declareFalseTripDescriptionDriver).not.toMatch(
      /facturar|Dinero del viaje|\bCostos\b|\?tab=costs/i,
    );
    expect(trackingCopy.toast.falseTripDeclaredDescriptionDriver("V-1")).toBe(
      "V-1 quedó completado.",
    );
    expect(trackingCopy.toast.falseTripDeclaredDescriptionDriver("V-1")).not.toMatch(
      /facturar/i,
    );
  });

  it("nudge de gastos invita a capturar ahora sin afirmar bloqueo post-cierre", () => {
    expect(trackingCopy.sheet.declareFalseTripExpensesTitle).toBe(
      "Conviene capturar los gastos ahora",
    );
    expect(trackingCopy.sheet.declareFalseTripExpensesBody).toMatch(
      /aún puedes registrarlos/i,
    );
    expect(trackingCopy.sheet.declareFalseTripExpensesBody).not.toMatch(
      /en terminal ya no|ya no se editan|no se pueden/i,
    );
    expect(trackingCopy.sheet.declareFalseTripExpensesCta).toBe(
      "Ir a Costos",
    );
  });

  it("soft guard de km intenta pago por liquidación sin hard-block", () => {
    expect(trackingCopy.sheet.declareFalseTripMileagePaymentHint).toMatch(
      /pago por km|liquidación/i,
    );
    expect(trackingCopy.sheet.declareFalseTripMileagePaymentHintDriver).not.toMatch(
      /liquidación|pago al operador/i,
    );
    expect(trackingCopy.sheet.declareFalseTripZeroKmTitle).toBe(
      "Kilometraje sin recorrido",
    );
    expect(trackingCopy.sheet.declareFalseTripZeroKmBody).toMatch(/\$0/);
    expect(trackingCopy.sheet.declareFalseTripZeroKmBody).toMatch(/mínimo garantizado/);
    expect(trackingCopy.sheet.declareFalseTripZeroKmBodyDriver).not.toMatch(
      /\$0|liquidación/i,
    );
  });

  it("aviso de 0 km al cerrar: oficina nombra el mínimo, conductor no habla de pago", () => {
    expect(trackingCopy.sheet.closeZeroKmTitle).toBe("Kilometraje sin recorrido");
    expect(trackingCopy.sheet.closeZeroKmBody).toMatch(/mínimo garantizado/);
    expect(trackingCopy.sheet.closeZeroKmTitleDriver).toBe("Mismo kilometraje de salida");
    expect(trackingCopy.sheet.closeZeroKmBodyDriver).not.toMatch(
      /\$0|liquidación|mínimo/i,
    );
  });
});

function flattenCopy(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "function") {
    try {
      return String((value as (arg: never) => unknown)(2 as never));
    } catch {
      return "";
    }
  }
  if (value && typeof value === "object") {
    return Object.values(value).map(flattenCopy).join("\n");
  }
  return "";
}

describe("trackingCopy — léxico operativo (Capa 1 D8)", () => {
  const visible = flattenCopy(trackingCopy);

  it("no usa SAT, RFC, CFDI, UUID, Carta Porte ni timbrar en superficie", () => {
    expect(visible).not.toMatch(/\bSAT\b/);
    expect(visible).not.toMatch(/\bRFC\b/);
    expect(visible).not.toMatch(/\bCFDI\b/);
    expect(visible).not.toMatch(/\bUUID\b/i);
    expect(visible).not.toMatch(/Carta Porte/i);
    expect(visible).not.toMatch(/timbrar/i);
    expect(visible).not.toMatch(/SubTipoRem/i);
  });

  it("nombra la carga operativa sin mercancía/Arribo", () => {
    expect(trackingCopy.label.hazardous).toBe("Peligroso");
    expect(trackingCopy.hint.stopRoleOrigin).not.toMatch(/arribo/i);
    expect(trackingCopy.format.cargoFacts(120, 10)).toBe("120 kg · 10 uds");
  });
});

describe("trackingCopy — semáforo F1-B", () => {
  it("usa etiquetas PRD y no conserva «Va tarde»", () => {
    expect(trackingCopy.label.trafficLight).toEqual({
      on_time: "A tiempo",
      at_risk: "En riesgo",
      delayed: "Retrasado",
      stopped: "Detenido",
      "n/a": "No aplica",
    });
    expect(flattenCopy(trackingCopy)).not.toMatch(/Va tarde/);
  });
});
