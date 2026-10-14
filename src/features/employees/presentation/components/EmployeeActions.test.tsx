import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ComponentProps } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { EmployeeListItem } from "../../domain/entities";
import { employeesCopy } from "../copy/employeesCopy";
import { EmployeeActions } from "./EmployeeActions";

const { mockMutateAsync, mockHasPermission } = vi.hoisted(() => ({
  mockMutateAsync: vi.fn(),
  mockHasPermission: vi.fn(),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: (module: string, action: string) =>
      mockHasPermission(module, action),
  }),
}));

vi.mock("../../application/hooks/useEmployees", () => ({
  useTerminateEmployee: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const actionsCopy = employeesCopy.detail.actions;

function buildEmployee(
  overrides: Partial<EmployeeListItem> = {},
): EmployeeListItem {
  return {
    id: "emp-1",
    employeeNumber: "E-001",
    firstName: "Ana",
    lastName: "López",
    secondLastName: null,
    fullName: "Ana López",
    gender: null,
    department: "Operaciones",
    position: "Conductor",
    employmentType: "permanent",
    hireDate: "2024-01-15",
    status: "active",
    isActive: true,
    email: "ana@example.com",
    phone: "5512345678",
    ...overrides,
  };
}

function renderActions(
  props: Partial<ComponentProps<typeof EmployeeActions>> = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <EmployeeActions employee={buildEmployee()} {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("EmployeeActions (D1/D6/D10/D12)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "employees" && (action === "update" || action === "delete"),
    );
    mockMutateAsync.mockResolvedValue("emp-1");
  });

  it("dropdown de listado no ofrece Dar de baja (D1)", async () => {
    const user = userEvent.setup();
    renderActions({ variant: "dropdown" });

    await user.click(
      screen.getByRole("button", { name: employeesCopy.list.card.actionsAria }),
    );

    expect(
      screen.getByRole("menuitem", { name: actionsCopy.viewDetail }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: actionsCopy.edit }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: actionsCopy.terminate }),
    ).not.toBeInTheDocument();
  });

  it("header: Editar primary; Dar de baja outline (D6)", () => {
    renderActions({ variant: "buttons" });

    const edit = screen.getByRole("button", { name: actionsCopy.edit });
    const terminate = screen.getByRole("button", {
      name: actionsCopy.terminate,
    });

    expect(edit.className).toMatch(/bg-primary|default/);
    expect(terminate.className).not.toMatch(/bg-destructive(?!\/)/);
    expect(terminate.className).toMatch(/border|outline|text-destructive/);
  });

  it("dialog de baja no promete reactivación (D12)", async () => {
    const user = userEvent.setup();
    renderActions({ variant: "buttons" });

    await user.click(
      screen.getByRole("button", { name: actionsCopy.terminate }),
    );

    expect(screen.getByText(actionsCopy.terminateTitle)).toBeInTheDocument();
    const description = actionsCopy.terminateDescription("Ana López");
    expect(screen.getByText(description)).toBeInTheDocument();
    expect(description).not.toMatch(/editando su estado|podrás reactivar|puede revertirse/i);
    expect(screen.queryByRole("button", { name: /reactiv/i })).toBeNull();
  });

  it("error de baja muestra Alert inline en el Dialog (D10)", async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValueOnce(new Error("Viajes activos"));
    renderActions({ variant: "buttons" });

    await user.click(
      screen.getByRole("button", { name: actionsCopy.terminate }),
    );

    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: actionsCopy.terminate }),
    );

    expect(
      await within(dialog).findByText(actionsCopy.terminateErrorTitle),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Viajes activos")).toBeInTheDocument();
    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ id: "emp-1" }),
    );
  });
});
