import { describe, expect, it } from "vitest";
import {
  FINANCE_APPROVALS_PATH,
  FINANCE_COBROS_PATH,
  FINANCE_HUB_PATH,
  FINANCE_INVOICEABLE_PATH,
  FINANCE_INVOICES_PATH,
  buildFinanceAnalysisHref,
  buildFinanceAnalysisSearchParams,
  buildFinanceMarginMonthHref,
  resolveLegacyFinanceLocation,
} from "./financeRoutes";

describe("financeRoutes", () => {
  it("exporta paths canónicos del hub Finanzas", () => {
    expect(FINANCE_HUB_PATH).toBe("/finance");
    expect(FINANCE_INVOICEABLE_PATH).toBe("/finance/invoiceable");
    expect(FINANCE_INVOICES_PATH).toBe("/finance/invoices");
    expect(FINANCE_COBROS_PATH).toBe("/finance/cobros");
    expect(FINANCE_APPROVALS_PATH).toBe("/finance/approvals");
  });

  it("resolveLegacyFinanceLocation maps summary to /finance", () => {
    expect(resolveLegacyFinanceLocation("?tab=summary")).toBe("/finance");
  });

  it("resolveLegacyFinanceLocation maps dispatch-runs to envíos del periodo", () => {
    expect(resolveLegacyFinanceLocation("?tab=dispatch-runs")).toBe(
      "/finance/dispatch/period",
    );
  });

  it("resolveLegacyFinanceLocation maps dispatch to workbench root", () => {
    expect(resolveLegacyFinanceLocation("?tab=dispatch")).toBe(
      "/finance/dispatch",
    );
  });

  it("buildFinanceAnalysisSearchParams drops month dimension for expenses view", () => {
    const current = new URLSearchParams({
      dimension: "month",
      from: "2026-07-01",
    });
    const result = buildFinanceAnalysisSearchParams("expenses", {
      preserveFrom: current,
    });
    expect(result.get("dimension")).toBeNull();
    expect(result.get("from")).toBe("2026-07-01");
  });

  it("buildFinanceAnalysisSearchParams drops month dimension for margin view too", () => {
    const result = buildFinanceAnalysisSearchParams("margin", {
      preserveFrom: new URLSearchParams({ dimension: "month" }),
    });
    expect(result.get("dimension")).toBeNull();
  });

  it("buildFinanceAnalysisHref preserves from/to between margin and expenses", () => {
    const current = new URLSearchParams({
      view: "margin",
      from: "2026-07-01",
      to: "2026-09-30",
      scope: "pipeline",
      status: "loss",
    });
    expect(buildFinanceAnalysisHref("expenses", { preserveFrom: current })).toBe(
      "/finance/analysis?from=2026-07-01&to=2026-09-30&view=expenses",
    );
    const fromExpenses = new URLSearchParams({
      view: "expenses",
      from: "2026-07-01",
      to: "2026-09-30",
      vehicleId: "veh-1",
    });
    expect(buildFinanceAnalysisHref("margin", { preserveFrom: fromExpenses })).toBe(
      "/finance/analysis?from=2026-07-01&to=2026-09-30&view=margin",
    );
  });

  it("buildFinanceMarginMonthHref opens Rentabilidad with that whole month as the period", () => {
    expect(buildFinanceMarginMonthHref("2026-09")).toBe(
      "/finance/analysis?view=margin&from=2026-09-01&to=2026-09-30",
    );
    expect(buildFinanceMarginMonthHref("2028-02")).toBe(
      "/finance/analysis?view=margin&from=2028-02-01&to=2028-02-29",
    );
  });

  it("legacy ?tab=profitability still lands on Rentabilidad", () => {
    expect(resolveLegacyFinanceLocation("?tab=profitability")).toBe(
      "/finance/analysis?view=margin",
    );
  });
});
