import { describe, expect, it } from "vitest";

import { branchesCopy } from "./branchesCopy";

const copy = branchesCopy.list;

describe("branchesCopy.list", () => {
  it("usa copy corto en search, panel, vista y exportar", () => {
    expect(copy.filter.searchPlaceholder).toBe("Código, nombre o ciudad");
    expect(copy.filter.showFilters).toBe("Filtros");
    expect(copy.filter.statusAll).toBe("Todos");
    expect(copy.filter.typeAll).toBe("Todos");
    expect(copy.showDeleted.label).toBe("Eliminadas");
    expect(copy.actions.export).toBe("Exportar");
  });

  it("no promete estado, calle, CP ni sucursal en el placeholder", () => {
    expect(copy.filter.searchPlaceholder).not.toMatch(
      /estado|calle|\bcp\b|sucursal|buscar por/i,
    );
  });

  it("distingue empty virgen del recortado y no usa Más filtros", () => {
    expect(copy.empty.descriptionClear).toMatch(/primera sucursal/i);
    expect(copy.empty.descriptionFiltered).toMatch(/limpia/i);
    expect(copy.empty.descriptionClear).not.toMatch(/limpia/i);
    expect(JSON.stringify({ filter: copy.filter, empty: copy.empty })).not.toMatch(
      /Más filtros/,
    );
  });
});
