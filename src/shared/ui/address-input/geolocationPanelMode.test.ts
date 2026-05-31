import { describe, expect, it } from "vitest";
import { resolveGeolocationPanelMode } from "./geolocationPanelMode";

describe("resolveGeolocationPanelMode", () => {
  it("origen: búsqueda y mapa; sin distancia por tramo", () => {
    expect(
      resolveGeolocationPanelMode({
        isOriginStop: true,
        hasClientPrefill: true,
        catalogHasStoredCoordinates: true,
      }),
    ).toEqual({
      showSearchControls: true,
      showDistanceSection: false,
      distanceEditable: false,
    });
  });

  it("parada intermedia/destino: panel completo aunque haya prefill de cliente", () => {
    expect(
      resolveGeolocationPanelMode({
        isOriginStop: false,
        hasClientPrefill: true,
        catalogHasStoredCoordinates: true,
      }),
    ).toEqual({
      showSearchControls: true,
      showDistanceSection: true,
      distanceEditable: true,
    });
  });
});
