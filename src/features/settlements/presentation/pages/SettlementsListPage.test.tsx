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

vi.mock("@features/auth", () => ({
  useAuth: () => ({ user: { id: "user-1", fullName: "Tester" } }),
}));

vi.mock("@features/approvals/application", () => ({
  useSelfApprovalPolicy: () => ({ data: null }),
}));

vi.mock("../../application/hooks", () => ({
  useSettlementWorkbench: () => workbench,
  useSettlementWorkbenchCounts: () => workbenchCounts,
  useSettlements: () => settlementsList,
  useSettlementsReadiness: () => readiness,
  useOperatorPaymentReadiness: () => ({
    data: { data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 1 } },
  }),
  useBatchApproveSettlements: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useBatchRejectSettlements: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useBatchDisburseSettlements: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
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

  it("F4: header con Pago fuera de ciclo, KPIs y pipeline chevrons", async () => {
    workbenchCounts.summary = {
      pending: 2,
      draft: 0,
      approval: 1,
      payable: 0,
      closed: 0,
      openAdvances: 0,
      approvalAgingDaysMax: 2,
      advancesDeductibleEstimate: 1000,
      kpis: {
        toArm: { count: 2, amount: 10_000 },
        inApproval: { count: 1, amount: 5_000 },
        authorizedUnpaid: { count: 0, amount: 0 },
        advancesToDeduct: { count: 0, amount: 0 },
      },
    };
    workbench.data = {
      backlog: [
        {
          employeeId: "e1",
          employeeFullName: "Juan",
          branchId: null,
          branchName: null,
          periodStart: "2026-11-02",
          periodEnd: "2026-11-08",
          pendingTripsCount: 1,
          oldestTripAgeDays: 1,
          estimatedNetAmount: 5000,
          rowType: "trips_pending",
          warnings: [],
          periodOverlap: null,
        },
      ],
      summary: workbenchCounts.summary,
    };

    renderWithTheme(<SettlementsListPage />, {
      route: ["/finance/operator-payments?bucket=pending"],
    });

    expect(
      screen.getByRole("heading", { name: settlementsCopy.hub.title }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("pago-fuera-de-ciclo")).toBeInTheDocument();
    expect(screen.getByTestId("settlement-workbench-kpis")).toBeInTheDocument();
    expect(
      screen.getByTestId("settlement-pipeline-chevrons"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("settlement-closed-period-banner"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(workbenchCopy.actions.includeContractors),
    ).toBeInTheDocument();
  });

  it("sucursal vive en ListingFilterPanel", async () => {
    const user = userEvent.setup();
    renderWithTheme(<SettlementsListPage />, {
      route: ["/finance/operator-payments?bucket=pending"],
    });

    await user.click(screen.getByRole("button", { name: /Filtros/ }));
    expect(
      screen.getByLabelText(workbenchCopy.filter.branchLabel),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(workbenchCopy.actions.includeContractors),
    ).toBeInTheDocument();
  });

  it("bucket vacío listo → bridge tarifas + Empleados en DetailAlertCard.action", async () => {
    renderWithTheme(<SettlementsListPage />, {
      route: ["/finance/operator-payments?bucket=pending"],
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
      screen.getByRole("button", {
        name: workbenchCopy.empty.schemesBridgeEmployeesAction,
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
        href: "/finance/operator-payments/tariffs",
      },
    ];

    renderWithTheme(<SettlementsListPage />, {
      route: ["/finance/operator-payments?bucket=pending"],
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
      route: ["/finance/operator-payments?bucket=pending"],
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
      route: ["/finance/operator-payments?bucket=payable"],
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
      route: ["/finance/operator-payments?bucket=approval&employeeId=emp-9"],
    });

    expect(
      await screen.findByText(workbenchCopy.chip.employee("Xaime Weir")),
    ).toBeInTheDocument();
    expect(screen.queryByText(/emp-9/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Operador filtrado")).not.toBeInTheDocument();
  });
});
