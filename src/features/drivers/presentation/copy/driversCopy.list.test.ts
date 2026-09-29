import { describe, expect, it } from "vitest";

import { driversCopy } from "./driversCopy";

const copy = driversCopy.list;

describe("driversCopy.list", () => {
  it("usa copy corto en search, panel e importar", () => {
    expect(copy.filter.searchPlaceholder).toBe("Nombre, número o licencia");
    expect(copy.filter.showFilters).toBe("Filtros");
    expect(copy.filter.statusAll).toBe("Todos");
    expect(copy.filter.licenseExpiring).toBe("Licencias por vencer");
    expect(copy.actions.import).toBe("Importar");
  });

  it("no promete teléfono, sucursal, RFC ni CURP en el placeholder", () => {
    expect(copy.filter.searchPlaceholder).not.toMatch(
      /teléfono|telefono|sucursal|rfc|curp/i,
    );
  });

  it("distingue empty virgen del recortado", () => {
    expect(copy.empty.descriptionClear).toMatch(/primer conductor/i);
    expect(copy.empty.descriptionFiltered).toMatch(/limpia/i);
    expect(copy.empty.descriptionClear).not.toMatch(/limpia/i);
  });

  it("manager canCreate: patio no halló al conductor → alta aquí; no toca RO", () => {
    expect(copy.page.descriptionManager).toMatch(/patio no halló/i);
    expect(copy.empty.descriptionClearManager).toMatch(/patio no halló/i);
    expect(copy.empty.descriptionClearManager).not.toMatch(/primer conductor/i);
    expect(copy.empty.descriptionReadonly).toMatch(/administración/i);
    expect(copy.empty.descriptionReadonly).not.toMatch(/patio no halló/i);
  });

  it("empty RO no invita a agregar el primer conductor", () => {
    expect(copy.empty.descriptionReadonly).toMatch(/Aún no hay conductores/i);
    expect(copy.empty.descriptionReadonly).toMatch(/administración/i);
    expect(copy.empty.descriptionReadonly).not.toMatch(/primer conductor/i);
    expect(copy.empty.descriptionReadonly).not.toMatch(/agrega/i);
  });
});
