import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { UserNotification } from "../../domain";
import { NOTIFICATION_SOURCE_LABELS } from "../copy/notificationsCopy";
import { NotificationRow } from "./NotificationRow";

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

describe("NotificationRow F2/F3", () => {
  it("muestra label humano de fuente, no el código crudo (D5)", () => {
    render(
      <NotificationRow
        notification={createNotification({ source: "billing_dispatch" })}
      />,
    );

    expect(
      screen.getByText(NOTIFICATION_SOURCE_LABELS.billing_dispatch),
    ).toBeInTheDocument();
    expect(screen.queryByText("billing_dispatch")).not.toBeInTheDocument();
  });

  it.each(
    Object.entries(NOTIFICATION_SOURCE_LABELS) as [
      UserNotification["source"],
      string,
    ][],
  )("fuente %s → %s", (source, label) => {
    render(
      <NotificationRow notification={createNotification({ source, id: source })} />,
    );

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.queryByText(source)).not.toBeInTheDocument();
  });

  it("mantiene jerarquía unread: título semibold + punto indicador", () => {
    const { rerender } = render(
      <NotificationRow notification={createNotification({ readAt: null })} />,
    );

    const unreadTitle = screen.getByText("Gasto pendiente · V-TEST-001");
    expect(unreadTitle).toHaveClass("font-semibold");
    expect(unreadTitle.closest("button")).toHaveClass("bg-muted/30");

    rerender(
      <NotificationRow
        notification={createNotification({
          readAt: "2026-06-01T12:00:00.000Z",
        })}
      />,
    );

    const readTitle = screen.getByText("Gasto pendiente · V-TEST-001");
    expect(readTitle).toHaveClass("font-medium");
    expect(readTitle).not.toHaveClass("font-semibold");
    expect(readTitle.closest("button")).not.toHaveClass("bg-muted/30");
  });

  it("en compact no muestra badge de fuente (campana)", () => {
    render(
      <NotificationRow
        notification={createNotification({ source: "approvals" })}
        compact
      />,
    );

    expect(
      screen.queryByText(NOTIFICATION_SOURCE_LABELS.approvals),
    ).not.toBeInTheDocument();
  });

  it("dispara onClick al activar la fila", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const notification = createNotification();

    render(
      <NotificationRow notification={notification} onClick={onClick} />,
    );

    await user.click(
      screen.getByRole("button", { name: /Gasto pendiente · V-TEST-001/i }),
    );

    expect(onClick).toHaveBeenCalledWith(notification);
  });

  it("expone affordance Abrir (chevron) para deep-link (D7)", () => {
    render(<NotificationRow notification={createNotification()} />);

    const row = screen.getByRole("button", {
      name: /Gasto pendiente · V-TEST-001/i,
    });
    expect(row).toHaveAccessibleName(/Abrir/i);
  });
});
