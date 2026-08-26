import { describe, expect, it } from "vitest";
import {
  getReportsCatalogItemsByGroup,
  getVisibleReportsCatalogItems,
} from "./reportsHubCatalog";

describe("reportsHubCatalog", () => {
  const financeAccess = {
    canFinanceAnalytics: true,
    canReadTrips: true,
    canReadBranches: true,
  };

  const operationalAccess = {
    canFinanceAnalytics: false,
    canReadTrips: true,
    canReadBranches: true,
  };

  it("exposes five catalog entries for finance-enabled roles", () => {
    expect(getVisibleReportsCatalogItems(financeAccess).map((item) => item.id)).toEqual([
      "margin",
      "receivables",
      "expenses",
      "operations",
      "branches",
    ]);
  });

  it("hides finance catalog entries without finance.read", () => {
    expect(getVisibleReportsCatalogItems(operationalAccess).map((item) => item.id)).toEqual([
      "operations",
      "branches",
    ]);
  });

  it("groups catalog items by financial and operational sections", () => {
    const groups = getReportsCatalogItemsByGroup(financeAccess);
    expect(groups.financial.map((item) => item.id)).toEqual([
      "margin",
      "receivables",
      "expenses",
    ]);
    expect(groups.operational.map((item) => item.id)).toEqual([
      "operations",
      "branches",
    ]);
  });

  it("links catalog entries to existing analytic routes", () => {
    const items = getVisibleReportsCatalogItems(financeAccess);
    expect(items.find((item) => item.id === "margin")?.href).toBe(
      "/finance/analysis?view=margin",
    );
    expect(items.find((item) => item.id === "receivables")?.href).toBe("/finance");
    expect(items.find((item) => item.id === "expenses")?.href).toBe(
      "/finance/analysis?view=expenses",
    );
    expect(items.find((item) => item.id === "operations")?.href).toBe("/dashboard");
    expect(items.find((item) => item.id === "branches")?.href).toBe("/dashboard");
  });
});
