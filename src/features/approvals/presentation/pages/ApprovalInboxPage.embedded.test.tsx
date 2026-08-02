/**
 * La bandeja vive como tab del hub de Finanzas (`/finance?tab=approvals`):
 * embebida no repite el encabezado y sus acciones no pueden perder el tab.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { approvalsCopy } from "../copy/approvalsCopy";
import { ApprovalInboxPage } from "./ApprovalInboxPage";

const mockList = vi.fn();

vi.mock("@features/approvals/infrastructure/approvalsApi", () => ({
  approvalsApi: {
    list: (...args: unknown[]) => mockList(...args),
    approve: vi.fn(),
    reject: vi.fn(),
    bulk: vi.fn(),
    getPendingCount: vi.fn().mockResolvedValue(0),
  },
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
    isLoading: false,
    isAuthenticated: true,
    role: "manager",
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return { ...actual, useToast: () => ({ toast: vi.fn() }) };
});

function LocationProbe() {
  const { pathname, search } = useLocation();
  return <div data-testid="location">{`${pathname}${search}`}</div>;
}

function renderEmbedded(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <ApprovalInboxPage embedded />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ApprovalInboxPage embebida en el hub", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 25, total: 0, totalPages: 0 },
    });
  });

  it("no repite el encabezado del hub y conserva la descripción", async () => {
    renderEmbedded("/finance?tab=approvals&type=trip_expense&status=pending");

    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });

    expect(
      screen.queryByRole("heading", { name: approvalsCopy.inbox.title }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(approvalsCopy.inbox.description),
    ).toBeInTheDocument();
  });

  it("mantiene el tab del hub al limpiar filtros", async () => {
    const user = userEvent.setup();
    renderEmbedded("/finance?tab=approvals&type=trip_expense&category=fuel");

    await user.click(
      await screen.findByRole("button", { name: /limpiar filtros/i }),
    );

    await waitFor(() => {
      const location = screen.getByTestId("location").textContent ?? "";
      expect(location).toContain("/finance");
      expect(location).toContain("tab=approvals");
      expect(location).not.toContain("category=fuel");
    });
  });
});
