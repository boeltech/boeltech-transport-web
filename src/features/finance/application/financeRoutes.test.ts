import { describe, expect, it } from "vitest";
import {
  buildFinanceAnalysisSearchParams,
  resolveLegacyFinanceLocation,
} from "./financeRoutes";

describe("financeRoutes", () => {
  it("resolveLegacyFinanceLocation maps summary to /finance", () => {
    expect(resolveLegacyFinanceLocation("?tab=summary")).toBe("/finance");
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
});
