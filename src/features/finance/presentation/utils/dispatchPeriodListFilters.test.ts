import { describe, expect, it } from "vitest";

import { countDispatchPeriodPanelFilters } from "./dispatchPeriodListFilters";

describe("countDispatchPeriodPanelFilters", () => {
  it("no cuenta el padrón sin recortes", () => {
    expect(
      countDispatchPeriodPanelFilters({ status: "", billingSchemeId: "" }),
    ).toBe(0);
  });

  it("cuenta estado y frecuencia", () => {
    expect(
      countDispatchPeriodPanelFilters({
        status: "cancelled",
        billingSchemeId: "scheme-1",
      }),
    ).toBe(2);
  });
});
