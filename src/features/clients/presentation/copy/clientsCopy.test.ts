import { describe, expect, it } from "vitest";

import { clientsCopy } from "./clientsCopy";

describe("clientsCopy", () => {
  it("usa copy corto en search y panel de filtros", () => {
    expect(clientsCopy.filter.searchPlaceholder).toBe("Nombre, RFC o código");
    expect(clientsCopy.filter.showFilters).toBe("Filtros");
    expect(clientsCopy.filter.typeAll).toBe("Todos");
    expect(clientsCopy.filter.paymentAll).toBe("Todos");
    expect(clientsCopy.filter.statusAll).toBe("Todos");
    expect(clientsCopy.actions.import).toBe("Importar");
  });

  it("no promete contacto ni email en el placeholder", () => {
    expect(clientsCopy.filter.searchPlaceholder).not.toMatch(/contacto|email|correo/i);
  });

  it("distingue empty sin recortes del recortado", () => {
    expect(clientsCopy.empty.descriptionClear).toMatch(/primer cliente/i);
    expect(clientsCopy.empty.descriptionFiltered).toMatch(/limpia/i);
    expect(clientsCopy.empty.descriptionClear).not.toMatch(/limpia/i);
  });

  it("manager canCreate: patio no lo halló → alta aquí; no toca RO", () => {
    expect(clientsCopy.page.descriptionManager).toMatch(/patio no halló/i);
    expect(clientsCopy.empty.descriptionClearManager).toMatch(/patio no halló/i);
    expect(clientsCopy.empty.descriptionClearManager).not.toMatch(
      /primer cliente/i,
    );
    expect(clientsCopy.empty.descriptionReadonly).toMatch(/administración/i);
    expect(clientsCopy.empty.descriptionReadonly).not.toMatch(/patio no halló/i);
  });

  it("empty RO no invita a crear el primer cliente", () => {
    expect(clientsCopy.empty.descriptionReadonly).toMatch(/Aún no hay clientes/i);
    expect(clientsCopy.empty.descriptionReadonly).toMatch(/administración/i);
    expect(clientsCopy.empty.descriptionReadonly).not.toMatch(/primer cliente/i);
    expect(clientsCopy.empty.descriptionReadonly).not.toMatch(/agrega/i);
  });
});
