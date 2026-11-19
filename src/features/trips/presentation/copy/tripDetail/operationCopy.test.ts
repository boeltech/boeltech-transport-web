import { describe, expect, it } from "vitest";

import { operationCopy } from "./operationCopy";

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

describe("operationCopy — léxico operativo (Capa 1 D8 / D11)", () => {
  const visible = flattenCopy(operationCopy);

  it("no usa SAT, RFC, CFDI, UUID, Carta Porte, snapshot ni SubTipoRem", () => {
    expect(visible).not.toMatch(/\bSAT\b/);
    expect(visible).not.toMatch(/\bRFC\b/);
    expect(visible).not.toMatch(/\bCFDI\b/);
    expect(visible).not.toMatch(/\bUUID\b/i);
    expect(visible).not.toMatch(/Carta Porte/i);
    expect(visible).not.toMatch(/timbrar/i);
    expect(visible).not.toMatch(/snapshot/i);
    expect(visible).not.toMatch(/SubTipoRem/i);
  });

  it("no expone ID de cliente ni pide editar el viaje para cambiar flota", () => {
    expect(visible).not.toMatch(/\bID:/);
    expect(visible).not.toMatch(/edita el viaje/i);
    expect(operationCopy.state.clientUnavailable).not.toMatch(/ID:/);
  });

  it("nombra facturación del viaje en léxico operativo (D6 / RP-8)", () => {
    expect(operationCopy.section.client).toBe("Cliente y contrato");
    expect(operationCopy.label.tripType).toBe("Facturación del viaje");
    expect(operationCopy.label.legalName).toBe("Cliente (quien paga)");
    expect(operationCopy.label.routeType).toBe("Clase de ruta");
    expect(operationCopy.format.tripType("ingreso")).toBe("Servicio con factura");
    expect(operationCopy.format.tripType("traslado")).toBe("Solo traslado");
  });

  it("identifica remolque por placa, no por clave SAT (RP-6)", () => {
    expect(operationCopy.format.trailerLine(1, "ABC-12-34")).toBe("ABC-12-34");
    expect(operationCopy.rail.trailerPosition(1)).toBe("Posición 1");
    expect(operationCopy.format.trailerLine(1, "ABC-12-34")).not.toMatch(
      /CTR|SubTipo/i,
    );
  });

  it("no repite distancia del header; km vive en Programación (D6)", () => {
    expect(visible).not.toMatch(/distancia/i);
    expect(operationCopy.scheduleTable.mileageKm).toMatch(/Kilometraje/);
    expect(operationCopy.rail.rate).toBe("Tarifa");
  });

  it("describe flota por estado (Q9b) y no inventa km sin GPS (Q7)", () => {
    expect(operationCopy.fleetAssignment.sheetDescription).toMatch(
      /antes de iniciar/i,
    );
    expect(operationCopy.fleetAssignment.sheetDescriptionInProgress).toMatch(
      /en curso/i,
    );
    expect(operationCopy.fleetAssignment.sheetDescriptionInProgress).not.toMatch(
      /antes de iniciar/i,
    );
    expect(operationCopy.fleetAssignment.vehicleDistanceUnknown).toBe("—");
    expect(visible).not.toMatch(/a \d+ km/i);
  });
});
