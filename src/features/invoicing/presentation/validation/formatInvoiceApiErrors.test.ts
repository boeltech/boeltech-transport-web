import { describe, expect, it } from "vitest";

import { ApiError } from "@shared/api/interceptors/error-handler";

import { formatInvoiceApiErrorMessages } from "./formatInvoiceApiErrors";

describe("formatInvoiceApiErrorMessages", () => {
  it("maps Zod validation errors from ApiError", () => {
    const error = new ApiError("Validación fallida", 422, "VALIDATION_ERROR", undefined, [
      { field: "receiver_rfc", label: "RFC", message: "Formato de RFC invalido" },
    ]);

    expect(formatInvoiceApiErrorMessages(error)).toEqual([
      "RFC: Formato de RFC invalido",
    ]);
  });

  it("maps fiscal domain errors when details is a ValidationError array", () => {
    const error = new ApiError(
      "Validación fiscal fallida",
      422,
      "FISCAL_VALIDATION_FAILED",
      [
        { code: "MISSING_REGIME", message: "Régimen fiscal del receptor inválido" },
        { code: "TOTAL_MISMATCH", message: "El total no cuadra con subtotal + IVA" },
      ] as unknown as Record<string, unknown>,
    );

    expect(formatInvoiceApiErrorMessages(error)).toEqual([
      "Régimen fiscal del receptor inválido",
      "El total no cuadra con subtotal + IVA",
    ]);
  });

  it("maps CP route readiness issues", () => {
    const error = new ApiError(
      "Carta Porte incompleta",
      422,
      "CP_ROUTE_VALIDATION_FAILED",
      [
        {
          trip_code: "VJ-2025-001",
          issues: ["Falta domicilio de origen", "Mercancía sin peso"],
        },
      ] as unknown as Record<string, unknown>,
    );

    expect(formatInvoiceApiErrorMessages(error)).toEqual([
      "VJ-2025-001: Falta domicilio de origen",
      "VJ-2025-001: Mercancía sin peso",
    ]);
  });

  it("falls back to message for unknown errors", () => {
    expect(formatInvoiceApiErrorMessages(new Error("Red caída"))).toEqual(["Red caída"]);
  });
});
