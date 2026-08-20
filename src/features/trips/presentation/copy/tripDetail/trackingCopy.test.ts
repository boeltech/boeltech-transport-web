import { describe, expect, it } from "vitest";

import { trackingCopy } from "./trackingCopy";

describe("trackingCopy — StartTripSheet (Capa 1 lean)", () => {
  it("usa descripción de arranque sin itinerario futuro", () => {
    expect(trackingCopy.sheet.startDescription).toMatch(/En curso/i);
    expect(trackingCopy.sheet.startDescription).not.toMatch(
      /origen|carga|salida de origen|mercanc/i,
    );
    expect(trackingCopy.sheet.startDescription).not.toMatch(/despach|od[oó]metro/i);
  });

  it("usa léxico operativo en labels y toast de inicio", () => {
    expect(trackingCopy.label.startMileage).toBe("Kilometraje al salir");
    expect(trackingCopy.label.occurredAtDeparture).toBe("¿A qué hora salió?");
    expect(trackingCopy.toast.tripStarted).toBe("Viaje iniciado");
    expect(trackingCopy.toast.tripStartedDescription("V-1")).toBe(
      "V-1 está en curso",
    );
    expect(trackingCopy.toast.startMileageRequiredDescription).not.toMatch(
      /od[oó]metro/i,
    );
  });

  it("no expone copy de flota «Recursos asignados» / despachar", () => {
    const sheetJson = JSON.stringify(trackingCopy.sheet);
    expect(sheetJson).not.toMatch(/Recursos asignados/);
    expect(sheetJson).not.toMatch(/despachar/i);
  });
});

describe("trackingCopy — Paradas y cargas (Capa 1 lean)", () => {
  it("usa léxico de cargas (no mercancía/Arribo como primario)", () => {
    expect(trackingCopy.section.cargosAtStop).toBe("Cargas en esta parada");
    expect(trackingCopy.hint.cargoBlockedBody(2)).toMatch(/cargas pendientes/i);
    expect(trackingCopy.hint.cargoBlockedBody(2)).not.toMatch(/mercanc/i);
    expect(trackingCopy.action.goToCargos).toMatch(/cargas/i);
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
    expect(trackingCopy.sheet.departOriginDescription).toMatch(/tránsito/i);
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
    expect(trackingCopy.action.close).toBe("Finalizar viaje");
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
