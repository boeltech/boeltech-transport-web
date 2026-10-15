import { describe, expect, it } from "vitest";
import {
  DASHBOARD_PATH,
  isReportsHubHref,
  REPORTS_HUB_PATH,
  resolveDashboardOutgoingFrom,
  resolveReportsReturnHref,
} from "./reportsWayfinding";

describe("reportsWayfinding", () => {
  it("reconoce solo el hub de reportes", () => {
    expect(isReportsHubHref(REPORTS_HUB_PATH)).toBe(true);
    expect(isReportsHubHref("/reports?export=trips")).toBe(true);
    expect(isReportsHubHref("/finance/analysis?view=margin")).toBe(false);
    expect(isReportsHubHref(DASHBOARD_PATH)).toBe(false);
  });

  it("resolveReportsReturnHref acepta solo /reports interno (allowlist)", () => {
    expect(resolveReportsReturnHref("/reports")).toBe("/reports");
    expect(resolveReportsReturnHref("/reports?export=trips")).toBe(
      "/reports?export=trips",
    );
    expect(resolveReportsReturnHref(DASHBOARD_PATH)).toBeUndefined();
    expect(resolveReportsReturnHref("/finance")).toBeUndefined();
    expect(resolveReportsReturnHref("https://evil.example/reports")).toBeUndefined();
    expect(resolveReportsReturnHref("//evil.example/reports")).toBeUndefined();
    expect(resolveReportsReturnHref(undefined)).toBeUndefined();
  });

  it("resolveDashboardOutgoingFrom reenvía reports o cae a Inicio", () => {
    expect(resolveDashboardOutgoingFrom("/reports")).toBe("/reports");
    expect(resolveDashboardOutgoingFrom(undefined)).toBe(DASHBOARD_PATH);
    expect(resolveDashboardOutgoingFrom("/finance")).toBe(DASHBOARD_PATH);
  });
});
