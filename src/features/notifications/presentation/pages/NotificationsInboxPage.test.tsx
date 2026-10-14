import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {
  PaginatedNotifications,
  UserNotification,
} from "../../domain";
import { notificationsCopy } from "../copy/notificationsCopy";
import { NotificationsInboxPage } from "./NotificationsInboxPage";
import { renderWithProviders } from "@/test/renderWithProviders";
import {
  grantPermissions,
  resetPermissionsMock,
} from "@/test/mocks/permissions";

Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => {};
Element.prototype.releasePointerCapture ??= () => {};

const mockList = vi.fn();
const mockMarkRead = vi.fn();
const mockMarkAllRead = vi.fn();

vi.mock("@features/notifications/infrastructure/notificationsApi", () => ({
  notificationsApi: {
    list: (...args: unknown[]) => mockList(...args),
    getUnreadCount: vi.fn().mockResolvedValue(0),
    markRead: (...args: unknown[]) => mockMarkRead(...args),
    markAllRead: (...args: unknown[]) => mockMarkAllRead(...args),
    dismiss: vi.fn(),
  },
}));

vi.mock("@shared/hooks", async () =>
  (await import("@/test/mocks/toast")).toastHooksMock(),
);

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
    title: "Gasto pendiente · V-TEST-001",
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

function emptyPage(): PaginatedNotifications {
  return {
    items: [],
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
    unreadCount: 0,
    syncedAt: "2026-06-01T10:00:00.000Z",
  };
}

async function openFiltersAndPickStatus(
  user: ReturnType<typeof userEvent.setup>,
  statusLabel: string,
) {
  await user.click(
    screen.getByRole("button", {
      name: notificationsCopy.filter.showFilters,
    }),
  );
  await user.click(
    screen.getByRole("combobox", { name: notificationsCopy.status }),
  );
  await user.click(await screen.findByRole("option", { name: statusLabel }));
}

describe("NotificationsInboxPage F1", () => {
  beforeEach(() => {
    mockList.mockReset();
    mockMarkRead.mockReset();
    mockMarkAllRead.mockReset();
    resetPermissionsMock();
    grantPermissions("all");
  });

  it("mantiene ListPageShell (título de página, no Workbench)", async () => {
    mockList.mockResolvedValue(emptyPage());

    renderWithProviders(<NotificationsInboxPage />, {
      route: "/notifications",
    });

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: notificationsCopy.pageTitle,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: notificationsCopy.filter.showFilters,
      }),
    ).toBeInTheDocument();
  });

  it("con filtros activos y lista vacía muestra empty filtrado + Limpiar filtros", async () => {
    mockList.mockResolvedValue(emptyPage());
    const user = userEvent.setup();

    renderWithProviders(<NotificationsInboxPage />, {
      route: "/notifications",
    });

    expect(
      await screen.findByText(notificationsCopy.emptyTitle),
    ).toBeInTheDocument();

    await openFiltersAndPickStatus(user, notificationsCopy.unread);

    await waitFor(() => {
      expect(
        screen.getByText(notificationsCopy.emptyFilteredTitle),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText(notificationsCopy.emptyFilteredDescription),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(notificationsCopy.emptyTitle),
    ).not.toBeInTheDocument();

    const clearButtons = screen.getAllByRole("button", {
      name: notificationsCopy.clearFilters,
    });
    expect(clearButtons.length).toBeGreaterThanOrEqual(1);

    await user.click(clearButtons[0]!);

    await waitFor(() => {
      expect(
        screen.getByText(notificationsCopy.emptyTitle),
      ).toBeInTheDocument();
    });
  });

  it("en error API muestra DetailAlertCard con Reintentar y no EmptyState Sin notificaciones", async () => {
    mockList.mockRejectedValue(new Error("falló la red"));
    const user = userEvent.setup();

    renderWithProviders(<NotificationsInboxPage />, {
      route: "/notifications",
    });

    expect(
      await screen.findByText(notificationsCopy.loadError),
    ).toBeInTheDocument();
    expect(screen.getByText(/falló la red/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: notificationsCopy.retry }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(notificationsCopy.emptyTitle),
    ).not.toBeInTheDocument();

    mockList.mockResolvedValue({
      ...emptyPage(),
      items: [createNotification()],
      total: 1,
      totalPages: 1,
      unreadCount: 1,
    });

    await user.click(
      screen.getByRole("button", { name: notificationsCopy.retry }),
    );

    expect(
      await screen.findByText("Gasto pendiente · V-TEST-001"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(notificationsCopy.loadError),
    ).not.toBeInTheDocument();
  });

  it("ListingFilterPanel muestra badge con recortes activos", async () => {
    mockList.mockResolvedValue(emptyPage());
    const user = userEvent.setup();

    renderWithProviders(<NotificationsInboxPage />, {
      route: "/notifications",
    });

    await screen.findByRole("button", {
      name: notificationsCopy.filter.showFilters,
    });

    await openFiltersAndPickStatus(user, notificationsCopy.unread);

    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });
});
