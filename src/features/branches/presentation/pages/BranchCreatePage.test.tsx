import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BranchCreatePage } from "./BranchCreatePage";
import { branchesCopy } from "../copy/branchesCopy";
import { TooltipProvider } from "@shared/ui/tooltip";

vi.mock("../../application", () => ({
  useCreateBranch: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@shared/ui/address-input/AddressInput", () => ({
  default: () => <div data-testid="address-input-stub" />,
}));

vi.mock("@shared/ui/address-input/AddressGeolocationPanel", () => ({
  AddressGeolocationPanel: () => (
    <div data-testid="address-geolocation-panel-stub" />
  ),
}));

vi.mock("@shared/ui/location", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/ui/location")>();
  return {
    ...actual,
    LocationField: () => <div data-testid="location-field-stub" />,
  };
});

function renderCreatePage(state?: { from?: string }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      {
        path: "/branches/new",
        element: (
          <QueryClientProvider client={client}>
            <TooltipProvider>
              <BranchCreatePage />
            </TooltipProvider>
          </QueryClientProvider>
        ),
      },
      {
        path: "/branches",
        element: <div data-testid="branches-list">Listado</div>,
      },
      {
        path: "/employees/new",
        element: <div data-testid="employee-create">Alta empleado</div>,
      },
    ],
    {
      initialEntries: [
        state
          ? { pathname: "/branches/new", state }
          : "/branches/new",
      ],
    },
  );
  return render(<RouterProvider router={router} />);
}

describe("BranchCreatePage wayfinding (W7-02)", () => {
  it("cancel con state.from restaura cola del listado", async () => {
    const user = userEvent.setup();
    renderCreatePage({ from: "/branches?status=inactive" });

    expect(screen.getByText(branchesCopy.create.title)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Cancelar/i }));
    expect(screen.getByTestId("branches-list")).toBeInTheDocument();
  });

  it("cancel desde form empleado vuelve al alta de empleado", async () => {
    const user = userEvent.setup();
    renderCreatePage({ from: "/employees/new" });

    await user.click(screen.getByRole("button", { name: /Cancelar/i }));
    expect(screen.getByTestId("employee-create")).toBeInTheDocument();
  });
});
