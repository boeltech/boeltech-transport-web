import { describe, expect, it } from "vitest";
import { arViewCountParams } from "./usePlatformSaasAr";

describe("arViewCountParams", () => {
  it("maps pending / overdue / all to the same keys as setView", () => {
    expect(arViewCountParams("pending")).toEqual({
      page: 1,
      pageSize: 1,
      periodKey: undefined,
      tenantId: undefined,
      status: "open",
    });
    expect(arViewCountParams("overdue")).toEqual({
      page: 1,
      pageSize: 1,
      periodKey: undefined,
      tenantId: undefined,
      status: "open",
      minDaysOverdue: 1,
    });
    expect(arViewCountParams("all")).toEqual({
      page: 1,
      pageSize: 1,
      periodKey: undefined,
      tenantId: undefined,
    });
  });

  it("forwards periodKey and tenantId on every view", () => {
    const filters = { periodKey: "2026-07", tenantId: "tenant-1" };

    expect(arViewCountParams("pending", filters)).toMatchObject(filters);
    expect(arViewCountParams("overdue", filters)).toMatchObject(filters);
    expect(arViewCountParams("all", filters)).toMatchObject(filters);
    expect(arViewCountParams("all", filters)).not.toHaveProperty("status");
    expect(arViewCountParams("all", filters)).not.toHaveProperty(
      "minDaysOverdue",
    );
  });
});
