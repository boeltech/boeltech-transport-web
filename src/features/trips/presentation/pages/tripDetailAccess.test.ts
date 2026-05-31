import { describe, expect, it } from "vitest";
import { getTripDetailAccess } from "./tripDetailAccess";

describe("getTripDetailAccess", () => {
  it("blocks everything when user has no update permission", () => {
    const access = getTripDetailAccess("scheduled", false);
    expect(access.canEditStructural).toBe(false);
    expect(access.canEditBaseRate).toBe(false);
    expect(access.canManageExpenses).toBe(false);
  });

  it("allows structural edit and expenses for draft", () => {
    const access = getTripDetailAccess("draft", true);
    expect(access.canEditStructural).toBe(true);
    expect(access.canEditBaseRate).toBe(true);
    expect(access.canManageExpenses).toBe(true);
  });

  it("allows expenses but not structural edit for in_progress", () => {
    const access = getTripDetailAccess("in_progress", true);
    expect(access.canEditStructural).toBe(false);
    expect(access.canEditBaseRate).toBe(false);
    expect(access.canManageExpenses).toBe(true);
  });

  it("locks expenses and structural edit for completed", () => {
    const access = getTripDetailAccess("completed", true);
    expect(access.canEditStructural).toBe(false);
    expect(access.canEditBaseRate).toBe(false);
    expect(access.canManageExpenses).toBe(false);
  });
});
