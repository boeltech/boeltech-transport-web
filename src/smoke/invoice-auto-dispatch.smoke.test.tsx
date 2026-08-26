/**
 * Smoke ADR-0083 — envío automático de facturas (F2 UI + contrato visible).
 * Mock de hooks; no requiere backend, worker ni SMTP.
 * Cubre: toggle cliente + warning sin esquema, badge origen, alerta failed en factura.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ClientForm } from "@features/clients/presentation/components/ClientForm";
import { ClientDetailDataTab } from "@features/clients/presentation/components/ClientDetailDataTab";
import { clientDetailCopy } from "@features/clients/presentation/copy/clientDetailCopy";
import type { Client } from "@features/clients/domain";
import { FinanceDispatchRunsTable } from "@features/finance/presentation/components/FinanceDispatchRunsTable";
import { dispatchRunsCopy } from "@features/finance/presentation/copy/dispatchRunsCopy";
import type { BillingDispatchRunListItem } from "@features/finance/domain/billingDispatchRun.types";
import { InvoiceDetailPage } from "@features/invoicing/presentation/pages/InvoiceDetailPage";
import type { Invoice } from "@features/invoicing/domain";
import { invoicingCopy } from "@features/invoicing/presentation/copy/invoicingCopy";
import { NOTIFICATION_TYPE_CONFIG } from "@features/notifications/presentation/config/notificationTypeConfig";
import { NOTIFICATION_SOURCE_LABELS } from "@features/notifications/presentation/copy/notificationsCopy";

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@features/catalogs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/catalogs")>();
  return {
    ...actual,
    RegimenFiscalSelect: ({
      triggerId,
      value,
      onValueChange,
    }: {
      triggerId?: string;
      value?: string;
      onValueChange?: (value: string) => void;
    }) => (
      <input
        id={triggerId}
        value={value ?? ""}
        onChange={(e) => onValueChange?.(e.target.value)}
        data-testid="tax-regime-select"
      />
    ),
  };
});

vi.mock("@features/invoicing/presentation/components/InvoiceDetailFiscalLabels", () => ({
  InvoiceDetailComprobanteCard: () => <div data-testid="comprobante-card" />,
  InvoiceDetailPaymentTermsCard: () => (
    <div data-testid="payment-terms-card" />
  ),
  InvoiceDetailAmountsPanel: () => <div data-testid="amounts-panel" />,
  InvoiceDetailFiscalDossierBody: () => (
    <div data-testid="fiscal-dossier-body" />
  ),
  InvoiceDetailIssuerReceiverCards: () => (
    <div data-testid="issuer-receiver-cards" />
  ),
  InvoiceDetailCfdiAmountsCard: () => (
    <div data-testid="cfdi-amounts-card" />
  ),
}));

vi.mock("@features/invoicing/presentation/components/InvoiceDetailConceptsCard", () => ({
  InvoiceDetailConceptsCard: () => <div data-testid="concepts-card" />,
}));

vi.mock("@features/invoicing/presentation/components/InvoiceDetailContextStrip", () => ({
  InvoiceDetailContextStrip: () => <div data-testid="context-strip" />,
}));

vi.mock("@features/invoicing/presentation/components/InvoicePaymentRepRow", () => ({
  InvoicePaymentRepRow: () => null,
}));

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

const useInvoiceMock = vi.fn();

vi.mock("@features/invoicing/application", () => ({
  useInvoice: (...args: unknown[]) => useInvoiceMock(...args),
  useRetryRepStamp: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
  }),
  useRole: () => "accountant",
}));

vi.mock("@features/invoicing/presentation/components/InvoiceActions", () => ({
  InvoiceActions: () => <div data-testid="invoice-actions" />,
}));

vi.mock("@features/invoicing/presentation/components/InvoiceDetailFiscalDossier", () => ({
  InvoiceDetailFiscalDossier: () => <div data-testid="fiscal-dossier" />,
}));

vi.mock("@features/trips", () => ({
  TripListRouteLabel: () => <span data-testid="trip-route-label" />,
}));

const idCopy = clientDetailCopy.identification;

const baseClient = {
  id: "c1",
  tenantId: "t1",
  clientCode: "CLI-1",
  type: "company",
  legalName: "Transportes Demo SA de CV",
  tradeName: "Demo",
  taxId: "AAA010101AAA",
  taxRegime: "601",
  paymentTerms: "cash",
  creditDays: 0,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
} as Client;

function TestProviders({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

function buildInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "inv-1",
    tenantId: "tenant-1",
    serie: "A",
    folio: 100,
    cfdiUuid: "c9b54a4b-c44f-4fd6-afeb-a6889f4ad073",
    invoiceType: "ingreso",
    parentInvoiceId: null,
    issuerRfc: "AAA010101AAA",
    issuerName: "Emisor",
    issuerTaxRegime: "601",
    issueLocation: "26015",
    receiverRfc: "XAXX010101000",
    receiverName: "Cliente",
    cfdiUsage: "G03",
    receiverTaxRegime: "616",
    receiverPostalCode: "26015",
    issuedAt: "2026-06-01T12:00:00.000Z",
    paymentForm: "03",
    paymentMethod: "PUE",
    currency: "MXN",
    exchangeRate: 1,
    subtotal: 1000,
    discount: 0,
    totalTax: 160,
    retainedTax: 0,
    total: 1160,
    status: "stamped",
    satCancellationStatus: "none",
    satCancellationMessage: null,
    satCancellationUpdatedAt: null,
    pacProvider: "profact",
    xmlContent: null,
    hasStampedXml: true,
    qrCode: null,
    pdfUrl: null,
    stampedAt: "2026-06-01T12:05:00.000Z",
    cancelledAt: null,
    cancellationReason: null,
    cancellationCode: null,
    replacementCfdiUuid: null,
    notes: null,
    trips: [],
    concepts: [],
    payments: [],
    totalPaid: 1160,
    balanceDue: 0,
    canSubstituteInvoice: false,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T12:05:00.000Z",
    createdBy: "user-1",
    updatedBy: "user-1",
    createdByName: "Admin",
    updatedByName: "Admin",
    ...overrides,
  };
}

function renderInvoiceDetail(invoice: Invoice) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  useInvoiceMock.mockReturnValue({
    data: invoice,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/invoices/inv-1"]}>
        <Routes>
          <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("invoice auto-dispatch workflow smoke (ADR-0083)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("edición de cliente: toggle auto sin esquema muestra warning", async () => {
    const user = userEvent.setup();
    render(
      <TestProviders>
        <ClientForm
          mode="edit"
          client={baseClient}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      </TestProviders>,
    );

    expect(
      screen.getByText(idCopy.invoiceAutoDispatch),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("switch", { name: idCopy.invoiceAutoDispatch }));

    expect(
      screen.getByText(idCopy.invoiceAutoDispatchNoSchemeTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(idCopy.invoiceAutoDispatchNoSchemeText),
    ).toBeInTheDocument();
  });

  it("detalle cliente muestra Activado cuando el flag está on", () => {
    render(
      <TestProviders>
        <ClientDetailDataTab
          client={{
            ...baseClient,
            invoiceAutoDispatchEnabled: true,
            billingSchemeId: "scheme-1",
          }}
          taxRegimeLabel="General de Ley"
          billingSchemeLabel="Corte semanal"
        />
      </TestProviders>,
    );

    expect(screen.getByText(idCopy.invoiceAutoDispatch)).toBeInTheDocument();
    expect(screen.getByText(idCopy.invoiceAutoDispatchOn)).toBeInTheDocument();
  });

  it("listado de corridas distingue Manual vs Automática", () => {
    const runs: BillingDispatchRunListItem[] = [
      {
        id: "run-manual",
        tenantId: "t1",
        billingSchemeId: "scheme-1",
        periodStart: "2026-08-01T06:00:00.000Z",
        periodEnd: "2026-08-08T06:00:00.000Z",
        anchorKind: "trip_completed",
        origin: "manual",
        status: "completed",
        previewedAt: null,
        sendConfirmedAt: null,
        sendConfirmedBy: null,
        completedAt: "2026-08-08T14:00:00.000Z",
        failedAt: null,
        errorSummary: null,
        createdBy: "user-1",
        createdAt: "2026-08-08T12:00:00.000Z",
        updatedAt: "2026-08-08T14:00:00.000Z",
        summary: null,
      },
      {
        id: "run-scheduled",
        tenantId: "t1",
        billingSchemeId: "scheme-1",
        periodStart: "2026-08-08T06:00:00.000Z",
        periodEnd: "2026-08-15T06:00:00.000Z",
        anchorKind: "trip_completed",
        origin: "scheduled",
        status: "completed",
        previewedAt: null,
        sendConfirmedAt: null,
        sendConfirmedBy: null,
        completedAt: "2026-08-15T14:00:00.000Z",
        failedAt: null,
        errorSummary: null,
        createdBy: null,
        createdAt: "2026-08-15T12:00:00.000Z",
        updatedAt: "2026-08-15T14:00:00.000Z",
        summary: null,
      },
    ];

    render(
      <TestProviders>
        <FinanceDispatchRunsTable
          runs={runs}
          isLoading={false}
          schemeName={() => "Corte semanal"}
          onView={vi.fn()}
        />
      </TestProviders>,
    );

    expect(screen.getByText(dispatchRunsCopy.tab.origin.manual)).toBeInTheDocument();
    expect(screen.getByText(dispatchRunsCopy.tab.origin.scheduled)).toBeInTheDocument();
  });

  it("factura con auto_dispatch failed muestra alerta y link al envío", () => {
    renderInvoiceDetail(
      buildInvoice({
        autoDispatch: {
          enabledForClient: true,
          lastScheduledRunId: "run-auto-1",
          lastItemStatus: "failed",
          lastError: "SMTP timeout",
        },
      }),
    );

    expect(
      screen.getByText(invoicingCopy.send.autoDispatchFailedTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(invoicingCopy.send.autoDispatchFailedBody),
    ).toBeInTheDocument();
    expect(screen.queryByText(/SMTP timeout/)).not.toBeInTheDocument();

    const link = screen.getByRole("link", {
      name: invoicingCopy.send.autoDispatchFailedLink,
    });
    expect(link).toHaveAttribute("href", "/finance/dispatch-runs/run-auto-1");
  });

  it("inbox tipa billing_dispatch y tipos de envío automático", () => {
    expect(NOTIFICATION_SOURCE_LABELS.billing_dispatch).toBe("Envío de facturas");
    expect(NOTIFICATION_TYPE_CONFIG.dispatch_item_failed).toBeDefined();
    expect(NOTIFICATION_TYPE_CONFIG.dispatch_pending_stamp).toBeDefined();
  });
});
