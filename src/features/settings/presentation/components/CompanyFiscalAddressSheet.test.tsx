import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { CompanySettings } from "../../domain";
import { CompanyFiscalAddressSheet } from "./CompanyFiscalAddressSheet";
import { generalSettingsCopy } from "../copy/generalSettingsCopy";

vi.mock("../../application/hooks", () => ({
  useUpdateCompanySettings: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@shared/ui/address-input", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/ui/address-input")>();
  return {
    ...actual,
    AddressInput: () => <div data-testid="address-input-stub" />,
  };
});

vi.mock("@shared/ui/location", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/ui/location")>();
  return {
    ...actual,
    LocationField: ({
      label,
      context,
      existingAddresses,
      includeInternal,
    }: {
      label?: string;
      context: string;
      existingAddresses?: unknown;
      includeInternal?: boolean;
    }) => (
      <div
        data-testid="location-field-stub"
        data-context={context}
        data-has-existing={
          Array.isArray(existingAddresses) && existingAddresses.length > 0
            ? "1"
            : "0"
        }
        data-include-internal={includeInternal === false ? "0" : "1"}
      >
        {label}
      </div>
    ),
  };
});

const settings: CompanySettings = {
  id: "company-1",
  tenantId: "tenant-1",
  legalName: "Demo SA",
  tradeName: "Demo",
  rfc: "AAA010101AAA",
  regimenFiscal: "601",
  regimenFiscalDescripcion: null,
  email: null,
  phone: null,
  website: null,
  logoUrl: null,
  lugarExpedicion: "06600",
  fiscalAddress: null,
  legacyCompanyAddress: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

describe("CompanyFiscalAddressSheet LocationField (ADR-0092 F5)", () => {
  it("renders LocationField with fiscal context above AddressInput", () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <CompanyFiscalAddressSheet
          open
          onOpenChange={vi.fn()}
          settings={settings}
        />
      </QueryClientProvider>,
    );

    const field = screen.getByTestId("location-field-stub");
    expect(field).toHaveAttribute("data-context", "fiscal");
    expect(field).toHaveTextContent(
      generalSettingsCopy.address.locationSearchLabel,
    );
    expect(field).toHaveAttribute("data-include-internal", "0");
    expect(screen.getByTestId("address-input-stub")).toBeInTheDocument();
  });

  it("passes existingAddresses when company already has fiscalAddress", () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <CompanyFiscalAddressSheet
          open
          onOpenChange={vi.fn()}
          settings={{
            ...settings,
            fiscalAddress: {
              id: "fiscal-1",
              tenantId: "tenant-1",
              clientId: "tenant-1",
              addressType: "company",
              isPrimary: true,
              isActive: true,
              street: "Av Reforma",
              exteriorNumber: "100",
              postalCode: "06600",
              latitude: 19.43,
              longitude: -99.13,
              createdAt: "2026-01-01T00:00:00Z",
              updatedAt: "2026-01-01T00:00:00Z",
            },
          }}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId("location-field-stub")).toHaveAttribute(
      "data-has-existing",
      "1",
    );
  });
});
