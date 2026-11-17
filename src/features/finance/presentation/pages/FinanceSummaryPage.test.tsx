import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import { setMockAuthUser } from "@/test/mocks/auth";
import { financeCopy } from "../copy";
import { FinanceSummaryPage } from "./FinanceSummaryPage";

vi.mock("@features/auth", async () =>
  (await import("@/test/mocks/auth")).authModuleMock(),
);

vi.mock("@shared/permissions", async () =>
  (await import("@/test/mocks/permissions")).permissionsModuleMock(),
);

vi.mock("@shared/hooks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@shared/hooks")>()),
  ...(await import("@/test/mocks/toast")).toastHooksMock(),
}));

vi.mock("@features/trips/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/trips/application")>();
  return {
    ...actual,
    useInvoiceableWorkbenchSummary: () => ({
      data: { ready: 2, prorationPending: 0, blocked: 0, total: 4 },
      isLoading: false,
    }),
  };
});

vi.mock("@features/invoicing/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/invoicing/application")>();
  return {
    ...actual,
    useDispatchDocuments: () => ({
      data: { data: [], pagination: { page: 1, limit: 1, total: 3, totalPages: 3 } },
      isLoading: false,
    }),
  };
});

const refetchSummary = vi.fn();
const refetchPerformance = vi.fn();
const refetchStatement = vi.fn();
const refetchAging = vi.fn();

let summaryError = false;
let performanceError = false;

vi.mock("@features/finance/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/finance/application")>();
  return {
    ...actual,
    useFinanceSummary: () => ({
      data: summaryError
        ? undefined
        : {
            totalReceivable: 50_000,
            collectedThisMonth: 12_000,
            totalOverdue: 8_000,
            expensesThisMonth: 3_000,
            invoicesByStatus: {
              draft: 0,
              stamped: 1,
              cancellationPending: 0,
              cancelled: 0,
            },
            byChannel: {
              withInvoice: {
                receivable: 30_000,
                collectedThisMonth: 8_000,
                overdue: 5_000,
              },
              withoutInvoice: {
                receivable: 20_000,
                collectedThisMonth: 4_000,
                overdue: 3_000,
              },
            },
          },
      isLoading: false,
      isError: summaryError,
      error: summaryError ? new Error("summary failed") : null,
      refetch: refetchSummary,
    }),
    useMonthlyPerformance: () => ({
      data: performanceError
        ? undefined
        : {
            periods: ["2026-10"],
            current: [
              {
                period: "2026-10",
                actualRevenue: 100_000,
                actualCost: 40_000,
                actualMargin: 60_000,
                operationalCost: 55_000,
                operationalMargin: 45_000,
                periodPersonnelCost: 0,
                tripCount: 10,
                incompleteTripCount: 0,
                tripsWithPendingExpenses: 0,
                provisional: false,
              },
            ],
            previous: [],
          },
      isLoading: false,
      isError: performanceError,
      error: performanceError ? new Error("performance failed") : null,
      refetch: refetchPerformance,
    }),
    useIncomeByMonth: () => ({
      data: {
        periods: ["2026-09", "2026-10"],
        collected: [8_000, 12_000],
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    }),
    useAccountStatement: () => ({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchStatement,
    }),
    useAgingSummary: () => ({
      data: {
        totalReceivable: 50_000,
        dso30d: { invoiced: 20, operational: 10, blended: 18 },
        buckets: {
          "0-30": { invoiceCount: 1, totalBalance: 40_000 },
          "31-60": { invoiceCount: 1, totalBalance: 10_000 },
          "61-90": { invoiceCount: 0, totalBalance: 0 },
          "90+": { invoiceCount: 0, totalBalance: 0 },
        },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchAging,
    }),
    useAgingByClient: () => ({ data: [] }),
    useOpenPpdSummary: () => ({
      data: { open: 5, partial: 2, repExceptions: 1, totalBalance: 30_000 },
      isLoading: false,
    }),
    useOperationalCashPending: () => ({
      data: {
        data: [],
        meta: {
          totals: { pendingAmount: 20_000, tripCount: 9, clientCount: 3 },
          byClient: [],
          eligibility: {
            intent: "sin_cfdi_efectivo",
            pendingGt: 0,
            statuses: ["scheduled", "in_progress", "completed"],
          },
        },
        pagination: { page: 1, limit: 1, total: 9, totalPages: 9 },
      },
      isLoading: false,
    }),
    useDownloadAccountStatementPdf: () => ({
      mutate: vi.fn(),
      isPending: false,
      variables: undefined,
    }),
    useDownloadAccountStatementCsv: () => ({
      mutate: vi.fn(),
      isPending: false,
      variables: undefined,
    }),
  };
});

describe("FinanceSummaryPage", () => {
  beforeEach(() => {
    summaryError = false;
    performanceError = false;
    refetchSummary.mockClear();
    refetchPerformance.mockClear();
    refetchStatement.mockClear();
    refetchAging.mockClear();
  });

  it("renderiza Cartera multi-canal con colas y sin copy #3", () => {
    setMockAuthUser({ role: "accountant" });
    renderWithTheme(<FinanceSummaryPage />, { route: ["/finance"] });

    expect(
      screen.getByRole("heading", { name: financeCopy.page.hub.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(financeCopy.page.hub.description),
    ).toBeInTheDocument();
    expect(
      screen.getByText(financeCopy.page.hub.orientationAccountant),
    ).toBeInTheDocument();
    expect(financeCopy.page.hub.orientationAccountant).not.toMatch(
      /Facturas a crédito vacío/i,
    );

    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();

    const kpis = screen.getByRole("region", {
      name: financeCopy.pulse.ariaLabel,
    });
    expect(within(kpis).getByText(financeCopy.pulse.receivable.title)).toBeInTheDocument();
    expect(within(kpis).getByText(financeCopy.pulse.dso.title)).toBeInTheDocument();
    expect(screen.getByText(financeCopy.page.hub.basesLine)).toBeInTheDocument();

    const cycle = screen.getByRole("navigation", {
      name: financeCopy.page.hub.cycle.ariaLabel,
    });
    expect(
      kpis.compareDocumentPosition(cycle) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    expect(
      within(cycle).getByRole("link", { name: /Por facturar/i }),
    ).toHaveAttribute("href", "/finance/invoiceable");
    expect(
      within(cycle).getByRole("link", { name: /Envíos/i }),
    ).toHaveAttribute("href", "/finance/dispatch");
    expect(
      within(cycle).getByRole("link", { name: /Facturas a crédito/i }),
    ).toHaveAttribute("href", "/finance/payments");
    expect(
      within(cycle).getByRole("link", { name: /Cobros sin factura/i }),
    ).toHaveAttribute("href", "/finance/operational-cash-pending");
  });

  it("manager: una línea de saldos, sin copy accountant", () => {
    setMockAuthUser({ role: "manager" });
    renderWithTheme(<FinanceSummaryPage />, { route: ["/finance"] });

    expect(
      screen.getByText(financeCopy.page.hub.orientationManager),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(financeCopy.page.hub.orientationAccountant),
    ).not.toBeInTheDocument();
  });

  it("panel del mes muestra Ingreso, Margen y Gasto", () => {
    setMockAuthUser({ role: "manager" });
    renderWithTheme(<FinanceSummaryPage />, { route: ["/finance"] });

    expect(
      screen.getByText(financeCopy.page.hub.monthPanelRevenue),
    ).toBeInTheDocument();
    expect(
      screen.getByText(financeCopy.page.hub.monthPanelMargin),
    ).toBeInTheDocument();
    expect(
      screen.getByText(financeCopy.page.hub.monthPanelExpense),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Ver Análisis/i }),
    ).toHaveAttribute("href", "/finance/analysis?view=performance");
  });

  it("error de summary muestra Reintentar inline (no solo toast)", async () => {
    const user = userEvent.setup();
    summaryError = true;
    setMockAuthUser({ role: "manager" });
    renderWithTheme(<FinanceSummaryPage />, { route: ["/finance"] });

    expect(
      screen.getByText(financeCopy.summary.errors.summary),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", {
        name: financeCopy.summary.errors.retry,
      }),
    );
    expect(refetchSummary).toHaveBeenCalled();
  });

  it("muestra Volver a reportes cuando se llegó desde el hub", () => {
    setMockAuthUser({ role: "accountant" });
    renderWithTheme(<FinanceSummaryPage />, {
      route: [{ pathname: "/finance", state: { from: "/reports" } }],
    });

    expect(
      screen.getByRole("link", { name: "Volver a reportes" }),
    ).toHaveAttribute("href", "/reports");
  });
});
