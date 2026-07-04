import { describe, expect, it } from "vitest";
import type { AxiosError } from "axios";

import { ApiError, type ApiErrorResponse } from "./error-handler";

function buildAxiosError(data: ApiErrorResponse, status = 422): AxiosError<ApiErrorResponse> {
  return {
    isAxiosError: true,
    response: { status, data, statusText: "Unprocessable Entity", headers: {}, config: {} as never },
    config: {} as never,
    name: "AxiosError",
    message: "Request failed",
    toJSON: () => ({}),
  };
}

describe("ApiError.fromAxiosError", () => {
  it("parsea details con path string (CP31 pre-stamp) sin lanzar join", () => {
    const error = ApiError.fromAxiosError(
      buildAxiosError({
        error:
          "Datos del operador incompletos para Carta Porte 3.1 (nombre, licencia y RFC del empleado/conductor).",
        code: "CP31_DRIVER_FIGURA_PRESTAMP_FAILED",
        details: [
          {
            code: "CP31_DRIVER_RFC_REQUIRED",
            message:
              "El RFC del operador (empleado del conductor asignado al viaje) es obligatorio para Carta Porte 3.1 (TiposFigura:RFCFigura) y debe tener formato de RFC mexicano válido. Captúrelo en el expediente del empleado/conductor.",
            path: "trip.52f25afe-f42d-4b4c-b35d-80127231ca0e.driver.rfc",
          },
        ],
      }),
    );

    expect(error.message).toContain("Datos del operador incompletos");
    expect(error.validationErrors).toHaveLength(1);
    expect(error.validationErrors[0]?.field).toBe(
      "trip.52f25afe-f42d-4b4c-b35d-80127231ca0e.driver.rfc",
    );
    expect(error.validationErrors[0]?.message).toContain("RFC del operador");
    expect(error.getToastMessage()).toContain("RFC del operador");
  });

  it("traduce CP132 del PAC a mensaje operativo sin códigos técnicos", () => {
    const error = ApiError.fromAxiosError(
      buildAxiosError({
        error: "El PAC rechazó el CFDI por validación fiscal/XSD.",
        code: "PAC_VALIDATION_ERROR",
        details: {
          pac_provider: "profact",
          pac_code: "21001",
          pac_rule: "CP132",
          raw: {
            description:
              'CP132 - El valor registrado en el atributo "Ubicaciones:Ubicacion:RFCRemitenteDestinatario" es incorrecto o no se encuentra en la lista de RFC inscritos no cancelados del SAT (l_RFC).',
            detail:
              '[{"Key":"messageDetail","Value":"El atributo RFCRemitenteDestinatario de la ubicación no es valido."}]',
          },
        },
      }),
    );

    expect(error.message).toContain("parada del viaje");
    expect(error.message).toContain("Viajes → Ruta");
    expect(error.message).not.toContain("CP132");
    expect(error.message).not.toContain("RFCRemitenteDestinatario");
    expect(error.message).not.toContain("l_RFC");
  });

  it("traduce PAC_ISSUED_AT_OUT_OF_RANGE a mensaje operativo sin jerga ProFact", () => {
    const error = ApiError.fromAxiosError(
      buildAxiosError(
        {
          error:
            "El PAC rechazó el timbrado: la fecha de emisión del CFDI supera las 72 horas permitidas.",
          code: "PAC_ISSUED_AT_OUT_OF_RANGE",
          details: {
            pac_provider: "profact",
            pac_code: "401",
            hint: "Vuelve a intentar el timbrado.",
            raw: "ProFact TimbraCFDI error [401]: La fecha de generación no puede ser mayor a 72 horas",
          },
        },
        422,
      ),
    );

    expect(error.message).toContain("72 horas");
    expect(error.message).toContain("actualiza la fecha automáticamente");
    expect(error.message).not.toContain("ProFact");
    expect(error.message).not.toContain("Comprobante.Fecha");
  });

  it("fallback 502 INTERNAL_ERROR con 72 horas en error raw usa mensaje operativo", () => {
    const error = ApiError.fromAxiosError(
      buildAxiosError(
        {
          error:
            "ProFact TimbraCFDI error [401]: La fecha de generación no puede ser mayor a 72 horas — Comprobante.Fecha",
          code: "INTERNAL_ERROR",
        },
        502,
      ),
    );

    expect(error.message).toContain("72 horas");
    expect(error.message).toContain("actualiza la fecha automáticamente");
    expect(error.message).not.toContain("Comprobante.Fecha");
  });

  it("traduce 502 INTERNAL_ERROR con CFDI40158 en error crudo de ProFact", () => {
    const error = ApiError.fromAxiosError(
      buildAxiosError(
        {
          error:
            'ProFact TimbraCFDI error [CFDI40158]: La clave del campo RegimenFiscalR debe corresponder con el tipo de persona (física o moral). — [{"Key":"rfcReceptor","Value":"MERG881004A27"},{"Key":"esPersonaFisica","Value":"True"},{"Key":"regimenFiscalReportado","Value":"622"},{"Key":"regimenFiscalEsperado","Value":"605,606,607,"}]',
          code: "INTERNAL_ERROR",
        },
        502,
      ),
    );

    expect(error.message).toContain("MERG881004A27");
    expect(error.message).toContain("622");
    expect(error.message).toContain("persona física");
    expect(error.message).not.toBe("Error interno del servidor");
    expect(error.message).not.toContain("ProFact");
  });

  it("traduce PAC_VALIDATION_ERROR CFDI40158 con details estructurados", () => {
    const error = ApiError.fromAxiosError(
      buildAxiosError(
        {
          error: "El PAC rechazó el CFDI por validación fiscal/XSD.",
          code: "PAC_VALIDATION_ERROR",
          details: {
            pac_rule: "CFDI40158",
            raw: {
              detail:
                '[{"Key":"rfcReceptor","Value":"MERG881004A27"},{"Key":"esPersonaFisica","Value":"True"},{"Key":"regimenFiscalReportado","Value":"622"}]',
            },
            hint:
              "Corrija régimen fiscal en «Corregir datos fiscales» o use un RFC acorde al régimen actual.",
          },
        },
        422,
      ),
    );

    expect(error.message).toContain("622");
    expect(error.message).toContain("MERG881004A27");
    expect(error.message).not.toContain("ProFact");
  });
});
