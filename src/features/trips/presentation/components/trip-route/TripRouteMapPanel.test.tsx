import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { StopType } from "@features/trips/domain";

import { TripRouteMapPanel } from "./TripRouteMapPanel";
import { tripDetailCopy } from "../../copy";

vi.mock("@shared/config/env", () => ({
  default: {
    geolocation: { mapboxPublicToken: "" },
  },
}));

const copy = tripDetailCopy.route;

describe("TripRouteMapPanel", () => {
  it("F9h: oculta leyenda cuando no hay routeGeojson", () => {
    render(
      <TripRouteMapPanel
        stops={
          [
            {
              id: "1",
              sequenceOrder: 1,
              stopType: [StopType.ORIGIN],
              locationName: "Origen",
              latitude: 25.6,
              longitude: -100.3,
            },
          ] as never
        }
      />,
    );

    expect(screen.queryByText(copy.label.mapLegendActual)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.label.mapLegendPlanned)).not.toBeInTheDocument();
  });

  it("muestra leyenda cuando hay routeGeojson", () => {
    render(
      <TripRouteMapPanel
        routeGeojson={{ type: "FeatureCollection", features: [] }}
        stops={
          [
            {
              id: "1",
              sequenceOrder: 1,
              stopType: [StopType.ORIGIN],
              locationName: "Origen",
              latitude: 25.6,
              longitude: -100.3,
            },
          ] as never
        }
      />,
    );

    expect(screen.getByText(copy.label.mapLegendActual)).toBeInTheDocument();
    expect(screen.getByText(copy.label.mapLegendPlanned)).toBeInTheDocument();
  });
});
