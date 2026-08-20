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

const branchItem: AddressSearchListItem = {
  ...clientItem,
  id: "33333333-3333-4333-8333-333333333333",
  ownerType: "branch",
  ownerId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  ownerLabel: "SUC-01",
  locationName: "CEDIS Norte",
  addressType: "branch",
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
    // cmdk desplaza el item activo; jsdom no implementa scrollIntoView.
    Element.prototype.scrollIntoView = vi.fn();
    vi.clearAllMocks();
    vi.mocked(addressSearchApi.searchAddresses).mockResolvedValue({
      data: [clientItem, branchItem, tenantItem],
      pagination: { limit: 50, nextCursor: null, hasMore: false },
    });
  });

  it("browses all addresses when opened without typing", async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole("combobox"));

    await waitFor(() => {
      expect(addressSearchApi.searchAddresses).toHaveBeenCalledWith(
        expect.objectContaining({
          q: undefined,
          limit: 50,
        }),
      );
      expect(screen.getByText("Cliente")).toBeInTheDocument();
      expect(screen.getByText("Sucursal")).toBeInTheDocument();
      expect(screen.getByText("Directorio")).toBeInTheDocument();
      expect(screen.getByText("CEDIS Norte")).toBeInTheDocument();
    });
  });

  it("filters when the user types 2+ characters", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderPicker(onSelect);

    await user.click(screen.getByRole("combobox"));
    await waitFor(() => {
      expect(screen.getByText("Bodega Alpha")).toBeInTheDocument();
    });

    await user.type(
      screen.getByPlaceholderText(/buscar por nombre/i),
      "bodega",
    );

    await waitFor(() => {
      expect(addressSearchApi.searchAddresses).toHaveBeenCalledWith(
        expect.objectContaining({
          q: "bodega",
        }),
      );
    });

    expect(screen.getAllByText("Domicilio CP").length).toBeGreaterThan(0);
    await user.click(screen.getByText("Bodega Alpha"));

    expect(onSelect).toHaveBeenCalledWith(clientItem);
  });

  it("keeps listing addresses when reopened with a warm cache", async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole("combobox"));
    await waitFor(() => {
      expect(screen.getByText("CEDIS Norte")).toBeInTheDocument();
    });

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByText("CEDIS Norte")).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("combobox"));

    await waitFor(() => {
      expect(screen.getByText("CEDIS Norte")).toBeInTheDocument();
    });
    expect(
      screen.queryByText(/no hay lugares reutilizables/i),
    ).not.toBeInTheDocument();
  });

  it("hides client billing when filterItem is provided", async () => {
    const user = userEvent.setup();
    const billingItem: AddressSearchListItem = {
      ...clientItem,
      id: "44444444-4444-4444-8444-444444444444",
      addressType: "billing",
      locationName: "Fiscal Alpha",
    };
    vi.mocked(addressSearchApi.searchAddresses).mockResolvedValue({
      data: [clientItem, billingItem, tenantItem],
      pagination: { limit: 50, nextCursor: null, hasMore: false },
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <AddressPicker
          onSelect={vi.fn()}
          filterItem={(item) =>
            item.ownerType !== "client" || item.addressType !== "billing"
          }
        />
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("combobox"));

    await waitFor(() => {
      expect(screen.getByText("Bodega Alpha")).toBeInTheDocument();
    });
    expect(screen.queryByText("Fiscal Alpha")).not.toBeInTheDocument();
    expect(screen.getByText("Bodega Beta")).toBeInTheDocument();
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
      pagination: { limit: 50, nextCursor: null, hasMore: false },
    });

    renderPicker();

    await user.click(screen.getByRole("combobox"));

    await waitFor(() => {
      expect(screen.getByText("RFC")).toBeInTheDocument();
      expect(screen.getByText("Sin RFC")).toBeInTheDocument();
    });
  });
});
