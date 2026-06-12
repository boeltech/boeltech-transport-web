/**
 * Smoke dark — mapa de seguimiento de viaje (mock Mapbox container).
 */
import { describe, expect, it, vi } from "vitest";
import { TripTrackingMapView } from "@features/trips/presentation/components/trip-tracking/TripTrackingMapView";
import {
  expectNoRawTailwindColors,
  renderWithTheme,
} from "@/test/renderWithTheme";

vi.mock("mapbox-gl", () => {
  class MockMap {
    addControl = vi.fn();
    on = vi.fn();
    once = vi.fn();
    remove = vi.fn();
    resize = vi.fn();
    isStyleLoaded = vi.fn().mockReturnValue(true);
    getLayer = vi.fn();
    getSource = vi.fn();
    addSource = vi.fn();
    addLayer = vi.fn();
    removeLayer = vi.fn();
    removeSource = vi.fn();
    fitBounds = vi.fn();
    flyTo = vi.fn();
    setStyle = vi.fn();
  }

  class MockMarker {
    setLngLat = vi.fn().mockReturnThis();
    setPopup = vi.fn().mockReturnThis();
    addTo = vi.fn().mockReturnThis();
    remove = vi.fn();
  }

  class MockPopup {
    setHTML = vi.fn().mockReturnThis();
    setText = vi.fn().mockReturnThis();
  }

  return {
    default: {
      Map: MockMap,
      NavigationControl: vi.fn(),
      Marker: MockMarker,
      Popup: MockPopup,
      accessToken: "",
    },
  };
});

describe("trip detail dark smoke", () => {
  it("renders tracking map shell in dark without raw palette classes", () => {
    const { container } = renderWithTheme(
      <TripTrackingMapView
        token="test-token"
        stops={[]}
        events={[]}
        routeGeojson={null}
        lastKnownPosition={null}
      />,
      { resolvedTheme: "dark" },
    );

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(container.querySelector(".rounded-md.border")).toBeTruthy();
    expectNoRawTailwindColors(container);
  });
});
