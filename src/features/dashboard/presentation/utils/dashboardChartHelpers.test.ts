import { describe, expect, it } from "vitest";

import { formatDashboardTodayLabel } from "./dashboardChartHelpers";

describe("formatDashboardTodayLabel", () => {
  it("usa el día civil en America/Mexico_City", () => {
    const stillSundayInMexico = new Date("2026-09-28T04:30:00.000Z");
    expect(formatDashboardTodayLabel(stillSundayInMexico)).toBe(
      "domingo, 27 de sep de 2026",
    );
  });
});
