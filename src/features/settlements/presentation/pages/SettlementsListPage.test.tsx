import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import { SettlementsListPage } from "./SettlementsListPage";
import { settlementsCopy } from "../copy/settlementsCopy";

const workbenchCopy = settlementsCopy.workbench;

const {
  workbench,
  workbenchCounts,
  settlementsList,
  readiness,
  branches,
} = vi.hoisted(() => ({
  workbench: {
    data: undefined as
      | {
          backlog: unknown[];
          summary?: {
            pending: number;
            draft: number;
            approval: number;
            payable: number;
            closed: number;
            openAdvances: number;
          };
        }
      | undefined,
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: vi.fn(),
  },
  workbenchCounts: {
    summary: {
      pending: 0,
      draft: 0,
      approval: 0,
      payable: 0,
      closed: 0,
      openAdvances: 0,
    },
    isLoading: false,
    isFetching: false,
    isWorkbenchAvailable: true,
    refetch: vi.fn(),
  },
  settlementsList: {
    data: undefined as
      | {
          data: unknown[];
          pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
        }
      | undefined,
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: vi.fn(),
  },
  readiness: {
    items: [] as Array<{
      id: string;
      label: string;
      value: number;
      status: "ok" | "warn" | "empty" | "info";
      href?: string;
    }>,
    isReady: true,
    isLoading: false,
  },
  branches: {
    data: {
      data: [{ id: "b1", name: "Monterrey" }],
    },
  },
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

vi.mock("@features/branches", () => ({
  useBranches: () => branches,
}));

vi.mock("@features/help-center/presentation", () => ({
  useHelpEmptySupport: () => null,
}));

vi.mock("@features/employees/application", () => ({
  useEmployeeBasic: (employeeId: string, enabled = true) => ({
    data:
      enabled && employeeId
        ? {
            id: employeeId,
            fullName: "Xaime Weir",
            firstName: "Xaime",
            lastName: "Weir",
            secondLastName: null,
            employeeNumber: "E-9",
          }
        : undefined,
  }),
}));

vi.mock("../../application/hooks", () => ({
  useSettlementWorkbench: () => workbench,
  useSettlementWorkbenchCounts: () => workbenchCounts,
  useSettlements: () => settlementsList,
  useSettlementsReadiness: () => readiness,
}));

describe("SettlementsListPage — F1 Por pagar", () => {
  beforeEach(() => {
    workbench.data = { backlog: [], summary: workbenchCounts.summary };
    workbench.isLoading = false;
    workbench.isFetching = false;
    workbench.isError = false;
    workbench.refetch.mockClear();
    workbenchCounts.summary = {
      pending: 0,
      draft: 0,
      approval: 0,
      payable: 0,
      closed: 0,
      openAdvances: 0,
    };
    workbenchCounts.isLoading = false;
    workbenchCounts.isFetching = false;
    workbenchCounts.isWorkbenchAvailable = true;
    workbenchCounts.refetch.mockClear();
    settlementsList.data = {
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
    };
    settlementsList.isLoading = false;
    settlementsList.isFetching = false;
    settlementsList.isError = false;
    settlementsList.refetch.mockClear();
    readiness.items = [];
    readiness.isReady = true;
    readiness.isLoading = false;
  });

  it("usa Workbench sin header propio y deja contratistas fuera del panel", async () => {
    renderWithTheme(<SettlementsListPage />, {
      route: ["/finance/settlements?bucket=pending"],
    });

    expect(
      screen.getByLabelText(workbenchCopy.actions.includeContractors),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Filtros/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(workbenchCopy.filter.searchPending),
    ).toBeInTheDocument();
    // Hub owns the page title; nested workbench keeps showHeader=false.
    expect(
      screen.queryByRole("heading", { name: settlementsCopy.hub.title }),
    ).not.toBeInTheDocument();
  });

  it("sucursal vive en ListingFilterPanel", async () => {
    const user = userEvent.setup();
    renderWithTheme(<SettlementsListPage />, {
      route: ["/finance/settlements?bucket=pending"],
    });

    await user.click(screen.getByRole("button", { name: /Filtros/ }));
    expect(
      screen.getByLabelText(workbenchCopy.filter.branchLabel),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(workbenchCopy.actions.includeContractors),
    ).toBeInTheDocument();
  });

  it("bucket vacío listo → bridge tarifas en DetailAlertCard.action", async () => {
    renderWithTheme(<SettlementsListPage />, {
      route: ["/finance/settlements?bucket=pending"],
    });

    expect(
      await screen.findByText(workbenchCopy.empty.schemesBridgeTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: workbenchCopy.empty.schemesBridgeAction,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(workbenchCopy.empty.backlogTitle),
    ).not.toBeInTheDocument();
  });

  it("bucket vacío no listo → checklist XOR (sin bridge ni EmptyState backlog)", async () => {
    readiness.isReady = false;
    readiness.items = [
      {
        id: "templates_active",
        label: workbenchCopy.readiness.templatesActiveLabel,
        value: 0,
        status: "empty",
        href: "/finance/compensation/templates",
      },
    ];

    renderWithTheme(<SettlementsListPage />, {
      route: ["/finance/settlements?bucket=pending"],
    });

    expect(
      await screen.findByTestId("settlements-setup-checklist"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(workbenchCopy.empty.schemesBridgeTitle),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(workbenchCopy.empty.backlogTitle),
    ).not.toBeInTheDocument();
  });

  it("error de carga usa DetailAlertCard con Reintentar en action", async () => {
    workbench.isError = true;
    workbenchCounts.isWorkbenchAvailable = false;
    const user = userEvent.setup();

    renderWithTheme(<SettlementsListPage />, {
      route: ["/finance/settlements?bucket=pending"],
    });

    expect(
      await screen.findByText(workbenchCopy.loadErrorTitle),
    ).toBeInTheDocument();
    const retry = screen.getByRole("button", { name: workbenchCopy.retry });
    await user.click(retry);
    await waitFor(() => {
      expect(workbench.refetch).toHaveBeenCalled();
    });
  });

  it("pipeline vacío usa EmptyState único (sin empty local de cola)", async () => {
    renderWithTheme(<SettlementsListPage />, {
      route: ["/finance/settlements?bucket=payable"],
    });

    expect(
      await screen.findByText(workbenchCopy.empty.pipelineTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(workbenchCopy.empty.pipelineDescription),
    ).toBeInTheDocument();
  });

  it("H-02: chip de operador en En autorización usa nombre (sin UUID)", async () => {
    renderWithTheme(<SettlementsListPage />, {
      route: ["/finance/settlements?bucket=approval&employeeId=emp-9"],
    });

    expect(
      await screen.findByText(workbenchCopy.chip.employee("Xaime Weir")),
    ).toBeInTheDocument();
    expect(screen.queryByText(/emp-9/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Operador filtrado")).not.toBeInTheDocument();
  });
});
