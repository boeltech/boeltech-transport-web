import { describe, expect, it } from "vitest";
import { StopType, type TripStop } from "@features/trips/domain";
import {
  formatArrivalButtonLabel,
  formatDepartureButtonLabel,
  formatStopActionShortLabel,
} from "./trackingActionLabels";

function stop(
  partial: Partial<TripStop> & Pick<TripStop, "stopType">,
): TripStop {
  return {
    id: "stop-1",
    sequenceOrder: 1,
    address: "Av. Principal 100",
    city: "Guadalajara",
    ...partial,
  } as TripStop;
}

describe("trackingActionLabels", () => {
  it("arma etiqueta corta con tipo de parada", () => {
    expect(
      formatStopActionShortLabel(stop({ stopType: [StopType.WAYPOINT] }), 2),
    ).toBe("Parada 2 · Escala");
  });

  it("incluye parada en botón de llegada", () => {
    const waypoint = stop({ stopType: [StopType.WAYPOINT] });
    expect(formatArrivalButtonLabel(waypoint, 2)).toBe(
      "Registrar llegada — Parada 2 · Escala",
    );
  });

  it("sin parada pendiente deja solo la acción", () => {
    expect(formatArrivalButtonLabel(undefined, undefined)).toBe(
      "Registrar llegada",
    );
    expect(formatDepartureButtonLabel(undefined, undefined)).toBe(
      "Registrar salida",
    );
  });
});
