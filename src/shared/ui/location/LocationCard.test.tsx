import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { LocationCard } from "./LocationCard";
import { LOCATION_FIELD_COPY } from "./locationFieldCopy";
import type { LocationValue } from "./LocationField.types";

const value: LocationValue = {
  locationName: "Bodega Norte",
  street: "Av Industria",
  exteriorNumber: "120",
  postalCode: "66600",
  neighborhoodName: "Parque Industrial",
  latitude: 25.78,
  longitude: -100.18,
  geocodingAccuracy: "approximate",
  isCartaPorteReady: true,
};

describe("LocationCard", () => {
  it("renders default variant with name and actions", () => {
    render(
      <LocationCard
        value={value}
        onChangeRequest={() => undefined}
        onEditRequest={() => undefined}
      />,
    );

    const card = screen.getByTestId("location-card");
    expect(card).toHaveAttribute("data-variant", "default");
    expect(screen.getByText("Bodega Norte")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: LOCATION_FIELD_COPY.changeAriaLabel })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: LOCATION_FIELD_COPY.editAriaLabel })).toBeInTheDocument();
    expect(screen.getByText("Punto aproximado")).toBeInTheDocument();
  });

  it("renders compact without action buttons", () => {
    render(<LocationCard value={value} variant="compact" />);
    expect(screen.getByTestId("location-card")).toHaveAttribute(
      "data-variant",
      "compact",
    );
    expect(screen.queryByRole("button", { name: LOCATION_FIELD_COPY.changeAriaLabel })).not.toBeInTheDocument();
  });

  it("renders detailed coords", () => {
    render(<LocationCard value={value} variant="detailed" />);
    expect(screen.getByText(/25\.78000/)).toBeInTheDocument();
  });

  it("renders operational neighborhood", () => {
    render(<LocationCard value={value} variant="operational" />);
    expect(screen.getByText("Parque Industrial")).toBeInTheDocument();
  });

  it("shows fiscal readiness copy when context is fiscal", () => {
    render(
      <LocationCard
        value={value}
        context="fiscal"
        showCartaPorteStatus
      />,
    );
    expect(screen.getByText(LOCATION_FIELD_COPY.fiscalReady)).toBeInTheDocument();
    expect(
      screen.queryByText(LOCATION_FIELD_COPY.cartaPorteReady),
    ).not.toBeInTheDocument();
  });

  it("keeps Carta Porte readiness copy for trip stops", () => {
    render(
      <LocationCard
        value={value}
        context="tripStop"
        showCartaPorteStatus
      />,
    );
    expect(
      screen.getByText(LOCATION_FIELD_COPY.cartaPorteReady),
    ).toBeInTheDocument();
  });

  it("derives not-ready fiscal badge when SAT fields are incomplete", () => {
    const incomplete: LocationValue = {
      locationName: "Domicilio fiscal",
      postalCode: "06600",
      satCountryCode: "MEX",
      // sin estado → badge list no ready
      isCartaPorteReady: undefined,
    };
    render(
      <LocationCard
        value={incomplete}
        context="fiscal"
        showCartaPorteStatus
      />,
    );
    expect(
      screen.getByText(LOCATION_FIELD_COPY.fiscalNotReady),
    ).toBeInTheDocument();
  });

  it("falls back title to street summary when locationName is missing", () => {
    const withoutName: LocationValue = {
      locationName: null,
      street: "Boulevard Bernardo Quintana Arrioja",
      exteriorNumber: "12",
      postalCode: "76022",
    };
    render(<LocationCard value={withoutName} />);
    expect(
      screen.getByText("Boulevard Bernardo Quintana Arrioja 12 · CP 76022"),
    ).toBeInTheDocument();
  });
});
