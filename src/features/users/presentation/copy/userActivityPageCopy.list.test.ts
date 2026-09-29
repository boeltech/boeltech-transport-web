import { describe, expect, it } from "vitest";

import { userActivityPageCopy } from "./userActivityPageCopy";

const copy = userActivityPageCopy;

describe("userActivityPageCopy toolbar", () => {
  it("usa Filtros y no Más filtros", () => {
    expect(copy.filters.showFilters).toBe("Filtros");
    expect(JSON.stringify(copy.filters)).not.toMatch(/Más filtros/);
  });

  it("distingue empty virgen, ventana y recorte", () => {
    expect(copy.empty.virginTitle).toMatch(/Todavía no hay movimientos/);
    expect(copy.empty.windowTitle).toMatch(/este periodo/);
    expect(copy.empty.recorteTitle).toMatch(/estos filtros/);
    expect(copy.empty.virginDescription).not.toMatch(/limpia|quita los filtros/i);
    expect(copy.filters.clearRecortes).toBe("Limpiar filtros");
    expect(copy.filters.viewAllHistory).toMatch(/todo el historial/i);
  });
});
