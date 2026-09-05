/**
 * Smoke ADR-0092 / WS-LOCATION F6 — LocationField BUSCAR→USAR.
 * - Catálogo interno → Card (smoke F6)
 * - Mapbox → Sheet CONFIRMAR (H8)
 * Detalle Sheet/resolver races: unitarios en src/shared/ui/location/
 * Mock de búsqueda; no requiere backend ni Playwright.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import type { AddressSearchListItem } from "@shared/ui/address-picker/types";
import {
  LOCATION_FIELD_COPY,
  LocationField,
  locationValueFromInternal,
  locationValueToAddressSearchListItem,
  locationValueToSatAddressFields,
  type LocationValue,
} from "@shared/ui/location";
import { StopFormSheetAddressOriginSection } from "@features/trips/presentation/pages/create/components/stop-form/StopFormSheetAddressOriginSection";
import {
  addressSearchItemToDialogSlice,
  locationValueToDialogSlice,
  type StopDialogFormValues,
} from "@features/trips/presentation/pages/create/components/stopDialogAddressMapper";

const catalogItem: AddressSearchListItem = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  ownerType: "tenant",
  ownerId: "tttttttt-tttt-4ttt-8ttt-tttttttttttt",
  ownerLabel: "Transportes Norte",
  addressType: "warehouse",
  locationName: "Bodega Apodaca",
  street: "Av Industria",
  exteriorNumber: "120",
  postalCode: "66600",
  satStateCode: "19",
  satMunicipalityCode: "006",
  neighborhoodName: "Parque Industrial",
  satNeighborhoodCode: "0001",
  latitude: 25.78,
  longitude: -100.18,
  geocodingAccuracy: "approximate",
  geolocationPending: false,
  isPrimary: false,
  isActive: true,
  isCartaPorteReady: true,
};

const mapboxCandidate = {
  label: "Av Industria 120, 66600 Apodaca, N.L.",
  position: { latitude: 25.78, longitude: -100.18 },
  rawPlaceId: "place.mapbox.1",
  region: "Nuevo León",
  place: "Apodaca",
  postalCode: "66600",
};

const catalogSearchResult = {
  results: [
    {
      id: catalogItem.id,
      source: "internal" as const,
      label: catalogItem.locationName!,
      description: catalogItem.street ?? undefined,
      internal: catalogItem,
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
};

const useLocationSearchMock = vi.fn(() => catalogSearchResult);

vi.mock("@shared/ui/location/useLocationSearch", () => ({
  useLocationSearch: () => useLocationSearchMock(),
  MAPBOX_MIN_QUERY_LENGTH: 3,
}));

vi.mock("@shared/ui/location/LocationSheet", () => ({
  LocationSheet: ({
    open,
    value,
  }: {
    open: boolean;
    value?: LocationValue | null;
  }) =>
    open ? (
      <div data-testid="location-sheet-open">
        {value?.locationName ?? "draft"}
      </div>
    ) : (
      <div data-testid="location-sheet-closed" />
    ),
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

function LocationFieldHarness({
  onChangeSpy,
}: {
  onChangeSpy?: (value: LocationValue | null) => void;
}) {
  const [value, setValue] = useState<LocationValue | null>(null);
  const sat = value ? locationValueToSatAddressFields(value) : null;

  return (
    <div>
      <LocationField
        context="operational"
        value={value}
        onChange={(next) => {
          onChangeSpy?.(next);
          setValue(next);
        }}
        label="Ubicación"
      />
      {sat ? (
        <dl data-testid="sat-slice">
          <dd data-testid="sat-location-name">{sat.locationName}</dd>
          <dd data-testid="sat-street">{sat.street}</dd>
          <dd data-testid="sat-postal">{sat.postalCode}</dd>
        </dl>
      ) : null}
    </div>
  );
}

function TripStopLocationHarness() {
  const [selectedPrefill, setSelectedPrefill] =
    useState<AddressSearchListItem | null>(null);
  const [dialogSlice, setDialogSlice] =
    useState<Partial<StopDialogFormValues> | null>(null);

  return (
    <div>
      <StopFormSheetAddressOriginSection
        selectedPrefill={selectedPrefill}
        onPrefillSelect={(item) => {
          setSelectedPrefill(item);
          setDialogSlice(addressSearchItemToDialogSlice(item));
        }}
        onLocationDraft={(value) => {
          setSelectedPrefill(
            locationValueToAddressSearchListItem(value) ??
              locationValueFromInternal({
                ...catalogItem,
                id: "draft",
                locationName: value.locationName,
              }),
          );
          setDialogSlice(locationValueToDialogSlice(value));
        }}
        onPrefillClear={() => {
          setSelectedPrefill(null);
          setDialogSlice(null);
        }}
      />
      {dialogSlice ? (
        <dl data-testid="stop-snapshot">
          <dd data-testid="location-name">{dialogSlice.locationName ?? ""}</dd>
          <dd data-testid="street">{dialogSlice.street ?? ""}</dd>
          <dd data-testid="address-id">{dialogSlice.addressId ?? ""}</dd>
        </dl>
      ) : null}
    </div>
  );
}

describe("location-field smoke (ADR-0092 F6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLocationSearchMock.mockImplementation(() => catalogSearchResult);
    // cmdk desplaza el item activo; jsdom no implementa scrollIntoView.
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("LocationField: catálogo interno → Card + slice SAT", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <LocationFieldHarness />
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("combobox"));
    await user.type(
      screen.getByPlaceholderText(LOCATION_FIELD_COPY.searchPlaceholder),
      "apodaca",
    );

    await waitFor(() => {
      expect(screen.getByText("Bodega Apodaca")).toBeInTheDocument();
    });
    await user.click(screen.getByText("Bodega Apodaca"));

    await waitFor(() => {
      expect(screen.getByTestId("location-card")).toBeInTheDocument();
    });
    expect(screen.getByText(LOCATION_FIELD_COPY.change)).toBeInTheDocument();
    expect(screen.getByTestId("sat-location-name")).toHaveTextContent(
      "Bodega Apodaca",
    );
    expect(screen.getByTestId("sat-street")).toHaveTextContent("Av Industria");
    expect(screen.getByTestId("sat-postal")).toHaveTextContent("66600");
  });

  it("viaje: LocationField en origen precarga snapshot sin FK", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TripStopLocationHarness />
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("combobox"));
    await user.type(
      screen.getByPlaceholderText(/nombre, calle o código postal/i),
      "apodaca",
    );

    await waitFor(() => {
      expect(screen.getByText("Bodega Apodaca")).toBeInTheDocument();
    });
    await user.click(screen.getByText("Bodega Apodaca"));

    await waitFor(() => {
      expect(screen.getByTestId("stop-snapshot")).toBeInTheDocument();
    });
    expect(screen.getByTestId("location-name")).toHaveTextContent(
      "Bodega Apodaca",
    );
    expect(screen.getByTestId("street")).toHaveTextContent("Av Industria");
    expect(screen.getByTestId("address-id")).toHaveTextContent("");
  });

  it("Mapbox → Sheet CONFIRMAR (sin onChange al padre)", async () => {
    useLocationSearchMock.mockImplementation(() => ({
      results: [
        {
          id: "mapbox:place.mapbox.1",
          source: "mapbox" as const,
          label: mapboxCandidate.label,
          mapbox: mapboxCandidate,
        },
      ],
      isLoading: false,
      isFetching: false,
      internalError: null,
      mapboxError: null,
    }));

    const onChangeSpy = vi.fn();
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <LocationFieldHarness onChangeSpy={onChangeSpy} />
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("combobox"));
    await waitFor(() => {
      expect(screen.getByText(mapboxCandidate.label)).toBeInTheDocument();
    });
    await user.click(screen.getByText(mapboxCandidate.label));

    await waitFor(() => {
      expect(screen.getByTestId("location-sheet-open")).toBeInTheDocument();
    });
    expect(onChangeSpy).not.toHaveBeenCalled();
    expect(screen.queryByTestId("sat-slice")).not.toBeInTheDocument();
  });
});
