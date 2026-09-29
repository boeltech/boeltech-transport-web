import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, type InitialEntry } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import { FinanceDispatchPeriodPage } from "./FinanceDispatchPeriodPage";

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: (module: string, action: string) =>
      module === "invoices" && (action === "execute" || action === "read"),
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
    useQueryErrorToast: vi.fn(),
  };
});

vi.mock("@features/settings/presentation/components/BillingSchemesCompactCard", () => ({
  BillingSchemesCompactCard: () => <div>Frecuencias de envío</div>,
}));

vi.mock("@features/settings/application/hooks/useBillingSchemes", () => ({
  useBillingSchemes: () => ({ data: [], isLoading: false, isError: false }),
}));

vi.mock("@features/finance/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/finance/application")>();
  return {
    ...actual,
    useBillingDispatchRuns: () => ({
      data: {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    }),
    useCreateBillingDispatchRun: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
  };
});

function renderPage(initialEntry: InitialEntry = "/finance/dispatch/period") {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <FinanceDispatchPeriodPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("FinanceDispatchPeriodPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enseña lotes del periodo, frecuencias y onboarding de 3 pasos", () => {
    renderPage();

    expect(
      screen.getByRole("link", { name: dispatchRunsCopy.tab.backToWorkbench }),
    ).toHaveAttribute("href", "/finance/dispatch");
    expect(
      screen.getByRole("heading", { name: dispatchRunsCopy.tab.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(dispatchRunsCopy.tab.subtitle),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", {
        name: dispatchRunsCopy.tab.executeCta,
      }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(dispatchRunsCopy.tab.empty.onboardingTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(dispatchRunsCopy.tab.empty.onboardingSteps[0]!.label),
    ).toBeInTheDocument();
    const clientStep = dispatchRunsCopy.tab.empty.onboardingSteps[1];
    expect(
      screen.getByRole("link", {
        name: "linkLabel" in clientStep ? clientStep.linkLabel : "Ir a clientes",
      }),
    ).toHaveAttribute("href", "/clients");
    expect(
      screen.getByText(dispatchRunsCopy.tab.empty.onboardingSteps[2]!.label),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /pendientes/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Filtros$/ })).toBeInTheDocument();
    expect(screen.queryByText("Todos")).not.toBeInTheDocument();
    expect(screen.queryByText("Todas")).not.toBeInTheDocument();
  });

  it("con recorte muestra Filtros (1), empty recortado y no onboarding", () => {
    renderPage("/finance/dispatch/period?dispatch_status=cancelled");

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(
      screen.getByText(
        dispatchRunsCopy.tab.filters.chipStatus(
          dispatchRunsCopy.status.cancelled,
        ),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(dispatchRunsCopy.tab.empty.recorteTitle),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", {
        name: dispatchRunsCopy.tab.empty.clearFilters,
      }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText(dispatchRunsCopy.tab.empty.onboardingTitle),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(dispatchRunsCopy.tab.empty.title),
    ).not.toBeInTheDocument();
  });

  it("al volver desde Enviadas conserva la pestaña del workbench", () => {
    renderPage({
      pathname: "/finance/dispatch/period",
      state: { from: "/finance/dispatch?tab=sent" },
    });

    expect(
      screen.getByRole("link", { name: dispatchRunsCopy.tab.backToWorkbench }),
    ).toHaveAttribute("href", "/finance/dispatch?tab=sent");
  });
});
