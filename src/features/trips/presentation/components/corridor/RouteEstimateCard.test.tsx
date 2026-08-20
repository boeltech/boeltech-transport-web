import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { RouteEstimate } from "@features/trips/domain";
import { canvasCopy } from "../../copy/canvasCopy";
import { RouteEstimateCard } from "./RouteEstimateCard";

const DISCLAIMER =
  "Estimado interno con base en viajes completados. No es precio al cliente. Percances no incluidos.";

const estimate: RouteEstimate = {
  fuelEstimate: 4200,
  tollEstimate: 1850,
  totalEstimate: 6050,
  currency: "MXN",
  basedOnTrips: 8,
  estimatedDistanceKm: 940,
  vehicleEfficiencyKmL: 3.2,
  adjusted: true,
  disclaimer: DISCLAIMER,
};

describe("RouteEstimateCard", () => {
  it("renders nothing when estimate is null", () => {
    const { container } = render(<RouteEstimateCard estimate={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows compact internal estimate without blocking copy as an alert", () => {
    render(<RouteEstimateCard estimate={estimate} />);
    expect(screen.getByText(/Estimado interno/)).toBeInTheDocument();
    expect(screen.getByText(/no es precio al cliente/i)).toBeInTheDocument();
    expect(screen.getByText(/no bloquea reservar/i)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText(/cotizaci[oó]n al cliente/i)).not.toBeInTheDocument();
  });
});
