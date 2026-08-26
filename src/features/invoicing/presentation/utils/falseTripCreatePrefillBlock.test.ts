import { describe, expect, it } from "vitest";
import { isFalseTripPrefillBlockedError } from "./falseTripCreatePrefillBlock";

describe("isFalseTripPrefillBlockedError", () => {
  it.each([
    "FALSE_TRIP_OUTCOME_REQUIRED",
    "FALSE_TRIP_NOT_COMPLETED",
    "FALSE_TRIP_HAS_ACTIVE_CARGO",
    "TRIP_ALREADY_INVOICED",
    "SPLIT_INCOMPATIBLE_WITH_FALSE_TRIP",
  ] as const)("bloquea por código %s", (code) => {
    expect(isFalseTripPrefillBlockedError(code, undefined)).toBe(true);
  });

  it("no bloquea códigos ajenos", () => {
    expect(
      isFalseTripPrefillBlockedError("TRIP_PRIMARY_INVOICE_REQUIRED", undefined),
    ).toBe(false);
    expect(isFalseTripPrefillBlockedError(undefined, undefined)).toBe(false);
  });

  it("bloquea por mensaje de respaldo (TRIP_ALREADY_INVOICED sin code)", () => {
    expect(
      isFalseTripPrefillBlockedError(
        undefined,
        "Este viaje ya tiene una factura activa vinculada",
      ),
    ).toBe(true);
  });

  it("bloquea mensaje de completed", () => {
    expect(
      isFalseTripPrefillBlockedError(
        undefined,
        "El viaje en falso debe estar completado para emitir el ingreso sin Carta Porte",
      ),
    ).toBe(true);
  });
});
