import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { AddressSearchListItem } from "@shared/ui/address-picker/types";
import { LOCATION_FIELD_COPY } from "@shared/ui/location";

import { StopFormSheetAddressOriginSection } from "./StopFormSheetAddressOriginSection";

const partnerItem: AddressSearchListItem = {
  id: "22222222-2222-4222-8222-222222222222",
  ownerType: "tenant",
  ownerId: "pppppppp-pppp-4ppp-8ppp-pppppppppppp",
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
  geocodingAccuracy: null,
  geolocationPending: false,
  isPrimary: false,
  isActive: true,
  isCartaPorteReady: true,
};

vi.mock("@shared/ui/location/useLocationSearch", () => ({
  useLocationSearch: () => ({
    results: [
      {
        id: `internal:${partnerItem.id}`,
        source: "internal",
        label: "Bodega Apodaca",
        description: "Transportes Norte",
        internal: partnerItem,
      },
      {
        id: "__location_create__",
        source: "create",
        label: LOCATION_FIELD_COPY.createNew,
      },
    ],
    isLoading: false,
    isFetching: false,
    internalError: null,
    mapboxError: null,
  }),
  MAPBOX_MIN_QUERY_LENGTH: 3,
}));

vi.mock("@shared/ui/location/LocationSheet", () => ({
  LocationSheet: () => null,
}));

vi.mock("@shared/geolocation/addressResolver", () => ({
  resolveMapboxToSat: vi.fn(async () => ({
    resolved: {},
    confidence: "high",
    ambiguities: [],
    mapboxLabel: "",
  })),
}));

function renderSection(
  onPrefillSelect = vi.fn(),
  onLocationDraft = vi.fn(),
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <StopFormSheetAddressOriginSection
        selectedPrefill={null}
        onPrefillSelect={onPrefillSelect}
        onLocationDraft={onLocationDraft}
        onPrefillClear={vi.fn()}
      />
    </QueryClientProvider>,
  );
}

describe("StopFormSheetAddressOriginSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // cmdk desplaza el item activo; jsdom no implementa scrollIntoView.
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("renderiza LocationField con copy de origen", () => {
    renderSection();

    expect(screen.getByText("Dirección guardada")).toBeInTheDocument();
    expect(screen.getByText("Buscar ubicación")).toBeInTheDocument();
    expect(
      screen.getByRole("combobox"),
    ).toHaveTextContent("Nombre, calle o código postal…");
  });

  it("propaga selección de partner al callback", async () => {
    const user = userEvent.setup();
    const onPrefillSelect = vi.fn();
    renderSection(onPrefillSelect);

    await user.click(screen.getByRole("combobox"));

    await waitFor(() => {
      expect(screen.getByText("Bodega Apodaca")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Bodega Apodaca"));

    expect(onPrefillSelect).toHaveBeenCalledWith(partnerItem);
  });
});
