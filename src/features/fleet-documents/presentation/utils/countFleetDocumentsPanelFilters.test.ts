import { describe, expect, it } from "vitest";
import { countFleetDocumentsPanelFilters } from "./countFleetDocumentsPanelFilters";

describe("countFleetDocumentsPanelFilters", () => {
  it("counts only panel filters (docType / status)", () => {
    expect(countFleetDocumentsPanelFilters({ docType: "", status: "" })).toBe(
      0,
    );
    expect(
      countFleetDocumentsPanelFilters({ docType: "insurance", status: "" }),
    ).toBe(1);
    expect(
      countFleetDocumentsPanelFilters({
        docType: "license",
        status: "expired",
      }),
    ).toBe(2);
  });
});
