import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { SettlementsAdvancesPage } from "./SettlementsAdvancesPage";
import { settlementsDriverAdvanceApprovalsPath } from "../config/settlementWorkbenchConfig";
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
}));

vi.mock(
  "@features/compensation/presentation/hooks/useRegisterCompensationHubCreateAction",
  () => ({
    useRegisterCompensationHubCreateAction: () => undefined,
  }),
);

describe("SettlementsAdvancesPage F3", () => {
  beforeEach(() => {
    mockPermissions.granted = new Set([
      "settlements.read",
      "settlements.create",
      "finance_approvals.read",
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

  it("CTA Ver en Aprobaciones apunta a la bandeja de anticipos", () => {
    renderWithTheme(<SettlementsAdvancesPage />);
    const link = screen.getByRole("link", {
      name: advancesCopy.viewInApprovals,
    });
    expect(link).toHaveAttribute(
      "href",
      settlementsDriverAdvanceApprovalsPath(),
    );
  });

  it("sin finance_approvals.read no muestra Ver en Aprobaciones", () => {
    mockPermissions.granted = new Set(["settlements.read", "settlements.create"]);
    renderWithTheme(<SettlementsAdvancesPage />);
    expect(
      screen.queryByRole("link", { name: advancesCopy.viewInApprovals }),
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

  it("lista vacía usa EmptyState único del shell", () => {
    renderWithTheme(<SettlementsAdvancesPage />);

    expect(
      screen.getByText(settlementsCopy.empty.advancesTitle),
    ).toBeInTheDocument();
  });

  it("H-02: chip de operador usa nombre resuelto (sin UUID)", () => {
    renderWithTheme(<SettlementsAdvancesPage />, {
      route: ["/finance/settlements/advances?employeeId=emp-1"],
    });

    expect(
      screen.getByText(settlementsCopy.workbench.chip.employee("Pedro Infante")),
    ).toBeInTheDocument();
    expect(screen.queryByText(/emp-1/i)).not.toBeInTheDocument();
    expect(screen.getByText(advancesCopy.operatorAll)).toBeInTheDocument();
  });
});
