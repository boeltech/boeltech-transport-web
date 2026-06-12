import { describe, expect, it } from "vitest";
import {
  mapApprovableItem,
  mapListApprovalsResponse,
  type ApiApprovableItemRaw,
} from "./mappers";

const tripExpenseRaw: ApiApprovableItemRaw = {
  approvable_type: "trip_expense",
  id: "expense-1",
  amount: 1500,
  currency: "MXN",
  category: "fuel",
  status: "pending",
  submitted_at: "2026-06-01T10:00:00.000Z",
  submitted_by: "user-1",
  approved_at: null,
  approved_by: null,
  rejected_at: null,
  rejection_reason: null,
  context: {
    approvable_type: "trip_expense",
    trip_id: "trip-1",
    trip_code: "V-2026-001",
    driver_id: "driver-1",
    driver_full_name: "Juan Pérez",
    vehicle_id: "vehicle-1",
    vehicle_unit_number: "T-101",
    expense_category: "fuel",
    description: "Carga de diesel",
    occurred_at: "2026-06-01T09:00:00.000Z",
  },
};

describe("mapApprovableItem", () => {
  it("maps snake_case item with trip expense context", () => {
    const item = mapApprovableItem(tripExpenseRaw);

    expect(item.approvableType).toBe("trip_expense");
    expect(item.amount).toBe(1500);
    expect(item.context.approvableType).toBe("trip_expense");
    if (item.context.approvableType === "trip_expense") {
      expect(item.context.tripCode).toBe("V-2026-001");
      expect(item.context.driverFullName).toBe("Juan Pérez");
    }
  });
});

describe("mapListApprovalsResponse", () => {
  it("normalizes page_size pagination to limit/totalPages", () => {
    const mapped = mapListApprovalsResponse({
      data: [tripExpenseRaw],
      pagination: {
        page: 2,
        page_size: 25,
        total: 40,
        total_pages: 2,
      },
    });

    expect(mapped.pagination.page).toBe(2);
    expect(mapped.pagination.limit).toBe(25);
    expect(mapped.pagination.total).toBe(40);
    expect(mapped.pagination.totalPages).toBe(2);
    expect(mapped.data).toHaveLength(1);
  });
});
