import { describe, expect, it } from "vitest";
import {
  applyRbac,
  buildRoleDefaultLayout,
  buildSystemDefaultLayout,
  getCustomizableWidgets,
  getVisibleWidgetsInOrder,
  mergeWithDefaults,
  migrateLayoutV1toV2,
  normalizeLayout,
  reorderWidgets,
  setWidgetVisibility,
  type DashboardLayout,
  type WidgetId,
} from "./layout";

describe("dashboard layout v2", () => {
  it("normalizeLayout sorts by order and drops unknown ids", () => {
    const result = normalizeLayout({
      widgets: [
        { id: "alerts", visible: true, order: 2 },
        { id: "unknown" as "alerts", visible: true, order: 0 },
        { id: "operations_snapshot", visible: false, order: 1 },
      ],
    });
    expect(result.widgets.map((w) => w.id)).toEqual([
      "operations_snapshot",
      "alerts",
    ]);
  });

  it("mergeWithDefaults fills missing widgets and clears fixed-zone prefs", () => {
    const system = buildSystemDefaultLayout();
    const merged = mergeWithDefaults(
      {
        widgets: [
          { id: "alerts", visible: true, order: 0 },
          { id: "financial_comparison", visible: true, order: 1 },
        ],
      },
      system,
    );
    expect(merged.widgets.find((w) => w.id === "alerts")?.visible).toBe(false);
    expect(
      merged.widgets.find((w) => w.id === "financial_comparison")?.visible,
    ).toBe(true);
    expect(merged.widgets.length).toBe(system.widgets.length);
  });

  it("migrateLayoutV1toV2 forces Q11 off and ignores fixed-zone prefs", () => {
    const v1: DashboardLayout = {
      widgets: [
        { id: "alerts", visible: true, order: 0 },
        { id: "metric_trends", visible: true, order: 1 },
        { id: "financial_comparison", visible: true, order: 2 },
        { id: "vehicle_expense_ranking", visible: true, order: 3 },
        { id: "invoices_month", visible: true, order: 4 },
        { id: "trips_by_day", visible: true, order: 5 },
        { id: "branch_kpis", visible: false, order: 6 },
      ],
    };
    const v2 = migrateLayoutV1toV2(v1);
    expect(v2.widgets.find((w) => w.id === "alerts")?.visible).toBe(false);
    expect(v2.widgets.find((w) => w.id === "metric_trends")?.visible).toBe(
      false,
    );
    expect(
      v2.widgets.find((w) => w.id === "financial_comparison")?.visible,
    ).toBe(false);
    expect(
      v2.widgets.find((w) => w.id === "vehicle_expense_ranking")?.visible,
    ).toBe(false);
    expect(v2.widgets.find((w) => w.id === "invoices_month")?.visible).toBe(
      false,
    );
    expect(v2.widgets.find((w) => w.id === "trips_by_day")?.visible).toBe(true);
    expect(v2.widgets.find((w) => w.id === "branch_kpis")?.visible).toBe(false);
  });

  it("stored layout with retired financial_trend still loads and keeps prefs", () => {
    const stored: DashboardLayout = {
      widgets: [
        { id: "financial_trend" as WidgetId, visible: true, order: 0 },
        { id: "financial_comparison", visible: false, order: 1 },
        { id: "alerts", visible: true, order: 2 },
      ],
    };
    const system = buildSystemDefaultLayout();

    const normalized = normalizeLayout(stored);
    expect(normalized.widgets.map((w) => w.id)).toEqual([
      "financial_comparison",
      "alerts",
    ]);

    const merged = mergeWithDefaults(stored, system);
    expect(merged.widgets.some((w) => (w.id as string) === "financial_trend")).toBe(
      false,
    );
    expect(merged.widgets.length).toBe(system.widgets.length);
    expect(
      merged.widgets.find((w) => w.id === "financial_comparison")?.visible,
    ).toBe(false);
    expect(merged.widgets.find((w) => w.id === "alerts")?.visible).toBe(false);
  });

  it("applyRbac removes finance widgets when showFinance is false", () => {
    const layout = buildSystemDefaultLayout();
    const filtered = applyRbac(layout, {
      canReadTrips: true,
      showFinance: false,
      canReadBranches: true,
    });
    expect(
      filtered.widgets.some((w) => w.id === "financial_comparison"),
    ).toBe(false);
    expect(
      filtered.widgets.some((w) => w.id === "vehicle_expense_ranking"),
    ).toBe(false);
    expect(filtered.widgets.some((w) => w.id === "invoices_month")).toBe(
      false,
    );
    expect(filtered.widgets.some((w) => w.id === "metric_trends")).toBe(
      false,
    );
  });

  it("system default: Q11 extras off; recent_trips on for portals catalog", () => {
    const layout = buildSystemDefaultLayout();
    expect(
      layout.widgets.filter((w) => w.visible).map((w) => w.id),
    ).toEqual(["metric_trends", "recent_trips"]);

    const extras = getVisibleWidgetsInOrder(layout, {
      canReadTrips: true,
      showFinance: true,
      canReadBranches: true,
    }).map((w) => w.id);
    expect(extras).toEqual(["recent_trips"]);
  });

  it("portal default shows recent_trips without ops widgets", () => {
    const layout = buildSystemDefaultLayout();
    const clientVisible = getVisibleWidgetsInOrder(layout, {
      canReadTrips: true,
      showFinance: false,
      canReadBranches: false,
      isClientPortal: true,
    }).map((w) => w.id);
    expect(clientVisible).toEqual(["recent_trips"]);

    const driverVisible = getVisibleWidgetsInOrder(layout, {
      canReadTrips: true,
      showFinance: false,
      canReadBranches: false,
      isDriverPortal: true,
    }).map((w) => w.id);
    expect(driverVisible).toEqual(["recent_trips"]);
  });

  it("setWidgetVisibility ignores fixed zones; reorder only extras", () => {
    const base = buildSystemDefaultLayout();
    const ignored = setWidgetVisibility(base, "alerts", true);
    expect(ignored.widgets.find((w) => w.id === "alerts")?.visible).toBe(
      false,
    );

    const withExtra = setWidgetVisibility(base, "trips_by_day", true);
    expect(withExtra.widgets.find((w) => w.id === "trips_by_day")?.visible).toBe(
      true,
    );

    const reordered = reorderWidgets(withExtra, [
      "trips_by_day",
      "branch_kpis",
      "recent_trips",
    ]);
    const extras = reordered.widgets.filter(
      (w) =>
        w.id === "trips_by_day" ||
        w.id === "branch_kpis" ||
        w.id === "recent_trips",
    );
    expect(extras[0]?.id).toBe("trips_by_day");
  });

  it("getCustomizableWidgets excludes fixed zones", () => {
    const layout = buildRoleDefaultLayout("admin");
    const customizable = getCustomizableWidgets(layout, {
      canReadTrips: true,
      showFinance: true,
      canReadBranches: true,
    }).map((w) => w.id);
    expect(customizable).not.toContain("alerts");
    expect(customizable).not.toContain("metric_trends");
    expect(customizable).not.toContain("operations_snapshot");
    expect(customizable).not.toContain("fleet_drivers");
    expect(customizable).toContain("financial_comparison");
    expect(customizable).toContain("trips_by_day");
  });

  it("role product defaults v2: staff extras empty; portals recent_trips", () => {
    const financeStaff = {
      canReadTrips: true,
      showFinance: true,
      canReadBranches: true,
    };
    const opsStaff = {
      canReadTrips: true,
      showFinance: false,
      canReadBranches: true,
    };

    expect(
      getVisibleWidgetsInOrder(
        buildRoleDefaultLayout("admin"),
        financeStaff,
      ).map((w) => w.id),
    ).toEqual([]);

    expect(
      getVisibleWidgetsInOrder(
        buildRoleDefaultLayout("manager"),
        financeStaff,
      ).map((w) => w.id),
    ).toEqual([]);

    expect(
      getVisibleWidgetsInOrder(
        buildRoleDefaultLayout("accountant"),
        financeStaff,
      ).map((w) => w.id),
    ).toEqual([]);

    expect(
      getVisibleWidgetsInOrder(
        buildRoleDefaultLayout("dispatcher"),
        opsStaff,
      ).map((w) => w.id),
    ).toEqual([]);

    expect(
      getVisibleWidgetsInOrder(
        buildRoleDefaultLayout("operator"),
        opsStaff,
      ).map((w) => w.id),
    ).toEqual([]);

    expect(
      getVisibleWidgetsInOrder(buildRoleDefaultLayout("driver"), {
        canReadTrips: true,
        showFinance: false,
        canReadBranches: false,
        isDriverPortal: true,
      }).map((w) => w.id),
    ).toEqual(["recent_trips"]);

    expect(
      getVisibleWidgetsInOrder(buildRoleDefaultLayout("client"), {
        canReadTrips: true,
        showFinance: false,
        canReadBranches: false,
        isClientPortal: true,
      }).map((w) => w.id),
    ).toEqual(["recent_trips"]);
  });

  it("buildRoleDefaultLayout falls back to catalog when role is missing", () => {
    expect(buildRoleDefaultLayout(undefined)).toEqual(
      buildSystemDefaultLayout(),
    );
  });
});
