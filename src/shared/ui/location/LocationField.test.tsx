import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { LocationField } from "./LocationField";
import { LOCATION_FIELD_COPY } from "./locationFieldCopy";
import type { LocationValue } from "./LocationField.types";

const mapboxCandidate = {
  label: "Av Industria 120, 66600 Apodaca, N.L.",
  position: { latitude: 25.78, longitude: -100.18 },
  rawPlaceId: "place.1",
};

vi.mock("./useLocationSearch", () => ({
  useLocationSearch: () => ({
    results: [
      {
        id: "mapbox:place.1",
        source: "mapbox" as const,
        label: mapboxCandidate.label,
        mapbox: mapboxCandidate,
      },
      {
        id: "__location_create__",
        source: "create" as const,
        label: LOCATION_FIELD_COPY.createNew,
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

const sheetSpy = vi.fn();

vi.mock("./LocationSheet", () => ({
  LocationSheet: (props: {
    open: boolean;
    value?: LocationValue | null;
    existingAddresses?: unknown;
  }) => {
    sheetSpy(props);
    return props.open ? (
      <div data-testid="location-sheet-open">
        {props.value?.locationName ?? "draft"}
      </div>
    ) : (
      <div data-testid="location-sheet-closed" />
    );
  },
}));

vi.mock("@shared/geolocation/addressResolver", () => ({
  resolveMapboxToSat: vi.fn(async () => ({
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
  })),
}));

function renderField(
  value: LocationValue | null,
  onChange = vi.fn(),
  extras?: { existingAddresses?: LocationValue[] },
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    onChange,
    ...render(
      <QueryClientProvider client={queryClient}>
        <LocationField
          context="operational"
          value={value}
          onChange={onChange}
          existingAddresses={
            extras?.existingAddresses as never
          }
        />
      </QueryClientProvider>,
    ),
  };
}

describe("LocationField H1 (ADR-0092)", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    sheetSpy.mockClear();
  });

  it("empty shows search placeholder", () => {
    renderField(null);
    expect(screen.getByRole("combobox")).toHaveTextContent(
      LOCATION_FIELD_COPY.searchPlaceholder,
    );
    expect(screen.getByText(LOCATION_FIELD_COPY.emptyHint)).toBeInTheDocument();
  });

  it("create-only omits catalog hint and uses map/create copy", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <LocationField
          context="operational"
          value={null}
          onChange={vi.fn()}
          includeInternal={false}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("combobox")).toHaveTextContent(
      LOCATION_FIELD_COPY.searchPlaceholderCreateOnly,
    );
    expect(
      screen.getByText(LOCATION_FIELD_COPY.emptyHintCreateOnly),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(LOCATION_FIELD_COPY.emptyHint),
    ).not.toBeInTheDocument();
  });

  it("with catalog value shows card", () => {
    renderField({
      locationName: "CEDIS Sur",
      street: "Calle Sur",
      exteriorNumber: "5",
      postalCode: "44100",
      geocodingAccuracy: "exact",
      sourceAddressId: "addr-1",
    });

    expect(screen.getByTestId("location-card")).toBeInTheDocument();
    expect(screen.getByText("CEDIS Sur")).toBeInTheDocument();
  });

  it("Mapbox select without sourceAddressId opens Sheet and does not onChange", async () => {
    const user = userEvent.setup();
    const { onChange } = renderField(null);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText(mapboxCandidate.label));

    await waitFor(() => {
      expect(screen.getByTestId("location-sheet-open")).toBeInTheDocument();
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("passes existingAddresses to LocationSheet", () => {
    const candidates = [
      {
        id: "a1",
        postalCode: "44100",
        street: "Calle",
        exteriorNumber: "1",
        latitude: 20,
        longitude: -103,
      },
    ];
    renderField(null, vi.fn(), {
      existingAddresses: candidates as never,
    });
    expect(sheetSpy).toHaveBeenCalled();
    const last = sheetSpy.mock.calls.at(-1)?.[0] as {
      existingAddresses?: unknown;
    };
    expect(last.existingAddresses).toEqual(candidates);
  });
});
