import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { billingSettingsCopy } from "../copy/billingSettingsCopy";
import { ADMIN_BILLING_ORIENTATION_STORAGE_KEY } from "../components/AdminBillingOrientationAlert";
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

vi.mock("../components/SettingsLayout", () => ({
  SettingsLayout: ({ children }: { children: unknown }) => <div>{children}</div>,
}));

vi.mock("../components/BillingReadinessCard", () => ({
  BillingReadinessCard: () => <div>readiness</div>,
  BILLING_ANCHORS: { certificate: "sello", numbering: "folio" },
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

vi.mock("../components/BillingStampingCard", () => ({
  BillingStampingCard: () => null,
}));

vi.mock("../components/BillingServiceConceptsCard", () => ({
  BillingServiceConceptsCard: () => null,
}));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <BillingSettingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("BillingSettingsPage — orientación admin", () => {
  beforeEach(() => {
    window.localStorage.removeItem(ADMIN_BILLING_ORIENTATION_STORAGE_KEY);
    mockHasPermission.mockReturnValue(true);
    mockHasRole.mockImplementation((role: string) => role === "admin");
  });

  it("admin ve L1b y conserva CSD, no aviso restringido", () => {
    renderPage();

    expect(
      screen.getByText(billingSettingsCopy.adminOrientation.title),
    ).toBeInTheDocument();
    expect(screen.getByText("csd")).toBeInTheDocument();
    expect(screen.getByText("numeracion")).toBeInTheDocument();
    expect(screen.getByText("readiness")).toBeInTheDocument();
    expect(
      screen.queryByText(billingSettingsCopy.certificate.restrictedTitle),
    ).not.toBeInTheDocument();
  });

  it("manager no ve L1b; ve aviso CSD restringido", () => {
    mockHasRole.mockReturnValue(false);
    renderPage();

    expect(
      screen.queryByText(billingSettingsCopy.adminOrientation.title),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(billingSettingsCopy.certificate.restrictedTitle),
    ).toBeInTheDocument();
  });
});
