import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EmployeeFormPage } from "./EmployeeFormPage";
import { employeesCopy } from "../copy/employeesCopy";
import { TooltipProvider } from "@shared/ui/tooltip";

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
function renderCreatePage() {
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
        element: <div>Listado</div>,
      },
    ],
    { initialEntries: ["/employees/new"] },
  );
  return render(<RouterProvider router={router} />);
}

describe("EmployeeFormPage F2 (D8 dirty create) + F3 (D14 copy)", () => {
  it("monta wizard de alta con data router (unsaved guard)", () => {
    renderCreatePage();
    const fc = employeesCopy.form;

    expect(screen.getByText(fc.create.title)).toBeInTheDocument();
    expect(screen.getByText(fc.create.subtitle)).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: fc.create.wizardAriaLabel }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Siguiente" }),
    ).toBeInTheDocument();
  });
});
