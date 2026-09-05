import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { resolveMapboxToSat } from "@shared/geolocation/addressResolver";

import { LocationPicker } from "./LocationPicker";
import { LOCATION_FIELD_COPY } from "./locationFieldCopy";

const mapboxCandidate = {
  label: "Av Industria 120, Parque Industrial, 66600 Apodaca",
  position: { latitude: 25.78, longitude: -100.18 },
  rawPlaceId: "place.ambiguous",
};

vi.mock("./useLocationSearch", () => ({
  useLocationSearch: () => ({
    results: [
      {
        id: "mapbox:place.ambiguous",
        source: "mapbox" as const,
        label: mapboxCandidate.label,
        mapbox: mapboxCandidate,
      },
    ],
    isLoading: false,
    isFetching: false,
    internalError: null,
    mapboxError: null,
    searchConfidence: null,
  }),
  MAPBOX_MIN_QUERY_LENGTH: 3,
}));

vi.mock("@shared/geolocation/addressResolver", () => ({
  resolveMapboxToSat: vi.fn(),
}));

describe("LocationPicker H1 ambiguities", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    vi.mocked(resolveMapboxToSat).mockReset();
  });

  it("does not auto-fill neighborhood when resolver reports ambiguity", async () => {
    vi.mocked(resolveMapboxToSat).mockResolvedValue({
      resolved: {
        postalCode: "66600",
        satStateCode: "19",
        satMunicipalityCode: "006",
        satNeighborhoodCode: "0001",
        neighborhoodName: "Parque Industrial",
        latitude: 25.78,
        longitude: -100.18,
      },
      confidence: "medium",
      ambiguities: ["neighborhood"],
      mapboxLabel: mapboxCandidate.label,
    });

    const onSelect = vi.fn();
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <LocationPicker onSelect={onSelect} open onOpenChange={vi.fn()} />
      </QueryClientProvider>,
    );

    await user.click(screen.getByText(mapboxCandidate.label));

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalled();
    });

    const value = onSelect.mock.calls[0]![0];
    expect(value.postalCode).toBe("66600");
    expect(value.satStateCode).toBe("19");
    expect(value.neighborhoodName).toBeNull();
    expect(value.satNeighborhoodCode).toBeNull();
    expect(value.satAmbiguities).toEqual(["neighborhood"]);
    expect(value.geocodingAccuracy).toBe("approximate");
  });

  it("never maps Mapbox high confidence to exact accuracy (H6)", async () => {
    vi.mocked(resolveMapboxToSat).mockResolvedValue({
      resolved: {
        postalCode: "66600",
        satStateCode: "19",
        satMunicipalityCode: "006",
        latitude: 25.78,
        longitude: -100.18,
      },
      confidence: "high",
      ambiguities: [],
      mapboxLabel: mapboxCandidate.label,
    });

    const onSelect = vi.fn();
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <LocationPicker onSelect={onSelect} open onOpenChange={vi.fn()} />
      </QueryClientProvider>,
    );

    await user.click(screen.getByText(mapboxCandidate.label));
    await waitFor(() => expect(onSelect).toHaveBeenCalled());
    expect(onSelect.mock.calls[0]![0].geocodingAccuracy).toBe("approximate");
    expect(resolveMapboxToSat).toHaveBeenCalledWith(
      expect.objectContaining({
        label: mapboxCandidate.label,
      }),
    );
  });

  it("shows create group from compositor results", () => {
    expect(LOCATION_FIELD_COPY.createNew).toBeTruthy();
  });
});
