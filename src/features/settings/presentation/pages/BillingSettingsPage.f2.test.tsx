import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
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

vi.mock("@shared/ui/page-shells", () => ({
  SettingsPageShell: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("../components/BillingReadinessCard", () => ({
  BillingReadinessCard: () => <div>readiness</div>,
  BILLING_ANCHORS: { certificate: "sello", numbering: "folio" },
}));

vi.mock("../components/BillingCertificateCard", () => ({
  BillingCertificateCard: () => <div>csd</div>,
}));

vi.mock("../components/BillingNumberingCard", () => ({
  BillingNumberingCard: () => <div>numeracion</div>,
}));

vi.mock("../components/BillingDefaultsCard", () => ({
  BillingDefaultsCard: () => <div>defaults</div>,
}));

vi.mock("../components/BillingStampingCard", () => ({
  BillingStampingCard: () => <div>stamping</div>,
}));

vi.mock("../components/BillingServiceConceptsCard", () => ({
  BillingServiceConceptsCard: () => <div>service-concepts</div>,
}));

// Data router required: useUnsavedChangesGuard → useBlocker.
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

describe("BillingSettingsPage F2 (D8–D10)", () => {
  beforeEach(() => {
    window.localStorage.removeItem(ADMIN_BILLING_ORIENTATION_STORAGE_KEY);
    mockHasPermission.mockReturnValue(true);
    mockHasRole.mockImplementation((role: string) => role === "admin");
  });

  it("monta FormSticky sticky, Guardar disabled sin dirty, sin LongForm; stamping y conceptos fuera del form", () => {
    const { container } = renderPage();
    const form = container.querySelector("form");

    expect(form).not.toBeNull();
    expect(container.querySelector(".sticky.bottom-0")).not.toBeNull();
    expect(
      screen.queryByRole("navigation", { name: /secciones/i }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: billingSettingsCopy.action.cancel }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: billingSettingsCopy.action.save }),
    ).toBeDisabled();

    expect(screen.getByText("defaults")).toBeInTheDocument();
    expect(screen.getByText("stamping")).toBeInTheDocument();
    expect(screen.getByText("service-concepts")).toBeInTheDocument();
    expect(form?.textContent).toContain("defaults");
    expect(form?.textContent).not.toContain("stamping");
    expect(form?.textContent).not.toContain("service-concepts");

    expect(
      screen.getByText(billingSettingsCopy.adminOrientation.title),
    ).toBeInTheDocument();
  });
});
