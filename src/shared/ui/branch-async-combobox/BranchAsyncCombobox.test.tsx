import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BranchAsyncCombobox } from "./BranchAsyncCombobox";

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const { mockGetAll, mockGetById } = vi.hoisted(() => ({
  mockGetAll: vi.fn(),
  mockGetById: vi.fn(),
}));

vi.mock("@features/branches/infrastructure", () => ({
  branchesApi: {
    getAll: (...args: unknown[]) => mockGetAll(...args),
    getById: (...args: unknown[]) => mockGetById(...args),
  },
}));

function renderWithClient(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("BranchAsyncCombobox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAll.mockResolvedValue({
      data: [
        {
          id: "branch-1",
          code: "MTY",
          name: "Monterrey",
          status: "active",
          isMain: false,
          city: "Monterrey",
          state: "NL",
          phone: null,
          isActive: true,
          createdAt: new Date("2026-01-01"),
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      meta: undefined,
    });
    mockGetById.mockResolvedValue({
      data: {
        id: "branch-1",
        code: "MTY",
        name: "Monterrey",
      },
    });
  });

  it("permite seleccionar una sucursal", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithClient(
      <BranchAsyncCombobox value="" onChange={onChange} id="branch-picker" />,
    );

    await user.click(screen.getByRole("combobox"));
    await waitFor(() => {
      expect(screen.getByText("Monterrey")).toBeInTheDocument();
    });
    await user.click(screen.getByText("Monterrey"));

    expect(onChange).toHaveBeenCalledWith("branch-1");
  });

  it("pasa búsqueda debounced a branchesApi.getAll", async () => {
    const user = userEvent.setup();

    renderWithClient(<BranchAsyncCombobox value="" onChange={vi.fn()} id="branch-search" />);

    await user.click(screen.getByRole("combobox"));
    await user.type(screen.getByPlaceholderText(/Buscar por código/i), "MTY");

    await waitFor(
      () => {
        expect(mockGetAll).toHaveBeenCalledWith(
          expect.objectContaining({
            filters: expect.objectContaining({ search: "MTY" }),
          }),
        );
      },
      { timeout: 2000 },
    );
  });
});
