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
});
