/**
 * Smoke — inbox de notificaciones (list → mark read → count).
 * Mock de API; no requiere backend.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PaginatedNotifications, UserNotification } from "@features/notifications/domain";
import { NotificationsInboxPage } from "@features/notifications/presentation/pages/NotificationsInboxPage";

const mockList = vi.fn();
const mockMarkRead = vi.fn();
const mockMarkAllRead = vi.fn();

vi.mock("@features/notifications/infrastructure/notificationsApi", () => ({
  notificationsApi: {
    list: (...args: unknown[]) => mockList(...args),
    getUnreadCount: vi.fn().mockResolvedValue(1),
    markRead: (...args: unknown[]) => mockMarkRead(...args),
    markAllRead: (...args: unknown[]) => mockMarkAllRead(...args),
    dismiss: vi.fn(),
  },
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({
      toastSuccess: vi.fn(),
      toastError: vi.fn(),
    }),
  };
});

function createNotification(): UserNotification {
  return {
    id: "notif-1",
    source: "approvals",
    type: "trip_expense_pending",
    severity: "warning",
    title: "Gasto pendiente · V-SMOKE-001",
    body: "Diesel ruta",
    actionHref: "/finance/approvals?status=pending&type=trip_expense",
    entityType: "trip_expense",
    entityId: "expense-1",
    dedupeKey: "approvals:trip_expense:expense-1",
    readAt: null,
    dismissedAt: null,
    metadata: {},
    createdAt: "2026-06-01T10:00:00.000Z",
    updatedAt: "2026-06-01T10:00:00.000Z",
  };
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/notifications"]}>
        <NotificationsInboxPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("notifications inbox smoke", () => {
  beforeEach(() => {
    mockList.mockReset();
    mockMarkRead.mockReset();
    mockMarkAllRead.mockReset();
  });

  it("lists notifications and marks one as read on click", async () => {
    const item = createNotification();
    const page: PaginatedNotifications = {
      items: [item],
      page: 1,
      pageSize: 25,
      total: 1,
      totalPages: 1,
      unreadCount: 1,
      syncedAt: "2026-06-01T10:00:00.000Z",
    };
    mockList.mockResolvedValue(page);
    mockMarkRead.mockResolvedValue({ ...item, readAt: "2026-06-01T11:00:00.000Z" });

    renderPage();

    expect(await screen.findByText(item.title)).toBeInTheDocument();

    const rowButton = screen.getByText(item.title).closest("button");
    expect(rowButton).toBeTruthy();
    await userEvent.click(rowButton!);

    await waitFor(() => {
      expect(mockMarkRead).toHaveBeenCalledWith(item.id);
    });
  });
});
