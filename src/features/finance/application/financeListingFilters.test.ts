import { describe, expect, it } from "vitest";
import {
  parseExpenseDimension,
  parseExpenseGranularity,
  parseFinanceInvoiceStatus,
  parseProfitabilityDimension,
  parseProfitabilityScope,
  parseProfitabilityStatus,
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
  it("sets view and preserves compatible filters", () => {
    const current = new URLSearchParams({
      view: "expenses",
      vehicleId: "vehicle-1",
      from: "2026-07-01",
    });
    const result = buildFinanceAnalysisSearchParams("margin", {
      preserveFrom: current,
    });
    expect(result.get("view")).toBe("margin");
    expect(result.get("vehicleId")).toBe("vehicle-1");
    expect(result.get("from")).toBe("2026-07-01");
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

  it("sanitizeAnalysisDimension omits invalid values for the view", () => {
    expect(sanitizeAnalysisDimension("margin", "month")).toBe("month");
    expect(sanitizeAnalysisDimension("expenses", "month")).toBeUndefined();
  });
});

describe("parseFinanceInvoiceStatus", () => {
  it("keeps valid invoice statuses including stamping", () => {
    expect(parseFinanceInvoiceStatus("stamped")).toBe("stamped");
    expect(parseFinanceInvoiceStatus("all")).toBeUndefined();
  });
});
