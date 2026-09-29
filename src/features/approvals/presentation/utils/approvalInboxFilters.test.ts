import { describe, expect, it, vi } from "vitest";
import type { ApprovableItem } from "../../domain";
import { approvalsCopy } from "../copy/approvalsCopy";
import {
  APPROVAL_STATUS_ALL,
  buildApprovalContextChips,
  buildApprovalEmptyState,
  countApprovalPanelFilters,
  hasApprovalUserFilters,
  resolveDriverFilterLabel,
  resolveTripFilterLabel,
  resolveVehicleFilterLabel,
} from "./approvalInboxFilters";

const copy = approvalsCopy.inbox;

const tripExpenseItem: ApprovableItem = {
  approvableType: "trip_expense",
  id: "exp-1",
  amount: 100,
  currency: "MXN",
  category: "fuel",
  status: "pending",
  submittedAt: "2026-06-01T10:00:00.000Z",
  submittedBy: "u1",
  approvedAt: null,
  approvedBy: null,
  rejectedAt: null,
  rejectionReason: null,
  context: {
    approvableType: "trip_expense",
    tripId: "trip-1",
    tripCode: "V-2026-001",
    driverId: "drv-1",
    driverFullName: "Juan Pérez",
    vehicleId: "veh-1",
    vehicleUnitNumber: "ECO-12",
    expenseCategory: "fuel",
    description: "Diesel",
    occurredAt: "2026-06-01T09:00:00.000Z",
  },
};

const advanceItem: ApprovableItem = {
  approvableType: "driver_advance_request",
  id: "adv-1",
  amount: 500,
  currency: "MXN",
  category: "cash",
  status: "pending",
  submittedAt: "2026-06-01T10:00:00.000Z",
  submittedBy: "u1",
  approvedAt: null,
  approvedBy: null,
  rejectedAt: null,
  rejectionReason: null,
  context: {
    approvableType: "driver_advance_request",
    employeeId: "emp-9",
    employeeFullName: "Ana López",
    folio: "ANT-22",
  },
};

const emptyContext = {
  tripId: null,
  tripCode: null,
  driverId: null,
  vehicleId: null,
};

describe("approvalInboxFilters", () => {
  it("treats status=all as a user filter without forcing pending", () => {
    expect(
      hasApprovalUserFilters({
        search: "",
        status: APPROVAL_STATUS_ALL,
        category: "",
        fromDate: "",
        toDate: "",
        context: emptyContext,
      }),
    ).toBe(true);
  });

  it("does not treat default pending-only view as user filters", () => {
    expect(
      hasApprovalUserFilters({
        search: "",
        status: "pending",
        category: "",
        fromDate: "",
        toDate: "",
        context: emptyContext,
      }),
    ).toBe(false);
  });

  it("does not count pending in the Filtros badge", () => {
    expect(
      countApprovalPanelFilters({
        status: "pending",
        category: "",
        fromDate: "",
        toDate: "",
        showCategory: true,
      }),
    ).toBe(0);
  });

  it("counts status, category and date as panel recortes", () => {
    expect(
      countApprovalPanelFilters({
        status: "approved",
        category: "fuel",
        fromDate: "2026-09-01",
        toDate: "",
        showCategory: true,
      }),
    ).toBe(3);
  });

  it("ignores leftover category when the control is hidden", () => {
    expect(
      countApprovalPanelFilters({
        status: "pending",
        category: "fuel",
        fromDate: "",
        toDate: "",
        showCategory: false,
      }),
    ).toBe(0);
  });

  it("resolves trip label from URL tripCode first", () => {
    expect(resolveTripFilterLabel("trip-1", "V-FROM-URL", [])).toBe(
      "V-FROM-URL",
    );
  });

  it("resolves trip label from loaded items when URL has only tripId", () => {
    expect(resolveTripFilterLabel("trip-1", null, [tripExpenseItem])).toBe(
      "V-2026-001",
    );
  });

  it("falls back to Viaje instead of the UUID", () => {
    expect(resolveTripFilterLabel("trip-unknown", null, [])).toBe(
      copy.filters.tripUnknown,
    );
  });

  it("resolves operator and unit names from loaded items", () => {
    expect(resolveDriverFilterLabel("drv-1", [tripExpenseItem])).toBe(
      "Juan Pérez",
    );
    expect(resolveDriverFilterLabel("emp-9", [advanceItem])).toBe("Ana López");
    expect(resolveVehicleFilterLabel("veh-1", [tripExpenseItem])).toBe(
      "ECO-12",
    );
    expect(resolveDriverFilterLabel("missing", [])).toBe(
      copy.filters.driverUnknown,
    );
    expect(resolveVehicleFilterLabel("missing", [])).toBe(
      copy.filters.vehicleUnknown,
    );
  });

  it("builds context chips with names, not UUIDs", () => {
    const onRemove = vi.fn();
    const chips = buildApprovalContextChips(
      {
        tripId: "trip-1",
        tripCode: null,
        driverId: "drv-1",
        vehicleId: "veh-1",
      },
      {
        trip: "V-2026-001",
        driver: "Juan Pérez",
        vehicle: "ECO-12",
      },
      onRemove,
    );

    expect(chips.map((chip) => chip.label)).toEqual([
      copy.filters.tripChip("V-2026-001"),
      copy.filters.driverChip("Juan Pérez"),
      copy.filters.vehicleChip("ECO-12"),
    ]);
    expect(chips.map((chip) => chip.label).join(" ")).not.toContain("trip-1");
  });

  it("builds clear empty state when no user filters", () => {
    const state = buildApprovalEmptyState(false, null);
    expect(state.title).toBeTruthy();
    expect(state.description).toContain("pendientes");
  });

  it("does not suggest changing status in the filtered empty state", () => {
    const state = buildApprovalEmptyState(true, null);
    expect(state.description).toBe(copy.empty.descriptionFiltered);
    expect(state.description).not.toMatch(/estado/i);
  });
});
