import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { SettlementsAdvancesPage } from "./SettlementsAdvancesPage";
import { settlementsCopy } from "../copy/settlementsCopy";

const advancesCopy = settlementsCopy.advancesList;

const { advancesQuery, mockPermissions } = vi.hoisted(() => ({
  advancesQuery: {
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
  mockPermissions: { granted: new Set<string>() },
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: (module: string, action: string) =>
      mockPermissions.granted.has(`${module}.${action}`),
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

vi.mock("@shared/ui/employee-async-combobox", () => ({
  EmployeeAsyncCombobox: ({
    id,
    placeholder,
  }: {
    id?: string;
    placeholder?: string;
  }) => <div data-testid={id ?? "employee-combobox"}>{placeholder}</div>,
}));

vi.mock("@features/employees/application", () => ({
  useEmployeeBasic: (employeeId: string, enabled = true) => ({
    data:
      enabled && employeeId
        ? {
            id: employeeId,
            fullName: "Pedro Infante",
            firstName: "Pedro",
            lastName: "Infante",
            secondLastName: null,
            employeeNumber: "E-1",
          }
        : undefined,
  }),
}));

vi.mock("../../application/hooks", () => ({
  useDriverAdvances: () => advancesQuery,
  useSettlementWorkbench: () => ({
    data: {
      backlog: [],
      summary: {
        pending: 0,
        draft: 0,
        approval: 0,
        payable: 0,
        closed: 0,
        openAdvances: 0,
      },
    },
    isLoading: false,
  }),
  useSetAdvancePeriodDeductionPlan: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

describe("SettlementsAdvancesPage F4", () => {
  beforeEach(() => {
    mockPermissions.granted = new Set([
      "settlements.read",
      "settlements.create",
      "settlements.update",
    ]);
    advancesQuery.data = {
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
    advancesQuery.isLoading = false;
    advancesQuery.isFetching = false;
    advancesQuery.isError = false;
    advancesQuery.refetch.mockClear();
  });

  it("muestra pipeline 4 etapas y alerta anticipo≠reembolso", () => {
    renderWithTheme(<SettlementsAdvancesPage />);
    expect(screen.getByTestId("settlement-pipeline-chevrons")).toBeInTheDocument();
    expect(screen.getByText(advancesCopy.pipeline.pendingApproval)).toBeInTheDocument();
    expect(screen.getByText(advancesCopy.pipeline.open)).toBeInTheDocument();
    expect(
      screen.getByTestId("advance-not-reimbursement-alert"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(advancesCopy.notReimbursementAlert.title),
    ).toBeInTheDocument();
    // V-M7: Operate fija tabla; sin toggle lista/grid en toolbar.
    expect(screen.queryByTitle("Vista de tabla")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Vista de tarjetas")).not.toBeInTheDocument();
  });

  it("primaria Nuevo anticipo (CA F4.14)", () => {
    renderWithTheme(<SettlementsAdvancesPage />);
    // Header + EmptyState CTA cuando la lista está vacía.
    expect(
      screen.getAllByRole("button", { name: advancesCopy.primaryAction }).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("F5 R1: sin settlements.create no muestra Nuevo anticipo", () => {
    mockPermissions.granted = new Set(["settlements.read"]);
    renderWithTheme(<SettlementsAdvancesPage />);
    expect(
      screen.queryByRole("button", { name: advancesCopy.primaryAction }),
    ).not.toBeInTheDocument();
  });

  it("mantiene un filtro toolbar (operador) sin ListingFilterPanel vacío", () => {
    renderWithTheme(<SettlementsAdvancesPage />);

    expect(
      screen.getByTestId("settlements-advances-employee-filter"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Filtros/ }),
    ).not.toBeInTheDocument();
  });

  it("error de carga usa DetailAlertCard con Reintentar en action", () => {
    advancesQuery.isError = true;
    advancesQuery.data = undefined;

    renderWithTheme(<SettlementsAdvancesPage />);

    expect(screen.getByText(advancesCopy.loadErrorTitle)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: advancesCopy.retry }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(settlementsCopy.empty.advancesTitle),
    ).not.toBeInTheDocument();
  });

  it("lista vacía usa EmptyState", () => {
    renderWithTheme(<SettlementsAdvancesPage />);

    expect(
      screen.getByText(settlementsCopy.empty.advancesTitle),
    ).toBeInTheDocument();
  });

  it("H-02: chip de operador usa nombre resuelto (sin UUID)", () => {
    renderWithTheme(<SettlementsAdvancesPage />, {
      route: ["/finance/operator-payments/advances?employeeId=emp-1"],
    });

    expect(
      screen.getByText(settlementsCopy.workbench.chip.employee("Pedro Infante")),
    ).toBeInTheDocument();
    expect(screen.queryByText(/emp-1/i)).not.toBeInTheDocument();
    expect(screen.getByText(advancesCopy.operatorAll)).toBeInTheDocument();
  });
});
