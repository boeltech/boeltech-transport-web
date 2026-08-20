import { describe, expect, it } from "vitest";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { describeStampApiError } from "./stampErrorDescription";

describe("describeStampApiError", () => {
  it("apunta al catálogo de vehículos cuando falta Autotransporte CP3.1", () => {
    const error = new ApiError(
      "Datos del vehículo incompletos para Carta Porte 3.1 (configuración vehicular SAT...). Complételos en el catálogo de vehículos y vuelva a timbrar.",
      422,
      "CP31_VEHICLE_INCOMPLETE",
      {
        issues: [
          {
            code: "CP31_VEHICLE_INCOMPLETE",
            message:
              "Datos del vehículo incompletos para Carta Porte 3.1: configuración vehicular SAT, aseguradora de responsabilidad civil, peso bruto vehicular (toneladas, mayor a cero).",
            path: "vehicle.trip_id:trip-1",
          },
        ],
      },
      [
        {
          field: "vehicle.trip_id:trip-1",
          label: "vehicle.trip_id:trip-1",
          message:
            "Datos del vehículo incompletos para Carta Porte 3.1: configuración vehicular SAT, aseguradora de responsabilidad civil, peso bruto vehicular (toneladas, mayor a cero).",
        },
      ],
    );

    const message = describeStampApiError(error);

    expect(message).toContain("configuración vehicular SAT");
    expect(message).toMatch(/Vehículos/i);
    expect(message).toMatch(/vuelva a timbrar/i);
  });

  it("también reconoce detalle CP31_VEHICLE_INCOMPLETE bajo código genérico legacy", () => {
    const error = new ApiError(
      "No se pudo preparar el complemento Carta Porte 3.1 previo al timbrado.",
      500,
      "CP31_PRESTAMP_PREPARATION_FAILED",
      {
        issues: [
          {
            code: "CP31_VEHICLE_INCOMPLETE",
            message:
              "Datos del vehículo incompletos para Carta Porte 3.1: peso bruto vehicular.",
          },
        ],
      },
    );

    const message = describeStampApiError(error);

    expect(message).toContain("peso bruto vehicular");
    expect(message).toMatch(/Vehículos/i);
  });

  it("usa details.hint cuando el mensaje PAC queda genérico (CFDI40147)", () => {
    const error = new ApiError(
      "El PAC rechazó el CFDI por validación fiscal/XSD.",
      422,
      "PAC_VALIDATION_ERROR",
      {
        pac_rule: "CFDI40147",
        hint:
          "El código postal fiscal 01210 no coincide con el registrado ante el SAT para el RFC HAÑ930228SM9. Si la factura ya muestra ese código, no lo cambie en el cliente: confírmelo en la constancia de situación fiscal del receptor y, si es el mismo, pida apoyo a soporte.",
      },
    );

    const message = describeStampApiError(error);

    expect(message).toContain("01210");
    expect(message).toContain("HAÑ930228SM9");
    expect(message).toContain("código postal fiscal");
    expect(message).not.toContain("validación fiscal/XSD");
  });

  it("incluye hint de PAC_ISSUED_AT_OUT_OF_RANGE cuando aporta reintento", () => {
    const hint =
      "Vuelve a intentar el timbrado; al timbrar se actualiza la fecha de emisión. Si el error persiste: (1) si Comprobante.Fecha va adelantada vs el reloj ProFact, ajusta PROFACT_FECHA_CLOCK_OFFSET_MINUTES (sandbox suele necesitar -60); (2) verifica la hora del servidor API.";
    const error = new ApiError(
      "No se pudo timbrar: la fecha de emisión está fuera de la ventana de 72 horas del PAC (a veces adelantada respecto al reloj ProFact). Reintenta; si persiste, revisa la hora del servidor API o el ajuste PROFACT_FECHA_CLOCK_OFFSET_MINUTES en sandbox.",
      422,
      "PAC_ISSUED_AT_OUT_OF_RANGE",
      {
        pac_provider: "profact",
        pac_code: "401",
        hint,
      },
    );

    const message = describeStampApiError(error);

    expect(message).toContain("72 horas");
    expect(message).toContain("PROFACT_FECHA_CLOCK_OFFSET_MINUTES");
  });
});
