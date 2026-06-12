/**
 * Smoke WS-F — flujo bandeja de aprobaciones (list → approve → vacío).
 * Mock de API; no requiere backend ni Playwright.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ApprovableItem } from "@features/approvals/domain";
import { ApprovalInboxPage } from "@features/approvals/presentation/pages/ApprovalInboxPage";

const mockList = vi.fn();
const mockApprove = vi.fn();

vi.mock("@features/approvals/infrastructure/approvalsApi", () => ({
  approvalsApi: {
    list: (...args: unknown[]) => mockList(...args),
    approve: (...args: unknown[]) => mockApprove(...args),
    reject: vi.fn(),
    bulk: vi.fn(),
    getPendingCount: vi.fn().mockResolvedValue(1),
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
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

function createPendingItem(): ApprovableItem {
  return {
    approvableType: "trip_expense",
    id: "expense-smoke-1",
    amount: 1200,
    currency: "MXN",
    category: "fuel",
    status: "pending",
    submittedAt: "2026-06-01T10:00:00.000Z",
    submittedBy: "user-1",
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectionReason: null,
    context: {
      approvableType: "trip_expense",
      tripId: "trip-smoke-1",
      tripCode: "V-SMOKE-001",
      driverId: null,
      driverFullName: "Operador Demo",
      vehicleId: null,
      vehicleUnitNumber: "T-99",
      expenseCategory: "fuel",
      description: "Diesel ruta",
      occurredAt: "2026-06-01T09:00:00.000Z",
    },
  };
}

function renderInbox() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={[
          "/finance/approvals?type=trip_expense&status=pending",
        ]}
      >
        <ApprovalInboxPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("smoke approvals workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const item = createPendingItem();
    let approved = false;

    mockList.mockImplementation(async () => {
      if (approved) {
        return {
          data: [],
          pagination: { page: 1, limit: 25, total: 0, totalPages: 0 },
        };
      }
      return {
        data: [item],
        pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
      };
    });

    mockApprove.mockImplementation(async () => {
      approved = true;
      return {
        data: { ...item, status: "approved" as const },
        message: "Gasto aprobado",
      };
    });
  });

  it("lists a pending expense, approves it, and clears the inbox", async () => {
    const user = userEvent.setup();
    renderInbox();

    expect(await screen.findByRole("link", { name: "V-SMOKE-001" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Aprobar" }));
    await user.click(screen.getByRole("button", { name: "Aprobar gasto" }));

    await waitFor(() => {
      expect(mockApprove).toHaveBeenCalledWith("trip_expense", "expense-smoke-1");
      expect(mockList.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    await waitFor(() => {
      expect(screen.queryByRole("link", { name: "V-SMOKE-001" })).not.toBeInTheDocument();
      expect(screen.getByText("Bandeja al día")).toBeInTheDocument();
    });
  });
});
