import { describe, expect, it } from "vitest";

import { progressCopy } from "./progressCopy";

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

describe("progressCopy — léxico operativo (Capa 1 D8)", () => {
  const visible = flattenCopy(progressCopy);

  it("no usa SAT, RFC, CFDI ni Carta Porte en superficie", () => {
    expect(visible).not.toMatch(/\bSAT\b/);
    expect(visible).not.toMatch(/\bRFC\b/);
    expect(visible).not.toMatch(/\bCFDI\b/);
    expect(visible).not.toMatch(/Carta Porte/i);
    expect(visible).not.toMatch(/timbrar/i);
  });

  it("describe avance de paradas sin jerga de tabs", () => {
    expect(progressCopy.hint.percent).not.toMatch(/Ruta y Seguimiento/i);
    expect(progressCopy.label.stopCompleted).toBe("Completada");
  });
});
