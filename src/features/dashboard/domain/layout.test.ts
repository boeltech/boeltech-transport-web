import { describe, expect, it } from "vitest";
import {
  applyRbac,
  buildSystemDefaultLayout,
  mergeWithDefaults,
  normalizeLayout,
  reorderWidgets,
  setWidgetVisibility,
} from "./layout";

describe("dashboard layout", () => {
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

  it("mergeWithDefaults fills missing widgets from base", () => {
    const system = buildSystemDefaultLayout();
    const merged = mergeWithDefaults(
      { widgets: [{ id: "alerts", visible: false, order: 0 }] },
      system,
    );
    const alerts = merged.widgets.find((w) => w.id === "alerts");
    expect(alerts?.visible).toBe(false);
    expect(merged.widgets.length).toBe(system.widgets.length);
  });

  it("applyRbac removes finance widgets when showFinance is false", () => {
    const layout = buildSystemDefaultLayout();
    const filtered = applyRbac(layout, {
      canReadTrips: true,
      showFinance: false,
      canReadBranches: true,
    });
    expect(
      filtered.widgets.some((w) => w.id === "financial_trend"),
    ).toBe(false);
    expect(
      filtered.widgets.some((w) => w.id === "financial_comparison"),
    ).toBe(false);
    expect(
      filtered.widgets.some((w) => w.id === "vehicle_expense_ranking"),
    ).toBe(false);
    expect(filtered.widgets.some((w) => w.id === "metric_trends")).toBe(
      false,
    );
    expect(filtered.widgets[0]?.id).toBe("operations_snapshot");
  });

  it("system default puts month scorecard first for finance-capable layouts", () => {
    const layout = buildSystemDefaultLayout();
    expect(layout.widgets[0]?.id).toBe("metric_trends");
    const withFinance = applyRbac(layout, {
      canReadTrips: true,
      showFinance: true,
      canReadBranches: true,
    });
    expect(withFinance.widgets[0]?.id).toBe("metric_trends");
    expect(withFinance.widgets[1]?.id).toBe("operations_snapshot");
  });

  it("setWidgetVisibility and reorderWidgets update prefs", () => {
    const base = buildSystemDefaultLayout();
    const hidden = setWidgetVisibility(base, "alerts", false);
    expect(hidden.widgets.find((w) => w.id === "alerts")?.visible).toBe(
      false,
    );

    const ids = base.widgets.map((w) => w.id);
    const reversed = [...ids].reverse();
    const reordered = reorderWidgets(base, reversed);
    expect(reordered.widgets[0]?.id).toBe(reversed[0]);
  });

  it("applyRbac hides fleet widgets for client portal", () => {
    const layout = buildSystemDefaultLayout();
    const filtered = applyRbac(layout, {
      canReadTrips: true,
      showFinance: false,
      canReadBranches: false,
      isClientPortal: true,
    });
    expect(
      filtered.widgets.some((w) => w.id === "operations_snapshot"),
    ).toBe(false);
    expect(filtered.widgets.some((w) => w.id === "alerts")).toBe(false);
    expect(filtered.widgets.some((w) => w.id === "fleet_drivers")).toBe(
      false,
    );
    expect(filtered.widgets.some((w) => w.id === "recent_trips")).toBe(
      true,
    );
  });

  it("applyRbac hides ops/alerts/fleet widgets for driver portal", () => {
    const layout = buildSystemDefaultLayout();
    const filtered = applyRbac(layout, {
      canReadTrips: true,
      showFinance: false,
      canReadBranches: false,
      isDriverPortal: true,
    });
    expect(
      filtered.widgets.some((w) => w.id === "operations_snapshot"),
    ).toBe(false);
    expect(filtered.widgets.some((w) => w.id === "alerts")).toBe(false);
    expect(filtered.widgets.some((w) => w.id === "fleet_drivers")).toBe(
      false,
    );
    expect(filtered.widgets.some((w) => w.id === "recent_trips")).toBe(
      true,
    );
    expect(filtered.widgets.some((w) => w.id === "trips_by_day")).toBe(
      true,
    );
  });
});
