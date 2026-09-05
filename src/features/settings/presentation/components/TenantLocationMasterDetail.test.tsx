import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {
  ClientAddress,
  ClientAddressListItem,
} from "@features/clients/domain";

import { TenantLocationMasterDetail } from "./TenantLocationMasterDetail";
import { tenantLocationsCopy } from "../copy/tenantLocationsCopy";

const locationId = "loc-1";

const listItem: ClientAddressListItem = {
  id: locationId,
  addressType: "warehouse",
  isPrimary: false,
  isActive: true,
  locationName: "Almacén Tecnológico de Monterrey",
  postalCode: "01389",
  satStateCode: "CMX",
};

const detail: ClientAddress = {
  id: locationId,
  tenantId: "tenant-1",
  clientId: "",
  addressType: "warehouse",
  isPrimary: false,
  isActive: true,
  locationName: "Almacén Tecnológico de Monterrey, Santa Fé",
  street: "Av Carlos Lazo",
  exteriorNumber: "100",
  postalCode: "01389",
  satCountryCode: "MEX",
  satStateCode: "CMX",
  latitude: 19.359138,
  longitude: -99.260651,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

vi.mock("../../application/hooks/useTenantLocations", () => ({
  useTenantLocations: () => ({
    data: [listItem],
    isLoading: false,
  }),
  useTenantLocation: (id: string | undefined) => ({
    data: id === locationId ? detail : undefined,
    isLoading: false,
  }),
  useCreateTenantLocation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateTenantLocation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteTenantLocation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock(
  "@features/clients/presentation/hooks/useClientAddressLocationLabels",
  () => ({
    useClientAddressLocationLabels: () => ({
      isLoading: false,
      stateLabel: "Ciudad de México",
      municipalityLabel: null,
    }),
    resolveAddressCatalogLabel: () => null,
  }),
);

vi.mock("@features/clients/presentation/components/ClientAddressForm", () => ({
  ClientAddressForm: ({
    locationOwnerTypes,
  }: {
    locationOwnerTypes?: string[];
  }) => (
    <div
      data-testid="tenant-location-form"
      data-owner-types={(locationOwnerTypes ?? []).join(",")}
    />
  ),
}));

describe("TenantLocationMasterDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("abre edición de la primera ubicación sin click previo en la lista", async () => {
    const user = userEvent.setup();
    render(<TenantLocationMasterDetail />);

    expect(
      screen.getByText("Almacén Tecnológico de Monterrey, Santa Fé"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(tenantLocationsCopy.list.emptyTitle),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Editar/i }));

    expect(
      screen.getByText(tenantLocationsCopy.form.editTitle),
    ).toBeInTheDocument();
    expect(screen.getByTestId("tenant-location-form")).toBeInTheDocument();
    expect(screen.getByTestId("tenant-location-form")).toHaveAttribute(
      "data-owner-types",
      "tenant",
    );
    expect(
      screen.queryByText(tenantLocationsCopy.list.emptyTitle),
    ).not.toBeInTheDocument();
  });
});
