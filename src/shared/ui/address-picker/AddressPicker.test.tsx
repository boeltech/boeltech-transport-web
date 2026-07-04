import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AddressPicker } from "./AddressPicker";
import * as addressSearchApi from "./addressSearchApi";
import type { AddressSearchListItem } from "./types";

vi.mock("./addressSearchApi", () => ({
  searchAddresses: vi.fn(),
}));

const clientItem: AddressSearchListItem = {
  id: "11111111-1111-4111-8111-111111111111",
  ownerType: "client",
  ownerId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  ownerLabel: "Cliente Alpha",
  addressType: "shipping",
  locationName: "Bodega Alpha",
  street: "Av Cliente",
  exteriorNumber: "1",
  postalCode: "44100",
  satStateCode: "JAL",
  satMunicipalityCode: "039",
  neighborhoodName: null,
  satNeighborhoodCode: null,
  latitude: null,
  longitude: null,
  geolocationPending: false,
  isPrimary: false,
  isActive: true,
  isCartaPorteReady: true,
};

const tenantItem: AddressSearchListItem = {
  ...clientItem,
  id: "22222222-2222-4222-8222-222222222222",
  ownerType: "tenant",
  ownerLabel: "Mi empresa",
  locationName: "Bodega Beta",
  addressType: "warehouse",
  isCartaPorteReady: false,
};

function renderPicker(onSelect = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AddressPicker onSelect={onSelect} />
    </QueryClientProvider>,
  );
}

describe("AddressPicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(addressSearchApi.searchAddresses).mockResolvedValue({
      data: [clientItem, tenantItem],
      pagination: { limit: 20, nextCursor: null, hasMore: false },
    });
  });

  it("shows hint when query is shorter than 2 characters", async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole("combobox"));
    await user.type(screen.getByPlaceholderText(/buscar dirección/i), "a");

    expect(screen.getByText(/al menos 2 caracteres/i)).toBeInTheDocument();
    expect(addressSearchApi.searchAddresses).not.toHaveBeenCalled();
  });

  it("groups results and calls onSelect", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderPicker(onSelect);

    await user.click(screen.getByRole("combobox"));
    await user.type(screen.getByPlaceholderText(/buscar dirección/i), "bodega");

    await waitFor(() => {
      expect(screen.getByText("Cliente")).toBeInTheDocument();
      expect(screen.getByText("Directorio")).toBeInTheDocument();
    });

    expect(screen.getByText("Domicilio CP")).toBeInTheDocument();
    await user.click(screen.getByText("Bodega Alpha"));

    expect(onSelect).toHaveBeenCalledWith(clientItem);
  });

  it("shows RFC and Sin RFC badges based on remitente metadata", async () => {
    const user = userEvent.setup();
    vi.mocked(addressSearchApi.searchAddresses).mockResolvedValue({
      data: [
        {
          ...clientItem,
          remitenteRfc: "AAA010101AAA",
          remitenteName: "Cliente Alpha SA",
        },
        {
          ...tenantItem,
          isCartaPorteReady: true,
        },
      ],
      pagination: { limit: 20, nextCursor: null, hasMore: false },
    });

    renderPicker();

    await user.click(screen.getByRole("combobox"));
    await user.type(screen.getByPlaceholderText(/buscar dirección/i), "bodega");

    await waitFor(() => {
      expect(screen.getByText("RFC")).toBeInTheDocument();
      expect(screen.getByText("Sin RFC")).toBeInTheDocument();
    });
  });
});
