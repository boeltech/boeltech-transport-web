/**
 * Smoke WS-ADDR-PRELOAD — precarga de parada desde partner (ADR-0053 Fase 3).
 * Mock de GET /addresses/search; no requiere backend ni Playwright.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import * as addressSearchApi from "@shared/ui/address-picker/addressSearchApi";
import type { AddressSearchListItem } from "@shared/ui/address-picker/types";
import { StopFormSheetAddressOriginSection } from "@features/trips/presentation/pages/create/components/stop-form/StopFormSheetAddressOriginSection";
import {
  addressSearchItemToDialogSlice,
  type StopDialogFormValues,
} from "@features/trips/presentation/pages/create/components/stopDialogAddressMapper";

vi.mock("@shared/ui/address-picker/addressSearchApi", () => ({
  searchAddresses: vi.fn(),
}));

const partnerItem: AddressSearchListItem = {
  id: "22222222-2222-4222-8222-222222222222",
  ownerType: "tenant",
  ownerId: "pppppppp-pppp-4ppp-8ppp-pppppppppppp",
  ownerLabel: "Transportes Norte SA",
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

function TripStopPrefillHarness() {
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
        onPrefillClear={() => {
          setSelectedPrefill(null);
          setDialogSlice(null);
        }}
      />
      {dialogSlice ? (
        <dl data-testid="stop-snapshot">
          <dd data-testid="address-id">{dialogSlice.addressId ?? ""}</dd>
          <dd data-testid="client-address-id">
            {dialogSlice.clientAddressId ?? ""}
          </dd>
          <dd data-testid="location-name">{dialogSlice.locationName ?? ""}</dd>
          <dd data-testid="street">{dialogSlice.street ?? ""}</dd>
          <dd data-testid="latitude">{String(dialogSlice.latitude ?? "")}</dd>
        </dl>
      ) : null}
    </div>
  );
}

const branchItem: AddressSearchListItem = {
  id: "33333333-3333-4333-8333-333333333333",
  ownerType: "branch",
  ownerId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  ownerLabel: "SUC-N",
  addressType: "branch",
  locationName: "CEDIS Norte",
  street: "Av Sucursal",
  exteriorNumber: "50",
  postalCode: "64000",
  satStateCode: "19",
  satMunicipalityCode: "006",
  neighborhoodName: null,
  satNeighborhoodCode: null,
  latitude: 25.7,
  longitude: -100.3,
  geolocationPending: false,
  isPrimary: true,
  isActive: true,
  isCartaPorteReady: true,
};

describe("address-picker trip stop smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(addressSearchApi.searchAddresses).mockResolvedValue({
      data: [partnerItem],
      pagination: { limit: 20, nextCursor: null, hasMore: false },
    });
  });

  it("precarga partner como snapshot sin FK al catálogo", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TripStopPrefillHarness />
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

    expect(screen.getByTestId("address-id")).toHaveTextContent("");
    expect(screen.getByTestId("client-address-id")).toHaveTextContent("");
    expect(screen.getByTestId("location-name")).toHaveTextContent("Bodega Apodaca");
    expect(screen.getByTestId("street")).toHaveTextContent("Av Industria");
    expect(screen.getByTestId("latitude")).toHaveTextContent("25.78");
  });

  it("precarga sucursal como snapshot sin clientId", async () => {
    const user = userEvent.setup();
    vi.mocked(addressSearchApi.searchAddresses).mockResolvedValue({
      data: [branchItem],
      pagination: { limit: 20, nextCursor: null, hasMore: false },
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TripStopPrefillHarness />
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("combobox"));
    await user.type(
      screen.getByPlaceholderText(/nombre, calle o código postal/i),
      "cedis",
    );

    await waitFor(() => {
      expect(screen.getByText("CEDIS Norte")).toBeInTheDocument();
    });

    await user.click(screen.getByText("CEDIS Norte"));

    await waitFor(() => {
      expect(screen.getByTestId("stop-snapshot")).toBeInTheDocument();
    });

    expect(screen.getByTestId("address-id")).toHaveTextContent("");
    expect(screen.getByTestId("client-address-id")).toHaveTextContent("");
    expect(screen.getByTestId("location-name")).toHaveTextContent("CEDIS Norte");
  });
});
