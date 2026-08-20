import { describe, expect, it } from "vitest";

import { routeCopy } from "./routeCopy";

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

describe("routeCopy — léxico operativo (Capa 1 D3)", () => {
  const visible = flattenCopy(routeCopy);

  it("no usa SAT, RFC, remitente, Mapbox ni facturar en superficie", () => {
    expect(visible).not.toMatch(/\bSAT\b/i);
    expect(visible).not.toMatch(/\bRFC\b/);
    expect(visible).not.toMatch(/remitente/i);
    expect(visible).not.toMatch(/destinatario/i);
    expect(visible).not.toMatch(/Mapbox/i);
    expect(visible).not.toMatch(/para facturar/i);
    expect(visible).not.toMatch(/domicilio fiscal/i);
  });

  it("usa sentence case en títulos de itinerario y CTA", () => {
    expect(routeCopy.composer.title).toBe("Elige origen y destino");
    expect(routeCopy.hint.captureHintOrigin).toMatch(/directorio/i);
    expect(routeCopy.hint.captureHintStop).not.toMatch(/sucursal/i);
    expect(routeCopy.section.stops).toBe("Paradas del recorrido");
    expect(routeCopy.action.completeAddress).toBe("Completar domicilio");
    expect(routeCopy.action.editStop).toBe("Editar parada");
    expect(routeCopy.chip.missingAddress).toBe("Sin domicilio");
  });
});
