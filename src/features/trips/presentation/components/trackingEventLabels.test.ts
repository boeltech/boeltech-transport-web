import { describe, expect, it } from "vitest";
import { StopType, type TripStop } from "@features/trips/domain";
import { formatTrackingEventLabel } from "./trackingEventLabels";

function stop(stopType: TripStop["stopType"]): TripStop {
  return { stopType } as TripStop;
}

describe("formatTrackingEventLabel", () => {
  it("etiqueta dispatch operativo", () => {
    expect(formatTrackingEventLabel("trip_dispatched")).toBe("Viaje despachado");
  });

  it("etiqueta salida de origen", () => {
    expect(formatTrackingEventLabel("trip_departed")).toBe("Salida de origen");
  });

  it("incluye rol de parada en salida del origen", () => {
    expect(
      formatTrackingEventLabel("stop_departed", stop([StopType.ORIGIN])),
    ).toBe("Salida — Origen");
  });

  it("incluye rol en llegada al destino", () => {
    expect(
      formatTrackingEventLabel("stop_arrived", stop([StopType.DESTINATION])),
    ).toBe("Llegada — Destino");
  });

  it("etiqueta eventos de carga", () => {
    expect(formatTrackingEventLabel("cargo_picked_up")).toBe("Carga recogida");
    expect(formatTrackingEventLabel("cargo_delivered")).toBe("Carga entregada");
  });
});
