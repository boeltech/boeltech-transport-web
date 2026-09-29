import { describe, expect, it } from "vitest";

import {
  countClientPanelFilters,
  resolveClientListIsActive,
} from "./clientListFilters";

describe("clientListFilters", () => {
  it("no cuenta el catálogo sin recortes", () => {
    expect(
      countClientPanelFilters({ type: "", paymentTerms: "", status: "" }),
    ).toBe(0);
  });

  it("cuenta una unidad por dimensión recortada", () => {
    expect(
      countClientPanelFilters({
        type: "company",
        paymentTerms: "credit",
        status: "active",
      }),
    ).toBe(3);
  });

  it("mapea Activos/Inactivos al boolean de API y omite Todos", () => {
    expect(resolveClientListIsActive("active")).toBe(true);
    expect(resolveClientListIsActive("inactive")).toBe(false);
    expect(resolveClientListIsActive("")).toBeUndefined();
    expect(resolveClientListIsActive("all")).toBeUndefined();
    expect(resolveClientListIsActive("true")).toBeUndefined();
  });
});
