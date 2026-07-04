import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import * as addressSearchApi from "@shared/ui/address-picker/addressSearchApi";
import type { AddressSearchListItem } from "@shared/ui/address-picker/types";

import { StopFormSheetAddressOriginSection } from "./StopFormSheetAddressOriginSection";

vi.mock("@shared/ui/address-picker/addressSearchApi", () => ({
  searchAddresses: vi.fn(),
}));

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
  geolocationPending: false,
  isPrimary: false,
  isActive: true,
  isCartaPorteReady: true,
};

function renderSection(onPrefillSelect = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <StopFormSheetAddressOriginSection
        selectedPrefill={null}
        onPrefillSelect={onPrefillSelect}
        onPrefillClear={vi.fn()}
      />
    </QueryClientProvider>,
  );
}

describe("StopFormSheetAddressOriginSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(addressSearchApi.searchAddresses).mockResolvedValue({
      data: [partnerItem],
      pagination: { limit: 20, nextCursor: null, hasMore: false },
    });
  });

  it("renderiza AddressPicker con copy de origen", () => {
    renderSection();

    expect(screen.getByText("Origen de la dirección")).toBeInTheDocument();
    expect(screen.getByText("Buscar dirección existente")).toBeInTheDocument();
  });

  it("propaga selección de partner al callback", async () => {
    const user = userEvent.setup();
    const onPrefillSelect = vi.fn();
    renderSection(onPrefillSelect);

    await user.click(screen.getByRole("combobox"));
    await user.type(
      screen.getByPlaceholderText(/nombre, calle o código postal/i),
      "apodaca",
    );

    await waitFor(() => {
      expect(screen.getByText("Bodega Apodaca")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Bodega Apodaca"));

    expect(onPrefillSelect).toHaveBeenCalledWith(partnerItem);
  });
});
