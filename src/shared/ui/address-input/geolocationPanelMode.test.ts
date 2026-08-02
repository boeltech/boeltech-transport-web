import { describe, expect, it } from "vitest";
import { resolveGeolocationPanelMode } from "./geolocationPanelMode";

describe("resolveGeolocationPanelMode", () => {
  it("oculta distancia del tramo en origen (vive en el timeline)", () => {
    expect(
      resolveGeolocationPanelMode({
        isOriginStop: true,
      }),
    ).toEqual({
      showSearchControls: true,
      showDistanceSection: false,
      distanceEditable: false,
    });
  });

  it("oculta distancia del tramo en escalas y destino (vive en el timeline)", () => {
    expect(
      resolveGeolocationPanelMode({
        isOriginStop: false,
      }),
    ).toEqual({
      showSearchControls: true,
      showDistanceSection: false,
      distanceEditable: false,
    });
  });
});
