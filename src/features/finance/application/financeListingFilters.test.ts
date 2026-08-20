import { describe, expect, it } from "vitest";
import {
  buildFinanceTabSearchParams,
  parseExpenseDimension,
  parseExpenseGranularity,
  parseProfitabilityDimension,
  parseProfitabilityScope,
  parseProfitabilityStatus,
  resolveFinanceLegacyTab,
  sanitizeAnalysisDimension,
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

  it("sets rfc only on cobros tab", () => {
    expect(
      buildFinanceTabSearchParams("cobros", { rfc: "xaxx010101000" }).toString(),
    ).toBe("tab=cobros&rfc=XAXX010101000");
    expect(
      buildFinanceTabSearchParams("summary", { rfc: "XAXX010101000" }).toString(),
    ).toBe("tab=summary");
  });

  it("preserves rfc when staying on cobros", () => {
    const current = new URLSearchParams({
      tab: "cobros",
      rfc: "XAXX010101000",
    });
    const result = buildFinanceTabSearchParams("cobros", {
      preserveFrom: current,
    });
    expect(result.get("rfc")).toBe("XAXX010101000");
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

  it("preserves compatible dimension when switching expenses to margin", () => {
    const current = new URLSearchParams({
      tab: "analysis",
      view: "expenses",
      dimension: "vehicle",
    });
    const result = buildFinanceTabSearchParams("analysis", {
      view: "margin",
      preserveFrom: current,
    });
    expect(result.get("dimension")).toBe("vehicle");
    expect(result.get("view")).toBe("margin");
  });

  it("drops month dimension when switching margin to expenses", () => {
    const current = new URLSearchParams({
      tab: "analysis",
      view: "margin",
      dimension: "month",
      from: "2026-07-01",
    });
    const result = buildFinanceTabSearchParams("analysis", {
      view: "expenses",
      preserveFrom: current,
    });
    expect(result.get("dimension")).toBeNull();
    expect(result.get("from")).toBe("2026-07-01");
    expect(result.get("view")).toBe("expenses");
  });

  it("preserves client dimension when switching expenses to margin", () => {
    const current = new URLSearchParams({
      tab: "analysis",
      view: "expenses",
      dimension: "client",
    });
    const result = buildFinanceTabSearchParams("analysis", {
      view: "margin",
      preserveFrom: current,
    });
    expect(result.get("dimension")).toBe("client");
  });
});

describe("analysis filter parsers", () => {
  it("falls back to defaults on empty or invalid URL values", () => {
    expect(parseProfitabilityDimension("")).toBe("client");
    expect(parseProfitabilityDimension("bogus")).toBe("client");
    expect(parseExpenseDimension("month")).toBe("vehicle");
    expect(parseExpenseDimension("bogus")).toBe("vehicle");
    expect(parseProfitabilityScope("")).toBe("operational");
    expect(parseProfitabilityScope("invalid")).toBe("operational");
    expect(parseProfitabilityStatus("")).toBeUndefined();
    expect(parseProfitabilityStatus("all")).toBeUndefined();
    expect(parseProfitabilityStatus("bogus")).toBeUndefined();
    expect(parseExpenseGranularity("")).toBe("month");
    expect(parseExpenseGranularity("year")).toBe("month");
  });

  it("keeps valid enum values", () => {
    expect(parseProfitabilityDimension("month")).toBe("month");
    expect(parseExpenseDimension("client")).toBe("client");
    expect(parseProfitabilityScope("pipeline")).toBe("pipeline");
    expect(parseProfitabilityStatus("loss")).toBe("loss");
    expect(parseExpenseGranularity("day")).toBe("day");
  });

  it("sanitizeAnalysisDimension omits invalid values for the view", () => {
    expect(sanitizeAnalysisDimension("margin", "month")).toBe("month");
    expect(sanitizeAnalysisDimension("expenses", "month")).toBeUndefined();
    expect(sanitizeAnalysisDimension("expenses", "vehicle")).toBe("vehicle");
    expect(sanitizeAnalysisDimension("margin", "")).toBeUndefined();
  });
});
