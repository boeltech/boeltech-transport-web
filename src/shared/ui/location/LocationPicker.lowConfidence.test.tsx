import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { LocationPicker } from "./LocationPicker";
import { LOCATION_FIELD_COPY } from "./locationFieldCopy";

const mapboxCandidate = {
  label: "Mariano Escobedo 145, Pachuca, Hidalgo",
  position: { latitude: 20.1, longitude: -98.7 },
  rawPlaceId: "place.homonym",
  postalCode: "42000",
};

vi.mock("./useLocationSearch", () => ({
  useLocationSearch: () => ({
    results: [
      {
        id: "__location_create__",
        source: "create" as const,
        label: LOCATION_FIELD_COPY.createNewLowConfidence,
        description: LOCATION_FIELD_COPY.lowConfidenceCreateHint,
      },
      {
        id: "mapbox:place.homonym",
        source: "mapbox" as const,
        label: mapboxCandidate.label,
        mapbox: mapboxCandidate,
      },
    ],
    isLoading: false,
    isFetching: false,
    internalError: null,
    mapboxError: null,
    searchConfidence: "low" as const,
  }),
  MAPBOX_MIN_QUERY_LENGTH: 3,
}));

describe("LocationPicker low search confidence", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("shows low-confidence banner and recommended create group", () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <LocationPicker onSelect={vi.fn()} open onOpenChange={vi.fn()} />
      </QueryClientProvider>,
    );

    expect(
      screen.getByTestId("location-search-low-confidence"),
    ).toHaveTextContent(LOCATION_FIELD_COPY.lowConfidenceBanner);
    expect(
      screen.getByText(LOCATION_FIELD_COPY.groupCreateRecommended),
    ).toBeInTheDocument();
    expect(
      screen.getByText(LOCATION_FIELD_COPY.createNewLowConfidence),
    ).toBeInTheDocument();
  });
});
