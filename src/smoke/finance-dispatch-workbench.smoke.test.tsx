/**
 * Smoke F5 — workbench unificado Envío de facturas (/finance/dispatch).
 * Mock de hooks; no requiere backend ni SMTP.
 * Cubre: Pendientes (tabla/empty), tabs Enviadas + Historial, redirects legacy,
 * sidebar un solo Envíos, copy sin send-invoices, link auto-fail.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  FINANCE_DISPATCH_HISTORY_HREF,
  FINANCE_DISPATCH_PENDING_HREF,
  resolveLegacyFinanceLocation,
} from "@features/finance/application/financeRoutes";
import { FinanceDispatchPage } from "@features/finance/presentation/pages/FinanceDispatchPage";
import {
  FinanceDispatchRunsLegacyRedirect,
  FinanceSendInvoicesLegacyRedirect,
} from "@features/finance/presentation/routes/FinanceDispatchLegacyRedirects";
import { dispatchRunsCopy } from "@features/finance/presentation/copy/dispatchRunsCopy";
import type { InvoiceListItem } from "@features/invoicing/domain";
import { invoicingCopy } from "@features/invoicing/presentation/copy/invoicingCopy";
import { navigationConfig } from "@widgets/sidebar/model/navigation";
import { navigationCopy } from "@widgets/sidebar/copy/navigationCopy";

const mockUseInvoices = vi.fn();
const mockUseBillingDispatchRuns = vi.fn();

vi.mock("@shared/permissions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/permissions")>();
  return {
    ...actual,
    usePermissions: () => ({
      hasPermission: () => true,
      isLoading: false,
      isAuthenticated: true,
      role: "admin",
      can: () => true,
      hasRole: () => true,
    }),
  };
});

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
    useQueryErrorToast: vi.fn(),
  };
});

/** Mock al path que consumen page + paneles (barrel + application). */
vi.mock("@features/invoicing/application/hooks/useInvoices", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@features/invoicing/application/hooks/useInvoices")
    >();
  return {
    ...actual,
    useInvoices: (...args: unknown[]) => mockUseInvoices(...args),
  };
});

vi.mock("@features/invoicing", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/invoicing")>();
  return {
    ...actual,
    useInvoices: (...args: unknown[]) => mockUseInvoices(...args),
    SendInvoiceDialog: () => null,
  };
});

vi.mock("@features/invoicing/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/invoicing/application")>();
  return {
    ...actual,
    useInvoices: (...args: unknown[]) => mockUseInvoices(...args),
    useInvoiceSendRecipients: () => ({
      data: null,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }),
    useSendInvoicesBatch: () => ({
      sendBatch: vi.fn(),
      isPending: false,
      progress: null,
    }),
  };
});

vi.mock("@features/finance/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/finance/application")>();
  return {
    ...actual,
    useBillingDispatchRuns: (...args: unknown[]) =>
      mockUseBillingDispatchRuns(...args),
    useCreateBillingDispatchRun: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
  };
});

vi.mock("@features/settings/application/hooks/useBillingSchemes", () => ({
  useBillingSchemes: () => ({
    data: [
      {
        id: "scheme-1",
        name: "Corte semanal",
        cadenceKind: "periodic_weekly",
        params: { weekdays: [4, 5] },
        isDefault: true,
        isActive: true,
      },
    ],
    isLoading: false,
  }),
}));

function buildInvoice(
  overrides: Partial<InvoiceListItem> = {},
): InvoiceListItem {
  return {
    id: "inv-1",
    tenantId: "t-1",
    serie: "A",
    folio: 45,
    cfdiUuid: null,
    receiverRfc: "XAXX010101000",
    receiverName: "Receptor Demo",
    clientId: "client-a",
    clientName: "Cliente A",
    issuedAt: "2026-09-18T12:00:00.000Z",
    paymentForm: "99",
    paymentMethod: "PPD",
    currency: "MXN",
    subtotal: 1000,
    totalTax: 160,
    total: 1160,
    status: "stamped",
    satCancellationStatus: "none",
    satCancellationMessage: null,
    stampedAt: "2026-09-18T12:00:00.000Z",
    dispatchSentAt: null,
    tripCount: 1,
    tripCodes: ["TRP-001"],
    totalPaid: 0,
    balanceDue: 1160,
    createdAt: "2026-09-18T10:00:00.000Z",
    createdByName: null,
    ...overrides,
  };
}

function emptyList() {
  return {
    data: [] as InvoiceListItem[],
    pagination: { page: 1, limit: 25, total: 0, totalPages: 0 },
  };
}

function invoicesQueryResult(list: ReturnType<typeof emptyList>) {
  return {
    data: list,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  };
}

function TestProviders({
  children,
  initialEntry = "/finance/dispatch",
}: {
  children: ReactNode;
  initialEntry?: string;
}) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/finance/dispatch" element={children} />
          <Route
            path="/finance/send-invoices"
            element={<FinanceSendInvoicesLegacyRedirect />}
          />
          <Route
            path="/finance/dispatch-runs"
            element={<FinanceDispatchRunsLegacyRedirect />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("finance-dispatch-workbench smoke (F5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseInvoices.mockImplementation(
      (params?: { emailDispatch?: string }) => {
        if (params?.emailDispatch === "unsent") {
          return invoicesQueryResult({
            data: [buildInvoice()],
            pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
          });
        }
        if (params?.emailDispatch === "sent") {
          return invoicesQueryResult({
            data: [
              buildInvoice({
                id: "inv-sent",
                folio: 99,
                dispatchSentAt: "2026-09-19T09:00:00.000Z",
              }),
            ],
            pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
          });
        }
        return invoicesQueryResult(emptyList());
      },
    );
    mockUseBillingDispatchRuns.mockReturnValue({
      data: {
        data: [],
        pagination: { page: 1, limit: 25, total: 0, totalPages: 0 },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    });
  });

  it("abre Pendientes con tabla de facturas no enviadas", () => {
    render(
      <TestProviders>
        <FinanceDispatchPage />
      </TestProviders>,
    );

    expect(
      screen.getByRole("heading", {
        name: dispatchRunsCopy.workbench.title,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(dispatchRunsCopy.workbench.description),
    ).toBeInTheDocument();
    expect(screen.getAllByText("A-45").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Receptor Demo").length).toBeGreaterThan(0);
  });

  it("muestra empty de Pendientes cuando la cola está vacía", () => {
    mockUseInvoices.mockImplementation(() =>
      invoicesQueryResult(emptyList()),
    );

    render(
      <TestProviders>
        <FinanceDispatchPage />
      </TestProviders>,
    );

    expect(
      screen.getByText(dispatchRunsCopy.workbench.pending.empty.title),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: dispatchRunsCopy.workbench.pending.empty.ctaSent,
      }),
    ).toBeInTheDocument();
  });

  it("cambia a Enviadas e Historial", async () => {
    const user = userEvent.setup();
    render(
      <TestProviders>
        <FinanceDispatchPage />
      </TestProviders>,
    );

    await user.click(
      screen.getByRole("tab", {
        name: new RegExp(dispatchRunsCopy.workbench.buckets.sent),
      }),
    );
    expect(screen.getAllByText("A-99").length).toBeGreaterThan(0);

    await user.click(
      screen.getByRole("tab", {
        name: new RegExp(dispatchRunsCopy.workbench.buckets.history),
      }),
    );
    expect(
      screen.getAllByRole("button", {
        name: dispatchRunsCopy.tab.executeCta,
      }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(dispatchRunsCopy.tab.empty.onboardingTitle),
    ).toBeInTheDocument();
  });

  it("onboarding del Historial apunta a pendientes del workbench (no send-invoices)", () => {
    mockUseInvoices.mockImplementation(() =>
      invoicesQueryResult(emptyList()),
    );

    render(
      <TestProviders initialEntry="/finance/dispatch?tab=history">
        <FinanceDispatchPage />
      </TestProviders>,
    );

    expect(
      screen.getByText(dispatchRunsCopy.tab.empty.onboardingTitle),
    ).toBeInTheDocument();

    const pendingLink = screen.getByRole("link", {
      name: dispatchRunsCopy.tab.empty.onboardingSteps[2]!.linkLabel,
    });
    expect(pendingLink).toHaveAttribute(
      "href",
      "/finance/dispatch?tab=pending",
    );
    expect(pendingLink.getAttribute("href")).not.toContain("send-invoices");
    expect(pendingLink.getAttribute("href")).not.toContain("dispatch-runs");

    expect(dispatchRunsCopy.tab.sendWizardHref).toBe(
      "/finance/dispatch?tab=pending",
    );
    expect(dispatchRunsCopy.workbench.title).toBe("Envío de facturas");
    expect(navigationCopy.item.financeDispatch).toBe("Envíos");
  });

  it("legacy redirects llevan al workbench (Pendientes / Historial)", () => {
    const { unmount } = render(
      <TestProviders initialEntry="/finance/send-invoices">
        <FinanceDispatchPage />
      </TestProviders>,
    );
    expect(
      screen.getByRole("heading", {
        name: dispatchRunsCopy.workbench.title,
      }),
    ).toBeInTheDocument();
    unmount();

    render(
      <TestProviders initialEntry="/finance/dispatch-runs">
        <FinanceDispatchPage />
      </TestProviders>,
    );
    expect(
      screen.getAllByRole("button", {
        name: dispatchRunsCopy.tab.executeCta,
      }).length,
    ).toBeGreaterThan(0);

    expect(FINANCE_DISPATCH_PENDING_HREF).toBe(
      "/finance/dispatch?tab=pending",
    );
    expect(FINANCE_DISPATCH_HISTORY_HREF).toBe(
      "/finance/dispatch?tab=history",
    );
    expect(resolveLegacyFinanceLocation("?tab=dispatch-runs")).toBe(
      "/finance/dispatch?tab=history",
    );
  });

  it("sidebar Facturación tiene un solo ítem Envíos", () => {
    const billing = navigationConfig.find((group) => group.id === "billing");
    const dispatchItems =
      billing?.items.filter(
        (item) =>
          item.id.includes("dispatch") || item.id.includes("send-invoice"),
      ) ?? [];

    expect(dispatchItems.map((item) => item.id)).toEqual(["finance-dispatch"]);
    expect(dispatchItems[0]?.label).toBe("Envíos");
    expect(dispatchItems[0]?.path).toBe("/finance/dispatch");
  });

  it("alerta auto-fail en detalle apunta a /finance/dispatch/:runId (copy coherente)", () => {
    expect(invoicingCopy.send.autoDispatchFailedLink).toBe("Ver corrida");
    const runId = "run-auto-1";
    expect(`/finance/dispatch/${runId}`).toMatch(
      /^\/finance\/dispatch\/[\w-]+$/,
    );
    expect(`/finance/dispatch/${runId}`).not.toContain("dispatch-runs");
  });

  it("empty Pendientes CTA cambia a tab Enviadas", async () => {
    const user = userEvent.setup();
    mockUseInvoices.mockImplementation(
      (params?: { emailDispatch?: string }) => {
        if (params?.emailDispatch === "sent") {
          return invoicesQueryResult({
            data: [
              buildInvoice({
                id: "inv-sent",
                folio: 99,
                dispatchSentAt: "2026-09-19T09:00:00.000Z",
              }),
            ],
            pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
          });
        }
        return invoicesQueryResult(emptyList());
      },
    );

    render(
      <TestProviders>
        <FinanceDispatchPage />
      </TestProviders>,
    );

    await user.click(
      screen.getByRole("button", {
        name: dispatchRunsCopy.workbench.pending.empty.ctaSent,
      }),
    );

    expect(screen.getAllByText("A-99").length).toBeGreaterThan(0);
    const sentBucket = screen.getByRole("tab", {
      name: new RegExp(dispatchRunsCopy.workbench.buckets.sent),
    });
    expect(sentBucket).toHaveAttribute("aria-selected", "true");
  });
});
