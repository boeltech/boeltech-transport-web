import { describe, expect, it } from "vitest";
import type { UserNotification } from "../../domain";
import {
  filterNotificationsForPortal,
  isStaffOpsNotificationType,
} from "./portalNotificationVisibility";

function stub(
  partial: Pick<UserNotification, "id" | "type">,
): UserNotification {
  return {
    id: partial.id,
    source: "dashboard",
    type: partial.type,
    severity: "warning",
    title: "t",
    body: null,
    actionHref: "/",
    entityType: null,
    entityId: null,
    dedupeKey: partial.id,
    readAt: null,
    dismissedAt: null,
    metadata: {},
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("portalNotificationVisibility", () => {
  it("flags fleet document and overdue types as staff-ops", () => {
    expect(isStaffOpsNotificationType("license_expiring")).toBe(true);
    expect(isStaffOpsNotificationType("insurance_expiring")).toBe(true);
    expect(isStaffOpsNotificationType("sct_permit_expiring")).toBe(true);
    expect(isStaffOpsNotificationType("overdue_trip")).toBe(true);
    expect(isStaffOpsNotificationType("trip_expense_pending")).toBe(false);
  });

  it("keeps all items for staff", () => {
    const items = [
      stub({ id: "1", type: "license_expiring" }),
      stub({ id: "2", type: "trip_expense_pending" }),
    ];
    expect(filterNotificationsForPortal(items, false)).toHaveLength(2);
  });

  it("hides staff-ops alerts for portal roles", () => {
    const items = [
      stub({ id: "1", type: "license_expiring" }),
      stub({ id: "2", type: "insurance_expiring" }),
      stub({ id: "3", type: "trip_expense_pending" }),
    ];
    expect(filterNotificationsForPortal(items, true).map((i) => i.id)).toEqual([
      "3",
    ]);
  });
});
