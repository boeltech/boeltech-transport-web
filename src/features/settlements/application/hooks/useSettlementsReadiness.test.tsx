import { describe, expect, it } from "vitest";
import {
  COMPENSATION_TEMPLATES_PATH,
  compensationTemplateOperatorsPath,
} from "@features/compensation/application/compensationRoutes";
import { buildSettlementsReadinessItems } from "./useSettlementsReadiness";

describe("buildSettlementsReadinessItems", () => {
  it("is not ready when templates or assignments are missing", () => {
    const { items, isReady } = buildSettlementsReadinessItems({
      employeesTotal: 0,
      templatesTotal: 0,
      assignmentsTotal: 0,
      completedTripsTotal: 0,
    });

    expect(isReady).toBe(false);
    expect(items).toHaveLength(4);

    const byId = Object.fromEntries(items.map((item) => [item.id, item]));
    expect(byId.operators_salary).toMatchObject({
      value: 0,
      status: "empty",
      href: "/employees",
    });
    expect(byId.templates_active).toMatchObject({
      value: 0,
      status: "empty",
      href: COMPENSATION_TEMPLATES_PATH,
    });
    expect(byId.assignments_active).toMatchObject({
      value: 0,
      status: "empty",
      href: COMPENSATION_TEMPLATES_PATH,
    });
    expect(byId.trips_completed).toMatchObject({
      value: 0,
      status: "info",
      href: "/trips",
    });
  });

  it("is ready with active scheme and assignment; salary stays discovery info", () => {
    const { items, isReady } = buildSettlementsReadinessItems({
      employeesTotal: 3,
      templatesTotal: 1,
      assignmentsTotal: 2,
      completedTripsTotal: 5,
      firstTemplateId: "tpl-1",
    });

    expect(isReady).toBe(true);
    const byId = Object.fromEntries(items.map((item) => [item.id, item]));
    expect(byId.operators_salary).toMatchObject({
      value: 3,
      status: "info",
    });
    expect(byId.templates_active).toMatchObject({ status: "ok" });
    expect(byId.assignments_active).toMatchObject({
      status: "ok",
      href: compensationTemplateOperatorsPath("tpl-1"),
    });
    expect(byId.trips_completed).toMatchObject({
      value: 5,
      status: "ok",
    });
  });

  it("omits trips chip when completedTripsTotal is undefined", () => {
    const { items } = buildSettlementsReadinessItems({
      employeesTotal: 1,
      templatesTotal: 1,
      assignmentsTotal: 1,
    });

    expect(items.some((item) => item.id === "trips_completed")).toBe(false);
  });
});
