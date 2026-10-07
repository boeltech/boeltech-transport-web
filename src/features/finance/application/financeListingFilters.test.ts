import { describe, expect, it } from "vitest";
import {
  FINANCE_ANALYSIS_VIEWS,
  MARGIN_ANALYSIS_DIMENSIONS,
  isFinanceAnalysisView,
  parseExpenseDimension,
  parseExpenseGranularity,
  parseFinanceInvoiceStatus,
  parseProfitabilityDimension,
  parseProfitabilityLossFilter,
  parseProfitabilityScope,
  parseProfitabilityStatus,
  resolveFinanceAnalysisView,
  sanitizeAnalysisDimension,
} from "./financeListingFilters";
import {
  buildFinanceAnalysisSearchParams,
  buildFinanceCobrosPath,
  resolveLegacyFinanceLocation,
} from "./financeRoutes";

describe("resolveLegacyFinanceLocation", () => {
  it("maps hub tabs to clean routes", () => {
    expect(resolveLegacyFinanceLocation("?tab=cobros")).toBe("/finance/cobros");
    expect(resolveLegacyFinanceLocation("?tab=analysis&view=expenses")).toBe(
      "/finance/analysis?view=expenses",
    );
    expect(resolveLegacyFinanceLocation("?tab=approvals&status=pending")).toBe(
      "/finance/approvals?status=pending",
    );
  });

  it("redirects legacy tab aliases", () => {
    expect(resolveLegacyFinanceLocation("?tab=cobranza")).toBe("/finance/cobros");
    expect(resolveLegacyFinanceLocation("?tab=profitability")).toBe(
      "/finance/analysis?view=margin",
    );
    expect(resolveLegacyFinanceLocation("?tab=expenses")).toBe(
      "/finance/analysis?view=expenses",
    );
  });

  it("preserves cobros rfc when redirecting", () => {
    expect(resolveLegacyFinanceLocation("?tab=cobros&rfc=XAXX010101000")).toBe(
      "/finance/cobros?rfc=XAXX010101000",
    );
  });
});

describe("buildFinanceCobrosPath", () => {
  it("builds cobros path with optional rfc", () => {
    expect(buildFinanceCobrosPath()).toBe("/finance/cobros");
    expect(buildFinanceCobrosPath("xaxx010101000")).toBe(
      "/finance/cobros?rfc=XAXX010101000",
    );
  });
});

describe("buildFinanceAnalysisSearchParams", () => {
  it("keeps the period and drops the vehicle when going from Gastos to Rentabilidad", () => {
    const current = new URLSearchParams({
      view: "expenses",
      vehicleId: "vehicle-1",
      from: "2026-07-01",
      to: "2026-09-30",
      granularity: "week",
    });
    const result = buildFinanceAnalysisSearchParams("margin", {
      preserveFrom: current,
    });
    expect(result.get("view")).toBe("margin");
    expect(result.get("from")).toBe("2026-07-01");
    expect(result.get("to")).toBe("2026-09-30");
    expect(result.has("vehicleId")).toBe(false);
    expect(result.has("granularity")).toBe(false);
  });

  it("drops Rentabilidad-only params when going to Gastos", () => {
    const current = new URLSearchParams({
      view: "margin",
      scope: "pipeline",
      status: "loss",
      from: "2026-07-01",
    });
    const result = buildFinanceAnalysisSearchParams("expenses", {
      preserveFrom: current,
    });
    expect(result.get("from")).toBe("2026-07-01");
    expect(result.has("scope")).toBe(false);
    expect(result.has("status")).toBe(false);
  });

  it("drops the period when going to Mes a mes (it has its own 6/12 selector)", () => {
    const current = new URLSearchParams({
      view: "margin",
      from: "2026-07-01",
      to: "2026-09-30",
      scope: "all",
    });
    const result = buildFinanceAnalysisSearchParams("performance", {
      preserveFrom: current,
    });
    expect(result.toString()).toBe("view=performance");
  });

  it("only carries the «loss» status into Rentabilidad", () => {
    const withLoss = buildFinanceAnalysisSearchParams("margin", {
      preserveFrom: new URLSearchParams({ status: "loss" }),
    });
    expect(withLoss.get("status")).toBe("loss");
    const withHigh = buildFinanceAnalysisSearchParams("margin", {
      preserveFrom: new URLSearchParams({ status: "high" }),
    });
    expect(withHigh.has("status")).toBe(false);
  });

  it("drops grouping dimension when switching to performance", () => {
    const current = new URLSearchParams({ view: "margin", dimension: "client" });
    const result = buildFinanceAnalysisSearchParams("performance", {
      preserveFrom: current,
    });
    expect(result.get("view")).toBe("performance");
    expect(result.has("dimension")).toBe(false);
  });
});

describe("analysis filter parsers", () => {
  it("falls back to defaults on empty or invalid URL values", () => {
    expect(parseProfitabilityDimension("")).toBe("client");
    expect(parseExpenseDimension("month")).toBe("vehicle");
    expect(parseProfitabilityScope("")).toBe("operational");
    expect(parseProfitabilityStatus("all")).toBeUndefined();
    expect(parseExpenseGranularity("year")).toBe("month");
  });

  it("Rentabilidad no longer groups by month", () => {
    expect(MARGIN_ANALYSIS_DIMENSIONS).not.toContain("month");
    expect(parseProfitabilityDimension("month")).toBe("client");
  });

  it("only reads «loss» as the Rentabilidad status filter", () => {
    expect(parseProfitabilityLossFilter("loss")).toBe(true);
    expect(parseProfitabilityLossFilter("high")).toBe(false);
    expect(parseProfitabilityLossFilter("")).toBe(false);
  });

  it("sanitizeAnalysisDimension omits invalid values for the view", () => {
    expect(sanitizeAnalysisDimension("margin", "month")).toBeUndefined();
    expect(sanitizeAnalysisDimension("margin", "route")).toBe("route");
    expect(sanitizeAnalysisDimension("expenses", "month")).toBeUndefined();
    expect(sanitizeAnalysisDimension("performance", "vehicle")).toBeUndefined();
  });

  it("accepts performance as an analysis view", () => {
    expect(isFinanceAnalysisView("performance")).toBe(true);
    expect(isFinanceAnalysisView("yoy")).toBe(false);
  });

  it("orders the views Mes a mes · Rentabilidad · Gastos and defaults to Mes a mes", () => {
    expect(FINANCE_ANALYSIS_VIEWS).toEqual(["performance", "margin", "expenses"]);
    expect(resolveFinanceAnalysisView(null)).toBe("performance");
    expect(resolveFinanceAnalysisView("yoy")).toBe("performance");
    expect(resolveFinanceAnalysisView("margin")).toBe("margin");
  });
});

describe("parseFinanceInvoiceStatus", () => {
  it("keeps valid invoice statuses including stamping", () => {
    expect(parseFinanceInvoiceStatus("stamped")).toBe("stamped");
    expect(parseFinanceInvoiceStatus("all")).toBeUndefined();
  });
});
