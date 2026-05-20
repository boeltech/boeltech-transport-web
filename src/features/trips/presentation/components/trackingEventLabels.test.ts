import { describe, expect, it } from "vitest";
import { StopType, type TripStop } from "@features/trips/domain";
import { formatTrackingEventLabel } from "./trackingEventLabels";

function stop(stopType: TripStop["stopType"]): TripStop {
  return { stopType } as TripStop;
}

describe("formatTrackingEventLabel", () => {
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
});
