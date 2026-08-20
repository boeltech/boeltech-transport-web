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

  it("nombra tipo de viaje en léxico operativo", () => {
    expect(operationCopy.format.tripType("ingreso")).toBe("Servicio con factura");
    expect(operationCopy.format.tripType("traslado")).toBe("Solo traslado");
  });

  it("identifica remolque por placa, no por clave SAT", () => {
    expect(operationCopy.format.trailerLine(1, "ABC-12-34")).toBe(
      "ABC-12-34 · 1",
    );
    expect(operationCopy.format.trailerLine(1, "ABC-12-34")).not.toMatch(
      /CTR|SubTipo/i,
    );
  });

  it("no repite stats del header (distancia, duración, tarifa)", () => {
    expect(visible).not.toMatch(/distancia/i);
    expect(visible).not.toMatch(/duraci[oó]n/i);
    expect(visible).not.toMatch(/tarifa/i);
  });
});
