import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { SettlementsAdvancesPage } from "./SettlementsAdvancesPage";
import { settlementsCopy } from "../copy/settlementsCopy";
import type { DriverAdvance } from "../../domain/entities";

const advancesCopy = settlementsCopy.advancesList;

type AdvancesPageData = {
  data: DriverAdvance[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const { advancesQuery, countByStatus, mockPermissions } = vi.hoisted(() => ({
  advancesQuery: {
    data: undefined as AdvancesPageData | undefined,
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: vi.fn(),
  },
  countByStatus: {
    disbursed: 0,
    partially_applied: 0,
    pending_approval: 0,
    pending_disbursement: 0,
    fully_applied: 0,
  } as Record<string, number>,
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

vi.mock("../components/AdvanceActions", () => ({
  AdvanceActions: () => (
    <button type="button" aria-label="Abrir menú de acciones" />
  ),
}));

vi.mock("../../application/hooks", () => ({
  useDriverAdvances: (params?: { status?: string; pageSize?: number }) => {
    // KPI probes (pageSize 1) → totales por status; listado principal → advancesQuery.
    if (params?.pageSize === 1 && params.status) {
      const total = countByStatus[params.status] ?? 0;
      return {
        data: {
          data: [],
          pagination: { page: 1, limit: 1, total, totalPages: total > 0 ? 1 : 0 },
        },
        isLoading: false,
        isFetching: false,
        isError: false,
        refetch: vi.fn(),
      };
    }
    return advancesQuery;
  },
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

function makeAdvance(overrides: Partial<DriverAdvance> = {}): DriverAdvance {
  return {
    id: "adv-1",
    tenantId: "tenant-1",
    folio: "ANT-202611-0001",
    employeeId: "emp-1",
    employeeFullName: "Pedro Infante",
    tripId: null,
    tripCode: null,
    amount: 1000,
    balanceRemaining: 1000,
    availableBalance: 1000,
    currency: "MXN",
    category: "travel_advance",
    status: "disbursed",
    disbursedAt: "2026-11-01T12:00:00Z",
    paymentMethod: "cash",
    bankReference: null,
    notes: null,
    createdAt: "2026-11-01T10:00:00Z",
    updatedAt: "2026-11-01T12:00:00Z",
    ...overrides,
  };
}

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
    countByStatus.disbursed = 0;
    countByStatus.partially_applied = 0;
    countByStatus.pending_approval = 0;
    countByStatus.pending_disbursement = 0;
    countByStatus.fully_applied = 0;
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

  it("D4: pie Mostrando… usa total del bucket Abiertos, no pagination.total sin filtrar", () => {
    countByStatus.disbursed = 4;
    countByStatus.partially_applied = 2;
    const openRows = [
      makeAdvance({ id: "a1", folio: "ANT-1", status: "disbursed" }),
      makeAdvance({ id: "a2", folio: "ANT-2", status: "disbursed" }),
      makeAdvance({ id: "a3", folio: "ANT-3", status: "partially_applied" }),
      makeAdvance({
        id: "a4",
        folio: "ANT-4",
        status: "pending_approval",
      }),
    ];
    advancesQuery.data = {
      data: openRows,
      // API sin filtrar por Abiertos (mezcla statuses) → total inflado
      pagination: { page: 1, limit: 25, total: 9, totalPages: 1 },
    };

    renderWithTheme(<SettlementsAdvancesPage />);

    expect(screen.getByText(/Mostrando/i).textContent).toMatch(
      /Mostrando\s+1-6\s+de\s+6/,
    );
    expect(screen.getByText(/Mostrando/i).textContent).not.toMatch(/de\s+9/);
  });
});
