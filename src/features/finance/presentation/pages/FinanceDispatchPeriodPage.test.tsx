import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, type InitialEntry } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import { FinanceDispatchPeriodPage } from "./FinanceDispatchPeriodPage";
import { DISPATCH_PERIOD_CHECKLIST_STORAGE_KEY } from "../components/FinanceDispatchPeriodChecklist";

const navigateMock = vi.fn();
const useBillingSchemesMock = vi.fn();
const useBillingDispatchRunsMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

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

vi.mock("@features/settings/application/hooks/useBillingSchemes", () => ({
  useBillingSchemes: () => useBillingSchemesMock(),
}));

vi.mock("@features/finance/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/finance/application")>();
  return {
    ...actual,
    useBillingDispatchRuns: (params?: unknown) =>
      useBillingDispatchRunsMock(params),
    useCreateBillingDispatchRun: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
  };
});

const emptyList = {
  data: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
};

function mockRunsIdle() {
  useBillingDispatchRunsMock.mockImplementation(
    (params?: { excludeEmptyScheduled?: boolean; enabled?: boolean }) => {
      if (params?.enabled === false) {
        return {
          data: undefined,
          isLoading: false,
          isFetching: false,
          isError: false,
          error: null,
          refetch: vi.fn(),
        };
      }
      return {
        data: emptyList,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isFetching: false,
      };
    },
  );
}

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
    window.localStorage.removeItem(DISPATCH_PERIOD_CHECKLIST_STORAGE_KEY);
    useBillingSchemesMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    mockRunsIdle();
  });

  it("sin frecuencias: empty con CTA Crear frecuencia y atajo a settings", () => {
    renderPage();

    expect(
      screen.queryByRole("link", {
        name: dispatchRunsCopy.tab.backToWorkbench,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: dispatchRunsCopy.tab.relatedConfig.label,
      }),
    ).toHaveAttribute("href", "/settings/billing-schemes");
    expect(
      screen.getByRole("heading", { name: dispatchRunsCopy.tab.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: dispatchRunsCopy.tab.empty.noSchemesTitle,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(dispatchRunsCopy.tab.empty.noSchemesDescription),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", {
        name: dispatchRunsCopy.tab.empty.noSchemesCta,
      }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole("heading", {
        name: dispatchRunsCopy.tab.empty.autoEmptyTitle,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: dispatchRunsCopy.tab.empty.title,
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Filtros$/ })).toBeInTheDocument();
  });

  const weeklyScheme = {
    id: "scheme-1",
    name: "Semanal",
    cadenceKind: "periodic_weekly" as const,
    params: { weekdays: [5] },
    isDefault: true,
    isActive: true,
  };

  it("con frecuencias y sin listas: checklist dismissible + Armar", async () => {
    const user = userEvent.setup();
    useBillingSchemesMock.mockReturnValue({
      data: [weeklyScheme],
      isLoading: false,
      isError: false,
    });
    renderPage();

    expect(
      screen.getByText(dispatchRunsCopy.tab.checklist.title),
    ).toBeInTheDocument();
    for (const step of dispatchRunsCopy.tab.checklist.steps) {
      expect(screen.getByText(step)).toBeInTheDocument();
    }
    expect(
      screen.getByRole("heading", { name: dispatchRunsCopy.tab.empty.title }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", {
        name: dispatchRunsCopy.tab.executeCta,
      }).length,
    ).toBeGreaterThan(0);

    await user.click(
      screen.getByRole("button", {
        name: dispatchRunsCopy.tab.checklist.dismissAriaLabel,
      }),
    );
    expect(
      screen.queryByText(dispatchRunsCopy.tab.checklist.title),
    ).not.toBeInTheDocument();
    expect(window.localStorage.getItem(DISPATCH_PERIOD_CHECKLIST_STORAGE_KEY)).toBe(
      "true",
    );
  });

  it("auto vacío oculto: empty con CTA Armar lista del periodo", () => {
    useBillingSchemesMock.mockReturnValue({
      data: [weeklyScheme],
      isLoading: false,
      isError: false,
    });
    useBillingDispatchRunsMock.mockImplementation(
      (params?: { excludeEmptyScheduled?: boolean; enabled?: boolean }) => {
        if (params?.enabled === false) {
          return {
            data: undefined,
            isLoading: false,
            isFetching: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
          };
        }
        if (params?.excludeEmptyScheduled === false) {
          return {
            data: {
              data: [
                {
                  id: "run-empty",
                  origin: "scheduled",
                  status: "cancelled",
                },
              ],
              pagination: { page: 1, limit: 5, total: 1, totalPages: 1 },
            },
            isLoading: false,
            isFetching: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
          };
        }
        return {
          data: emptyList,
          isLoading: false,
          isFetching: false,
          isError: false,
          error: null,
          refetch: vi.fn(),
        };
      },
    );

    renderPage();

    expect(
      screen.getByRole("heading", {
        name: dispatchRunsCopy.tab.empty.autoEmptyTitle,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(dispatchRunsCopy.tab.empty.autoEmptyDescription),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", {
        name: dispatchRunsCopy.tab.executeCta,
      }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole("heading", {
        name: dispatchRunsCopy.tab.empty.noSchemesTitle,
      }),
    ).not.toBeInTheDocument();
  });

  it("CTA Crear frecuencia navega a settings", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getAllByRole("button", {
        name: dispatchRunsCopy.tab.empty.noSchemesCta,
      })[0]!,
    );
    expect(navigateMock).toHaveBeenCalledWith("/settings/billing-schemes");
  });

  it("con recorte muestra Filtros (1), empty recortado y no empty virgen", () => {
    useBillingSchemesMock.mockReturnValue({
      data: [weeklyScheme],
      isLoading: false,
      isError: false,
    });
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
      screen.queryByText(dispatchRunsCopy.tab.empty.title),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(dispatchRunsCopy.tab.empty.noSchemesTitle),
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
