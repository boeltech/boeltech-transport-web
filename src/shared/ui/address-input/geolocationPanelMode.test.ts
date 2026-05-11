import { describe, expect, it } from "vitest";
import { resolveGeolocationPanelMode } from "./geolocationPanelMode";

describe("resolveGeolocationPanelMode", () => {
  it("oculta distancia en origen sin prefill", () => {
    const mode = resolveGeolocationPanelMode({
      isOriginStop: true,
      hasClientPrefill: false,
      catalogHasStoredCoordinates: false,
    });

    expect(mode).toEqual({
      showSearchControls: true,
      showDistanceSection: false,
      distanceEditable: false,
    });
  });

  it("oculta búsqueda en origen solo si el catálogo ya traía coordenadas", () => {
    const mode = resolveGeolocationPanelMode({
      isOriginStop: true,
      hasClientPrefill: true,
      catalogHasStoredCoordinates: true,
    });

    expect(mode).toEqual({
      showSearchControls: false,
      showDistanceSection: false,
      distanceEditable: false,
    });
  });

  it("mantiene búsqueda en origen con prefill si el catálogo no tenía coords (tras geocode en sesión)", () => {
    const mode = resolveGeolocationPanelMode({
      isOriginStop: true,
      hasClientPrefill: true,
      catalogHasStoredCoordinates: false,
    });

    expect(mode).toEqual({
      showSearchControls: true,
      showDistanceSection: false,
      distanceEditable: false,
    });
  });

  it("> origen sin prefill: panel editable completo", () => {
    const mode = resolveGeolocationPanelMode({
      isOriginStop: false,
      hasClientPrefill: false,
      catalogHasStoredCoordinates: false,
    });

    expect(mode).toEqual({
      showSearchControls: true,
      showDistanceSection: true,
      distanceEditable: true,
    });
  });

  it("> origen con prefill y coords en catálogo: mapa + distancia editable", () => {
    const mode = resolveGeolocationPanelMode({
      isOriginStop: false,
      hasClientPrefill: true,
      catalogHasStoredCoordinates: true,
    });

    expect(mode).toEqual({
      showSearchControls: false,
      showDistanceSection: true,
      distanceEditable: true,
    });
  });

  it("> origen con prefill pero catálogo sin coords: búsqueda y distancia como dirección manual", () => {
    const mode = resolveGeolocationPanelMode({
      isOriginStop: false,
      hasClientPrefill: true,
      catalogHasStoredCoordinates: false,
    });

    expect(mode).toEqual({
      showSearchControls: true,
      showDistanceSection: true,
      distanceEditable: true,
    });
  });
});
