import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { billingSettingsCopy } from "../copy/billingSettingsCopy";
import { BillingSettingsPage } from "./BillingSettingsPage";

const { mockHasPermission, mockHasRole } = vi.hoisted(() => ({
  mockHasPermission: vi.fn(() => true),
  mockHasRole: vi.fn((role: string) => role === "admin"),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: mockHasPermission,
    hasRole: mockHasRole,
  }),
}));

vi.mock("../../application/hooks", () => ({
  useBillingSettings: () => ({
    data: {
      id: "bill-1",
      tenantId: "tenant-1",
      pacProvider: "profact",
      pacUsername: "",
      pacPasswordConfigured: false,
      certificateConfigured: false,
      certificateExpiry: null,
      defaultUsoCfdi: "G03",
      defaultFormaPago: "03",
      defaultMetodoPago: "PUE",
      serieFactura: "A",
      folioInicial: 1,
      testMode: true,
      claveProductoServicio: "78101800",
      claveUnidad: "E48",
      moneda: "MXN",
      tasaIva: 0.16,
      nextFolio: 1,
      hasIssuedInvoices: false,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useCompanySettings: () => ({
    data: {
      legalName: "Transportes ABC",
      rfc: "TAB123456XYZ",
      regimenFiscal: "601",
      lugarExpedicion: "03100",
      fiscalAddress: { postalCode: "03100" },
    },
    isSuccess: true,
  }),
  useUpdateBillingSettings: () => ({ mutate: vi.fn(), isPending: false }),
  useTestPacConnection: () => ({
    mutate: vi.fn(),
    isPending: false,
    data: undefined,
  }),
  useRegisterPacEmitter: () => ({
    mutate: vi.fn(),
    isPending: false,
    data: undefined,
  }),
  useUploadCertificate: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@shared/ui/page-shells", () => ({
  SettingsPageShell: ({
    children,
  }: {
    children: import("react").ReactNode;
  }) => <div>{children}</div>,
}));

vi.mock("../components/BillingReadinessCard", () => ({
  BillingReadinessCard: ({
    certificateUploadRestricted,
  }: {
    certificateUploadRestricted?: boolean;
  }) => (
    <div>
      readiness
      {certificateUploadRestricted ? (
        <span>{billingSettingsCopy.readiness.certificate.adminOnly}</span>
      ) : null}
    </div>
  ),
  BILLING_ANCHORS: {
    certificate: "sello",
    numbering: "folio",
    diagnostics: "diag",
  },
}));

vi.mock("../components/BillingCertificateCard", () => ({
  BillingCertificateCard: ({
    showRestrictionNotice,
  }: {
    showRestrictionNotice: boolean;
  }) =>
    showRestrictionNotice ? (
      <div>Solo el administrador puede cargar el sello</div>
    ) : (
      <div>csd</div>
    ),
}));

vi.mock("../components/BillingNumberingCard", () => ({
  BillingNumberingCard: () => <div>numeracion</div>,
}));

vi.mock("../components/BillingDefaultsCard", () => ({
  BillingDefaultsCard: () => null,
}));

vi.mock("../components/BillingServiceConceptsCard", () => ({
  BillingServiceConceptsCard: () => null,
}));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      {
        path: "/settings/billing",
        element: (
          <QueryClientProvider client={client}>
            <BillingSettingsPage />
          </QueryClientProvider>
        ),
      },
    ],
    { initialEntries: ["/settings/billing"] },
  );
  return render(<RouterProvider router={router} />);
}

describe("BillingSettingsPage — roles y readiness", () => {
  beforeEach(() => {
    mockHasPermission.mockReturnValue(true);
    mockHasRole.mockImplementation((role: string) => role === "admin");
  });

  it("admin ve readiness y CSD, no aviso restringido", () => {
    renderPage();

    expect(screen.getByText("readiness")).toBeInTheDocument();
    expect(screen.getByText("csd")).toBeInTheDocument();
    expect(screen.getByText("numeracion")).toBeInTheDocument();
    expect(
      screen.queryByText(billingSettingsCopy.certificate.restrictedTitle),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(billingSettingsCopy.readiness.certificate.adminOnly),
    ).not.toBeInTheDocument();
  });

  it("manager ve aviso CSD restringido en card y en readiness", () => {
    mockHasRole.mockReturnValue(false);
    renderPage();

    expect(
      screen.getByText(billingSettingsCopy.certificate.restrictedTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(billingSettingsCopy.readiness.certificate.adminOnly),
    ).toBeInTheDocument();
  });
});
