import { beforeEach, describe, expect, it } from "vitest";
import { localDashboardLayoutStore } from "./layoutStore";

describe("localDashboardLayoutStore v2 migration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("migra layout v1 a v2 y fuerza Q11 off", () => {
    localStorage.setItem(
      "boeltech-dashboard-layout:user:u1",
      JSON.stringify({
        widgets: [
          { id: "alerts", visible: true, order: 0 },
          { id: "financial_comparison", visible: true, order: 1 },
          { id: "trips_by_day", visible: true, order: 2 },
        ],
      }),
    );

    const layout = localDashboardLayoutStore.getUserLayout("u1");
    expect(layout).not.toBeNull();
    expect(layout?.widgets.find((w) => w.id === "alerts")?.visible).toBe(false);
    expect(
      layout?.widgets.find((w) => w.id === "financial_comparison")?.visible,
    ).toBe(false);
    expect(layout?.widgets.find((w) => w.id === "trips_by_day")?.visible).toBe(
      true,
    );
    expect(
      localStorage.getItem("boeltech-dashboard-layout:v2:user:u1"),
    ).toBeTruthy();
  });
});
