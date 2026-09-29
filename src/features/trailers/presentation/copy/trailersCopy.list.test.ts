import { describe, expect, it } from "vitest";

import { trailersCopy } from "./trailersCopy";

const copy = trailersCopy.list;

describe("trailersCopy.list", () => {
  it("usa copy corto en search y panel", () => {
    expect(copy.filter.searchPlaceholder).toBe("Placa");
    expect(copy.filter.showFilters).toBe("Filtros");
    expect(copy.filter.statusAll).toBe("Todos");
  });

  it("no promete tipo, notas, estado ni «Buscar por» en el placeholder", () => {
    expect(copy.filter.searchPlaceholder).not.toMatch(
      /tipo|notas|estado|buscar por/i,
    );
  });

  it("distingue empty virgen del recortado", () => {
    expect(copy.empty.descriptionClear).toMatch(/primer remolque/i);
    expect(copy.empty.descriptionFiltered).toMatch(/limpia/i);
    expect(copy.empty.descriptionClear).not.toMatch(/limpia/i);
  });

  it("manager canCreate: patio no halló el remolque → alta aquí; no toca RO", () => {
    expect(copy.descriptionManager).toMatch(/patio no halló/i);
    expect(copy.empty.descriptionClearManager).toMatch(/patio no halló/i);
    expect(copy.empty.descriptionClearManager).not.toMatch(/primer remolque/i);
    expect(copy.empty.descriptionReadonly).toMatch(/administración/i);
    expect(copy.empty.descriptionReadonly).not.toMatch(/patio no halló/i);
  });

  it("empty RO no invita a registrar el primer remolque", () => {
    expect(copy.empty.descriptionReadonly).toMatch(/Aún no hay remolques/i);
    expect(copy.empty.descriptionReadonly).toMatch(/administración/i);
    expect(copy.empty.descriptionReadonly).not.toMatch(/primer remolque/i);
  });
});
