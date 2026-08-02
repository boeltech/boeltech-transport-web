import { describe, expect, it } from "vitest";
import {
  buildFinanceTabSearchParams,
  resolveFinanceLegacyTab,
} from "./financeListingFilters";

describe("resolveFinanceLegacyTab", () => {
  it("keeps hub tabs", () => {
    expect(resolveFinanceLegacyTab("cobros")).toEqual({
      tab: "cobros",
      redirected: false,
    });
    expect(resolveFinanceLegacyTab("analysis")).toEqual({
      tab: "analysis",
      redirected: false,
    });
  });

  it("redirects legacy tabs", () => {
    expect(resolveFinanceLegacyTab("cobranza")).toEqual({
      tab: "cobros",
      redirected: true,
    });
    expect(resolveFinanceLegacyTab("profitability")).toEqual({
      tab: "analysis",
      view: "margin",
      redirected: true,
    });
    expect(resolveFinanceLegacyTab("expenses")).toEqual({
      tab: "analysis",
      view: "expenses",
      redirected: true,
    });
    expect(resolveFinanceLegacyTab("reports")).toEqual({
      tab: "analysis",
      view: "margin",
      redirected: true,
    });
  });
});

describe("buildFinanceTabSearchParams", () => {
  it("adds analysis view only for analysis tab", () => {
    expect(buildFinanceTabSearchParams("cobros").toString()).toBe("tab=cobros");
    expect(buildFinanceTabSearchParams("analysis").toString()).toBe(
      "tab=analysis&view=margin",
    );
    expect(
      buildFinanceTabSearchParams("analysis", { view: "expenses" }).toString(),
    ).toBe("tab=analysis&view=expenses");
  });

  it("preserves expense filters while changing analysis views", () => {
    const current = new URLSearchParams({
      tab: "analysis",
      view: "expenses",
      vehicleId: "vehicle-1",
      from: "2026-07-01",
      to: "2026-07-31",
    });

    const result = buildFinanceTabSearchParams("analysis", {
      view: "margin",
      preserveFrom: current,
    });

    expect(result.get("vehicleId")).toBe("vehicle-1");
    expect(result.get("from")).toBe("2026-07-01");
    expect(result.get("to")).toBe("2026-07-31");
    expect(result.get("view")).toBe("margin");
  });
});
