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
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchAging,
    }),
    useAgingByClient: () => ({ data: [] }),
    useDownloadAccountStatementPdf: () => ({
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

  it("renderiza Cartera con stepper de ciclo y sin tabs", () => {
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
    expect(
      screen.queryByText(financeCopy.page.hub.orientation),
    ).not.toBeInTheDocument();
    expect(financeCopy.page.hub.orientationAccountant).not.toMatch(
      /Aprobar|Liquidaciones|SaaS/i,
    );

    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();

    const cycle = screen.getByRole("navigation", {
      name: financeCopy.page.hub.cycle.ariaLabel,
    });
    expect(
      within(cycle).getByRole("link", { name: "Emitir: Por facturar" }),
    ).toHaveAttribute("href", "/finance/invoiceable");
    expect(
      within(cycle).getByRole("link", { name: "Enviar: Envíos" }),
    ).toHaveAttribute("href", "/finance/dispatch");
    expect(
      within(cycle).getByRole("link", { name: "Cobrar: Cobros" }),
    ).toHaveAttribute("href", "/finance/cobros");
    expect(
      within(cycle).queryByRole("link", { name: /Aprobar|Aprobaciones/i }),
    ).not.toBeInTheDocument();
    expect(
      within(cycle).queryByRole("link", { name: /Facturas/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Volver a reportes" }),
    ).not.toBeInTheDocument();
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
    expect(financeCopy.page.hub.orientationManager).not.toMatch(
      /Aprobar|Liquidaciones|SaaS/i,
    );
  });

  it("Pulse ATF: Ingreso, Margen operativo, línea no-P&L y CTA a Mes a mes", () => {
    setMockAuthUser({ role: "manager" });
    renderWithTheme(<FinanceSummaryPage />, { route: ["/finance"] });

    expect(
      screen.getByRole("region", { name: financeCopy.pulse.ariaLabel }),
    ).toBeInTheDocument();
    expect(screen.getByText(financeCopy.pulse.revenue.title)).toBeInTheDocument();
    expect(
      screen.getByText(financeCopy.pulse.operationalMargin.title),
    ).toBeInTheDocument();
    expect(screen.getByText(financeCopy.pulse.basisLine)).toBeInTheDocument();

    const cta = screen.getByRole("link", {
      name: financeCopy.pulse.ctaMonthOverMonth,
    });
    expect(cta).toHaveAttribute("href", "/finance/analysis?view=performance");

    // Cobrado / Gasto de viaje siguen abajo (sin saturar Pulse)
    expect(
      screen.getByText(financeCopy.kpis.collectedThisMonth.title),
    ).toBeInTheDocument();
    expect(
      screen.getByText(financeCopy.kpis.expensesThisMonth.title),
    ).toBeInTheDocument();
  });

  it("Por cobrar y Vencido del Pulse navegan a /finance/cobros (CA 4)", () => {
    setMockAuthUser({ role: "manager" });
    renderWithTheme(<FinanceSummaryPage />, { route: ["/finance"] });

    expect(
      screen.getByRole("link", {
        name: financeCopy.pulse.receivableLinkAria,
      }),
    ).toHaveAttribute("href", "/finance/cobros");
    expect(
      screen.getByRole("link", {
        name: financeCopy.pulse.overdueLinkAria,
      }),
    ).toHaveAttribute("href", "/finance/cobros");
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
