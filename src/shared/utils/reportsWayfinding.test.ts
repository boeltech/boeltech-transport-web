import { describe, expect, it } from "vitest";
import { isReportsHubHref, REPORTS_HUB_PATH } from "./reportsWayfinding";

describe("reportsWayfinding", () => {
  it("reconoce solo el hub de reportes", () => {
    expect(isReportsHubHref(REPORTS_HUB_PATH)).toBe(true);
    expect(isReportsHubHref("/reports?export=trips")).toBe(true);
    expect(isReportsHubHref("/finance/analysis?view=margin")).toBe(false);
    expect(isReportsHubHref("/dashboard")).toBe(false);
  });
});
