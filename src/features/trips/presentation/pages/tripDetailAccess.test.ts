import { describe, expect, it } from "vitest";
import { getTripDetailAccess } from "./tripDetailAccess";

describe("getTripDetailAccess", () => {
  const openPerms = {
    canUpdateTrip: true,
    canCreateExpense: true,
    canUpdateExpense: true,
    canDeleteExpense: true,
  };

  it("blocks everything when user has no update permission (legacy boolean)", () => {
    const access = getTripDetailAccess("scheduled", false);
    expect(access.canEditStructural).toBe(false);
    expect(access.canEditBaseRate).toBe(false);
    expect(access.canManageExpenses).toBe(false);
    expect(access.canCreateExpenses).toBe(false);
  });

  it("allows structural edit and expenses for draft", () => {
    const access = getTripDetailAccess("draft", openPerms);
    expect(access.canEditStructural).toBe(true);
    expect(access.canEditBaseRate).toBe(true);
    expect(access.canManageExpenses).toBe(true);
    expect(access.canCreateExpenses).toBe(true);
  });

  it("allows expenses but not structural edit for in_progress", () => {
    const access = getTripDetailAccess("in_progress", openPerms);
    expect(access.canEditStructural).toBe(false);
    expect(access.canEditBaseRate).toBe(false);
    expect(access.canManageExpenses).toBe(true);
  });

  it("keeps pre-close expenses gated by trips.update even with expenses.create", () => {
    const access = getTripDetailAccess("in_progress", {
      canUpdateTrip: false,
      canCreateExpense: true,
      canUpdateExpense: true,
      canDeleteExpense: true,
    });
    expect(access.canCreateExpenses).toBe(false);
    expect(access.canManageExpenses).toBe(false);
  });

  it("allows create on completed inside window with expenses.create without trips.update", () => {
    const access = getTripDetailAccess("completed", {
      canUpdateTrip: false,
      canCreateExpense: true,
      canUpdateExpense: true,
      canDeleteExpense: false,
      closedAt: "2026-05-01T12:00:00.000Z",
      now: "2026-05-15T12:00:00.000Z",
      role: "accountant",
    });
    expect(access.canEditStructural).toBe(false);
    expect(access.canCreateExpenses).toBe(true);
    expect(access.canUpdatePendingExpenses).toBe(true);
    expect(access.canDeletePendingExpenses).toBe(false);
    expect(access.expenseWindowOpen).toBe(true);
    expect(access.expenseWindowClosed).toBe(false);
  });

  it("hides post-close create CTA for operator while keeping pending mutate (PD-E)", () => {
    const access = getTripDetailAccess("completed", {
      canUpdateTrip: false,
      canCreateExpense: true,
      canUpdateExpense: true,
      canDeleteExpense: false,
      closedAt: "2026-05-01T12:00:00.000Z",
      now: "2026-05-15T12:00:00.000Z",
      role: "operator",
    });
    expect(access.canCreateExpenses).toBe(false);
    expect(access.canUpdatePendingExpenses).toBe(true);
    expect(access.expenseWindowOpen).toBe(true);
  });

  it("keeps post-close create for admin/manager/accountant (PD-E)", () => {
    for (const role of ["admin", "manager", "accountant"] as const) {
      const access = getTripDetailAccess("completed", {
        canUpdateTrip: false,
        canCreateExpense: true,
        canUpdateExpense: true,
        canDeleteExpense: true,
        closedAt: "2026-05-01T12:00:00.000Z",
        now: "2026-05-15T12:00:00.000Z",
        role,
      });
      expect(access.canCreateExpenses).toBe(true);
    }
  });

  it("locks expenses on completed outside the window", () => {
    const access = getTripDetailAccess("completed", {
      ...openPerms,
      closedAt: "2026-05-01T12:00:00.000Z",
      now: "2026-06-05T12:00:00.000Z",
    });
    expect(access.canCreateExpenses).toBe(false);
    expect(access.canManageExpenses).toBe(false);
    expect(access.expenseWindowOpen).toBe(false);
    expect(access.expenseWindowClosed).toBe(true);
  });

  it("locks expenses and structural edit for completed without closedAt", () => {
    const access = getTripDetailAccess("completed", openPerms);
    expect(access.canEditStructural).toBe(false);
    expect(access.canEditBaseRate).toBe(false);
    expect(access.canManageExpenses).toBe(false);
    expect(access.expenseWindowClosed).toBe(true);
  });
});
