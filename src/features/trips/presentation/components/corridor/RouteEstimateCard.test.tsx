import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { RouteEstimate } from "@features/trips/domain";
import { RouteEstimateCard } from "./RouteEstimateCard";
import { canvasCopy } from "../../copy/canvasCopy";

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
    expect(
      screen.getByRole("button", { name: canvasCopy.estimate.showBreakdown }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Combustible/i)).not.toBeInTheDocument();
  });

  it("reveals fuel/toll breakdown on demand (PD6)", async () => {
    const user = userEvent.setup();
    render(<RouteEstimateCard estimate={estimate} />);

    await user.click(
      screen.getByRole("button", { name: canvasCopy.estimate.showBreakdown }),
    );

    expect(screen.getByText(/^Combustible/)).toBeInTheDocument();
    expect(screen.getByText(/^Peaje/)).toBeInTheDocument();
    expect(
      screen.getByText(/Con base en 8 viajes completados/),
    ).toBeInTheDocument();
  });
});
