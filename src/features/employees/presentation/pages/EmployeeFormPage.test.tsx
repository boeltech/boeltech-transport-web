import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EmployeeFormPage } from "./EmployeeFormPage";
import { employeesCopy } from "../copy/employeesCopy";
import { TooltipProvider } from "@shared/ui/tooltip";
import { MODULE_LIST_PATH_LABELS } from "@shared/utils/masterWayfinding";

vi.mock("../../application/hooks/useEmployees", () => ({
  useCreateEmployee: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateEmployee: () => ({ mutateAsync: vi.fn(), isPending: false }),
  employeeQueryKeys: { detail: (id: string) => ["employees", id] },
}));

vi.mock("@features/branches", () => ({
  BranchStatus: { ACTIVE: "active" },
  useBranches: () => ({ data: { data: [], meta: undefined } }),
}));

vi.mock("@shared/ui/address-input", () => ({
  AddressInput: () => <div data-testid="address-input-stub" />,
  EntityAddressForm: () => null,
  buildGeocodingEntityFormSection: () => null,
  setFormCoordinates: vi.fn(),
}));

// Data router required: EmployeeFormPage uses useUnsavedChangesGuard → useBlocker.
function renderCreatePage(state?: { from?: string }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      {
        path: "/employees/new",
        element: (
          <QueryClientProvider client={client}>
            <TooltipProvider>
              <EmployeeFormPage />
            </TooltipProvider>
          </QueryClientProvider>
        ),
      },
      {
        path: "/employees",
        element: <div data-testid="employees-list">Listado</div>,
      },
    ],
    {
      initialEntries: [
        state
          ? { pathname: "/employees/new", state }
          : "/employees/new",
      ],
    },
  );
  return render(<RouterProvider router={router} />);
}

describe("EmployeeFormPage F2 (D8 dirty create) + F3 (D14 copy)", () => {
  it("monta wizard de alta con data router (unsaved guard)", () => {
    renderCreatePage();
    const fc = employeesCopy.form;

    expect(
      screen.getByRole("heading", { name: fc.create.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(fc.create.subtitle)).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: fc.create.wizardAriaLabel }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Siguiente" }),
    ).toBeInTheDocument();
  });

  it("usa migas staff al listado (sin flecha Volver)", () => {
    renderCreatePage();
    const fc = employeesCopy.form;
    const crumbs = screen.getByRole("navigation", { name: "Migas" });
    expect(within(crumbs).getByRole("list")).toBeInTheDocument();
    expect(
      within(crumbs).getByRole("link", {
        name: MODULE_LIST_PATH_LABELS["/employees"] ?? "Empleados",
      }),
    ).toHaveAttribute("href", "/employees");
    expect(
      within(crumbs)
        .getByText(fc.create.title)
        .closest("[aria-current='page']"),
    ).not.toBeNull();
    expect(
      screen.queryByRole("button", { name: /Volver/i }),
    ).not.toBeInTheDocument();
  });

  it("W7-02: cancel con state.from restaura cola del listado", async () => {
    const user = userEvent.setup();
    renderCreatePage({ from: "/employees?status=active&page=2" });

    await user.click(screen.getByRole("button", { name: /Cancelar/i }));
    expect(screen.getByTestId("employees-list")).toBeInTheDocument();
  });
});
