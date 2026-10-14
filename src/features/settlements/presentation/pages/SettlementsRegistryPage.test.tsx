import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import { SettlementsRegistryPage } from "./SettlementsRegistryPage";
import { settlementsCopy } from "../copy/settlementsCopy";

const registryCopy = settlementsCopy.registry;

const { settlementsQuery } = vi.hoisted(() => ({
  settlementsQuery: {
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

vi.mock("@shared/ui/employee-async-combobox", () => ({
  EmployeeAsyncCombobox: ({
    id,
    placeholder,
  }: {
    id?: string;
    placeholder?: string;
  }) => <div data-testid={id ?? "employee-combobox"}>{placeholder}</div>,
}));

vi.mock("../../application/hooks", () => ({
  useSettlements: () => settlementsQuery,
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe("SettlementsRegistryPage F3", () => {
  beforeEach(() => {
    settlementsQuery.data = {
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
    settlementsQuery.isLoading = false;
    settlementsQuery.isFetching = false;
    settlementsQuery.isError = false;
    settlementsQuery.refetch.mockClear();
  });

  it("usa ListingFilterPanel para estado y operador (Historial deep-link)", async () => {
    const user = userEvent.setup();
    renderWithTheme(<SettlementsRegistryPage />);

    const filtersBtn = screen.getByRole("button", { name: /Filtros/ });
    expect(filtersBtn).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: settlementsCopy.workbench.actions.backToWorkbench,
      }),
    ).toBeInTheDocument();

    await user.click(filtersBtn);
    expect(
      await screen.findByText(registryCopy.filters.statusLabel),
    ).toBeInTheDocument();
    expect(
      screen.getByText(registryCopy.filters.operatorLabel),
    ).toBeInTheDocument();
  });

  it("error de carga usa DetailAlertCard con Reintentar en action", () => {
    settlementsQuery.isError = true;
    settlementsQuery.data = undefined;

    renderWithTheme(<SettlementsRegistryPage />);

    expect(screen.getByText(registryCopy.loadErrorTitle)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: registryCopy.retry }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(settlementsCopy.empty.settlementsTitle),
    ).not.toBeInTheDocument();
  });

  it("lista vacía usa EmptyState único del shell", () => {
    renderWithTheme(<SettlementsRegistryPage />);

    expect(
      screen.getByText(settlementsCopy.empty.settlementsTitle),
    ).toBeInTheDocument();
  });
});
