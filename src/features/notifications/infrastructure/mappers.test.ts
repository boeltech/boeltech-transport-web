import { describe, expect, it } from "vitest";
import {
  buildListParams,
  mapListNotificationsResponse,
  mapNotificationItem,
} from "./mappers";

describe("notifications mappers", () => {
  it("maps notification item to camelCase", () => {
    const item = mapNotificationItem({
      id: "n-1",
      source: "approvals",
      type: "trip_expense_pending",
      severity: "warning",
      title: "Gasto pendiente",
      body: "Detalle",
      action_href: "/finance/approvals",
      entity_type: "trip_expense",
      entity_id: "e-1",
      dedupe_key: "approvals:trip_expense:e-1",
      read_at: null,
      dismissed_at: null,
      metadata: { tripCode: "V-1" },
      created_at: "2026-06-01T10:00:00.000Z",
      updated_at: "2026-06-01T10:00:00.000Z",
    });

    expect(item.actionHref).toBe("/finance/approvals");
    expect(item.readAt).toBeNull();
  });

  it("builds list params omitting status=all", () => {
    expect(buildListParams({ status: "all", page: 2 })).toEqual({
      page: "2",
      page_size: "25",
    });
    expect(buildListParams({ status: "unread" }).status).toBe("unread");
  });

  it("maps paginated list response", () => {
    const result = mapListNotificationsResponse({
      data: [],
      pagination: { page: 1, page_size: 10, total: 0, total_pages: 1 },
      meta: { unread_count: 3, synced_at: "2026-06-01T10:00:00.000Z" },
    });
    expect(result.unreadCount).toBe(3);
  });
});
