import { describe, expect, it } from "vitest";
import {
  capacityFromUserListMeta,
  resolveUserPlanCapacity,
} from "./userPlanCapacity";

describe("resolveUserPlanCapacity", () => {
  it("no bloquea mientras el plan no resuelve", () => {
    const capacity = resolveUserPlanCapacity(10, undefined);
    expect(capacity.isPlanResolved).toBe(false);
    expect(capacity.canAdd).toBe(true);
    expect(capacity.limitReached).toBe(false);
    expect(capacity.unlimited).toBe(false);
  });

  it("respeta el tope finito del plan", () => {
    expect(resolveUserPlanCapacity(2, 5).canAdd).toBe(true);
    expect(resolveUserPlanCapacity(2, 5).limitReached).toBe(false);

    const atCap = resolveUserPlanCapacity(5, 5);
    expect(atCap.canAdd).toBe(false);
    expect(atCap.limitReached).toBe(true);
    expect(atCap.overQuota).toBe(false);
  });

  it("marca sobrecupo cuando hay más activos que el plan", () => {
    const over = resolveUserPlanCapacity(7, 5);
    expect(over.overQuota).toBe(true);
    expect(over.limitReached).toBe(true);
    expect(over.canAdd).toBe(false);
  });

  it("con maxUsers null no hay límite ni bloqueo", () => {
    const capacity = resolveUserPlanCapacity(100, null);
    expect(capacity.unlimited).toBe(true);
    expect(capacity.canAdd).toBe(true);
    expect(capacity.limitReached).toBe(false);
    expect(capacity.overQuota).toBe(false);
  });
});

describe("capacityFromUserListMeta", () => {
  it("no bloquea cuando meta está ausente", () => {
    const capacity = capacityFromUserListMeta(undefined);
    expect(capacity.canAdd).toBe(true);
    expect(capacity.isPlanResolved).toBe(false);
  });

  it("usa activeCount y maxUsers del listado", () => {
    const capacity = capacityFromUserListMeta({
      activeCount: 3,
      maxUsers: 5,
      limitReached: false,
      overQuota: false,
      overQuotaCount: 0,
    });
    expect(capacity.activeCount).toBe(3);
    expect(capacity.maxUsers).toBe(5);
    expect(capacity.canAdd).toBe(true);
  });
});
