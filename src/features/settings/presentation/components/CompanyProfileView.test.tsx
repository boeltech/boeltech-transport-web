import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ClientAddress } from "@features/clients/domain";

import { CompanyProfileView } from "./CompanyProfileView";
import { generalSettingsCopy } from "../copy/generalSettingsCopy";
import type { CompanySettings } from "../../domain";

vi.mock("@features/catalogs/application/hooks/useRegimenFiscalLabel", () => ({
  useRegimenFiscalLabel: () => ({
    label: "General de ley personas morales",
    isLoading: false,
    isError: false,
  }),
}));

vi.mock(
  "@features/clients/presentation/hooks/useClientAddressLocationLabels",
  () => ({
    useClientAddressLocationLabels: () => ({
      isLoading: false,
      stateLabel: "Ciudad de México",
      municipalityLabel: "Benito Juárez",
    }),
    resolveAddressCatalogLabel: () => null,
  }),
);

const fiscalAddress = {
  id: "addr-1",
  street: "Av. Insurgentes Sur",
  exteriorNumber: "1234",
  interiorNumber: null,
  reference: null,
  postalCode: "03100",
  neighborhoodName: "Del Valle",
  satStateCode: "CMX",
  satMunicipalityCode: "014",
  satCountryCode: "MEX",
  locationName: "Domicilio fiscal",
} as unknown as ClientAddress;

const settings: CompanySettings = {
  id: "company-1",
  tenantId: "tenant-1",
  legalName: "Transportes ABC S.A. de C.V.",
  tradeName: "Transportes ABC",
  rfc: "TAB123456XYZ",
  regimenFiscal: "601",
  regimenFiscalDescripcion: null,
  email: "contacto@transportesabc.com",
  phone: "5512345678",
  website: null,
  logoUrl: null,
  fiscalAddress,
  legacyCompanyAddress: null,
  lugarExpedicion: "03100",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

function renderView(canEdit: boolean, override?: Partial<CompanySettings>) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <CompanyProfileView
        settings={{ ...settings, ...override }}
        logoSrc={null}
        canEdit={canEdit}
      />
    </QueryClientProvider>,
  );
}

describe("CompanyProfileView", () => {
  it("con solo lectura muestra los datos fiscales y oculta la edición", () => {
    renderView(false);

    expect(screen.getByText(settings.rfc)).toBeInTheDocument();
    expect(
      screen.getByText("General de ley personas morales"),
    ).toBeInTheDocument();
    expect(screen.getByText("Av. Insurgentes Sur 1234")).toBeInTheDocument();
    expect(screen.getByText("Ciudad de México")).toBeInTheDocument();

    expect(
      screen.getByText(generalSettingsCopy.state.readOnlyTitle),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: generalSettingsCopy.identity.editAction,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: generalSettingsCopy.address.editAction,
      }),
    ).not.toBeInTheDocument();
  });

  it("con permiso de edición ofrece un botón por bloque", () => {
    renderView(true);

    expect(
      screen.getByRole("button", {
        name: generalSettingsCopy.identity.editAction,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: generalSettingsCopy.address.editAction,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: generalSettingsCopy.contact.editAction,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(generalSettingsCopy.state.readOnlyTitle),
    ).not.toBeInTheDocument();
  });

  it("señala cuando se factura desde un código postal distinto al domicilio", () => {
    renderView(false, { lugarExpedicion: "64000" });

    expect(
      screen.getByText(
        `CP 64000 · ${generalSettingsCopy.address.issuedFromDifferent}`,
      ),
    ).toBeInTheDocument();
  });
});
