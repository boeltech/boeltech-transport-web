import { describe, expect, it } from "vitest";
import type { AxiosError } from "axios";

import {
  ApiError,
  type ApiErrorResponse,
} from "@shared/api/interceptors/error-handler";

import { formatInvoiceApiErrorMessages } from "./formatInvoiceApiErrors";

function axiosValidationError(
  issues: Array<{ path: string[]; message: string }>,
): AxiosError<ApiErrorResponse> {
  return {
    isAxiosError: true,
    response: {
      status: 422,
      data: {
        error: "Validación fallida",
        code: "VALIDATION_ERROR",
        details: { issues: issues.map((issue) => ({ code: "custom", ...issue })) },
      },
    },
  } as unknown as AxiosError<ApiErrorResponse>;
}

describe("formatInvoiceApiErrorMessages", () => {
  it("maps Zod validation errors from ApiError", () => {
    const error = new ApiError("Validación fallida", 422, "VALIDATION_ERROR", undefined, [
      { field: "receiver_rfc", label: "RFC", message: "Formato de RFC invalido" },
    ]);

    expect(formatInvoiceApiErrorMessages(error)).toEqual([
      "RFC: Formato de RFC invalido",
    ]);
  });

  it("nombra los campos de facturación en español, sin snake_case", () => {
    const error = ApiError.fromAxiosError(
      axiosValidationError([
        { path: ["receiver_postal_code"], message: "Codigo postal invalido (5 digitos)" },
        { path: ["cfdi_usage"], message: "Valor no permitido" },
        { path: ["concepts", "0", "clave_prod_serv"], message: "Campo requerido" },
      ]),
    );

    const messages = formatInvoiceApiErrorMessages(error);

    expect(messages).toEqual([
      "Código postal del receptor: Codigo postal invalido (5 digitos)",
      "Uso del CFDI: Valor no permitido",
      "Clave de producto o servicio: Campo requerido",
    ]);
    expect(messages.join(" ")).not.toMatch(/[a-z]+_[a-z]+/);
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

  it("ignores details.raw and prefers stable error.message", () => {
    const error = new ApiError(
      "El PAC rechazó el CFDI por validación fiscal/XSD.",
      422,
      "PAC_VALIDATION_ERROR",
      {
        pac_rule: "CFDI40139",
        raw: "ProFact TimbraCFDI error [CFDI40139]: <soap>secret</soap>",
      },
    );

    expect(formatInvoiceApiErrorMessages(error)).toEqual([
      "El PAC rechazó el CFDI por validación fiscal/XSD.",
    ]);
  });
});
