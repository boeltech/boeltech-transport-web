import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {
  PaginatedNotifications,
  UserNotification,
} from "../../domain";
import { notificationsCopy } from "../copy/notificationsCopy";
import { NotificationInboxPanel } from "./NotificationInboxPanel";
import { renderWithProviders } from "@/test/renderWithProviders";
import {
  grantPermissions,
  resetPermissionsMock,
} from "@/test/mocks/permissions";

const mockList = vi.fn();

vi.mock("@features/notifications/infrastructure/notificationsApi", () => ({
  notificationsApi: {
    list: (...args: unknown[]) => mockList(...args),
    getUnreadCount: vi.fn().mockResolvedValue(0),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    dismiss: vi.fn(),
  },
}));

vi.mock("@shared/permissions", async () =>
  (await import("@/test/mocks/permissions")).permissionsModuleMock(),
);

function createNotification(
  overrides: Partial<UserNotification> = {},
): UserNotification {
  return {
    id: "notif-1",
    source: "approvals",
    type: "trip_expense_pending",
    severity: "warning",
    title: "Gasto pendiente · V-PANEL-001",
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
    ...overrides,
  };
}

function pageOf(
  items: UserNotification[],
  unreadCount = items.length,
): PaginatedNotifications {
  return {
    items,
    page: 1,
    pageSize: 8,
    total: items.length,
    totalPages: 1,
    unreadCount,
    syncedAt: "2026-06-01T10:00:00.000Z",
  };
}

describe("NotificationInboxPanel F3", () => {
  beforeEach(() => {
    mockList.mockReset();
    resetPermissionsMock();
    grantPermissions("all");
  });

  it("empty: EmptyState con panelEmpty y Ver todas intacto (D6)", async () => {
    mockList.mockResolvedValue(pageOf([], 0));

    renderWithProviders(
      <NotificationInboxPanel onItemClick={vi.fn()} />,
    );

    expect(
      await screen.findByRole("heading", {
        name: notificationsCopy.panelEmpty,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: notificationsCopy.viewAll }),
    ).toHaveAttribute("href", "/notifications");
    expect(
      screen.queryByText(notificationsCopy.loadError),
    ).not.toBeInTheDocument();
  });

  it("error: mensaje + Reintentar; no EmptyState de vacío (D6)", async () => {
    mockList.mockRejectedValue(new Error("boom"));

    renderWithProviders(
      <NotificationInboxPanel onItemClick={vi.fn()} />,
    );

    expect(
      await screen.findByText(notificationsCopy.loadError),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: notificationsCopy.retry }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: notificationsCopy.panelEmpty,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: notificationsCopy.viewAll }),
    ).toBeInTheDocument();
  });

  it("Reintentar vuelve a pedir la lista", async () => {
    const user = userEvent.setup();
    mockList
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce(pageOf([createNotification()], 1));

    renderWithProviders(
      <NotificationInboxPanel onItemClick={vi.fn()} />,
    );

    await user.click(
      await screen.findByRole("button", { name: notificationsCopy.retry }),
    );

    await waitFor(() => {
      expect(mockList.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
    expect(
      await screen.findByText("Gasto pendiente · V-PANEL-001"),
    ).toBeInTheDocument();
  });
});
