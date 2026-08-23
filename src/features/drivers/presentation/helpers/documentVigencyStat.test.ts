import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveDocumentVigencyStat } from "./documentVigencyStat";

describe("resolveDocumentVigencyStat", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-21T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("federal vacío → Sin registrar", () => {
    expect(resolveDocumentVigencyStat(null, "missing")).toEqual({
      value: "Sin registrar",
      tone: "neutral",
    });
  });

  it("estatal vacío → No aplica", () => {
    expect(resolveDocumentVigencyStat(null, "notApplicable")).toEqual({
      value: "No aplica",
      tone: "neutral",
    });
  });

  it("vencida → Vencida / destructive", () => {
    expect(resolveDocumentVigencyStat("2026-08-01", "missing")).toEqual({
      value: "Vencida",
      tone: "destructive",
    });
  });

  it("próxima a vencer (≤30d) → warning", () => {
    expect(resolveDocumentVigencyStat("2026-09-01", "missing")).toEqual({
      value: "Vence en 11 d",
      tone: "warning",
      description: "Dentro de 30 días",
    });
  });

  it("vigente → success", () => {
    expect(resolveDocumentVigencyStat("2027-01-15", "missing")).toEqual({
      value: "Vigente",
      tone: "success",
      description: "Sin alerta de vencimiento",
    });
  });
});
