import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BranchEditPage } from "./BranchEditPage";
import { branchesCopy } from "../copy/branchesCopy";
import { BRANCH_EDIT_SECTION_IDS } from "../components/branchEditSections";
import { buildBranch } from "../../test/branchTestFixtures";
import { TooltipProvider } from "@shared/ui/tooltip";

const { mockUseBranch, mockMutate } = vi.hoisted(() => ({
  mockUseBranch: vi.fn(),
  mockMutate: vi.fn(),
}));

vi.mock("../../application", () => ({
  useBranch: (...args: unknown[]) => mockUseBranch(...args),
  useUpdateBranch: () => ({ mutate: mockMutate, isPending: false }),
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

// Data router required: BranchEditPage uses useUnsavedChangesGuard → useBlocker.
function renderEditPage(
  path = "/branches/22222222-2222-4222-8222-222222222222/edit",
  state?: { from?: string },
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      {
        path: "/branches/:id/edit",
        element: (
          <QueryClientProvider client={client}>
            <TooltipProvider>
              <BranchEditPage />
            </TooltipProvider>
          </QueryClientProvider>
        ),
      },
      {
        path: "/branches/:id",
        element: <div>Detalle</div>,
      },
      {
        path: "/branches",
        element: <div data-testid="branches-list">Listado</div>,
      },
    ],
    {
      initialEntries: [state ? { pathname: path, state } : path],
    },
  );
  return { ...render(<RouterProvider router={router} />), router };
}

describe("BranchEditPage F2 (D8 unsaved + rail)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBranch.mockReturnValue({
      data: buildBranch(),
      isLoading: false,
      isError: false,
    });
  });

  it("monta form con rail canónico y pie sticky", () => {
    const { container } = renderEditPage();
    const fc = branchesCopy.form;

    expect(
      screen.getByRole("navigation", { name: fc.edit.sidebar.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: new RegExp(fc.section.general.nav, "i") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: new RegExp(fc.section.contact.nav, "i") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: new RegExp(fc.section.location.nav, "i"),
      }),
    ).toBeInTheDocument();

    expect(document.getElementById(BRANCH_EDIT_SECTION_IDS.general)).toBeTruthy();
    expect(container.querySelector(".sticky.bottom-0")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: fc.submit.saveChanges }),
    ).toBeDisabled();
  });

  it("W7-01: con state.from, Volver y Cancelar usan la misma cola", async () => {
    const user = userEvent.setup();
    renderEditPage(
      "/branches/22222222-2222-4222-8222-222222222222/edit",
      { from: "/branches?status=inactive" },
    );

    await user.click(screen.getByRole("button", { name: /Volver/i }));
    expect(screen.getByTestId("branches-list")).toBeInTheDocument();
  });
});
