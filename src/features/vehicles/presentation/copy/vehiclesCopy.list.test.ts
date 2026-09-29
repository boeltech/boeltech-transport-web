import { describe, expect, it } from "vitest";

import { vehiclesCopy } from "./vehiclesCopy";

const copy = vehiclesCopy.list;

describe("vehiclesCopy.list", () => {
  it("usa copy corto en search, panel e importar", () => {
    expect(copy.filter.searchPlaceholder).toBe("Unidad, placa, marca o VIN");
    expect(copy.filter.showFilters).toBe("Filtros");
    expect(copy.filter.statusAll).toBe("Todos");
    expect(copy.filter.typeAll).toBe("Todos");
    expect(copy.actions.import).toBe("Importar");
  });

  it("no promete sucursal, kilometraje, teléfono, año ni seguro en el placeholder", () => {
    expect(copy.filter.searchPlaceholder).not.toMatch(
      /sucursal|kilometraje|\bkm\b|teléfono|año|seguro/i,
    );
  });

  it("distingue empty virgen del recortado y no usa Activos/Inactivos", () => {
    expect(copy.empty.descriptionClear).toMatch(/primer vehículo/i);
    expect(copy.empty.descriptionFiltered).toMatch(/limpia/i);
    expect(copy.empty.descriptionClear).not.toMatch(/limpia/i);
    expect(JSON.stringify({ filter: copy.filter, empty: copy.empty })).not.toMatch(
      /Activos|Inactivos/,
    );
  });

  it("manager canCreate: patio no halló la unidad → alta aquí; no toca RO", () => {
    expect(copy.page.descriptionManager).toMatch(/patio no halló/i);
    expect(copy.empty.descriptionClearManager).toMatch(/patio no halló/i);
    expect(copy.empty.descriptionClearManager).not.toMatch(/primer vehículo/i);
    expect(copy.empty.descriptionReadonly).toMatch(/administración/i);
    expect(copy.empty.descriptionReadonly).not.toMatch(/patio no halló/i);
  });

  it("empty RO no invita a agregar el primer vehículo", () => {
    expect(copy.empty.descriptionReadonly).toMatch(/Aún no hay vehículos/i);
    expect(copy.empty.descriptionReadonly).toMatch(/administración/i);
    expect(copy.empty.descriptionReadonly).not.toMatch(/primer vehículo/i);
    expect(copy.empty.descriptionReadonly).not.toMatch(/agrega/i);
  });
});
