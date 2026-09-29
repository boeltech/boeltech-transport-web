import { describe, expect, it } from "vitest";

import { employeesCopy } from "./employeesCopy";

const copy = employeesCopy.list;

describe("employeesCopy.list", () => {
  it("usa copy corto en search y panel de filtros", () => {
    expect(copy.filter.searchPlaceholder).toBe("Nombre, RFC, CURP o número");
    expect(copy.filter.showFilters).toBe("Filtros");
    expect(copy.filter.statusAll).toBe("Todos");
    expect(copy.filter.typeLabel).toBe("Contrato");
    expect(copy.filter.positionLabel).toBe("Puesto");
    expect(copy.actions.import).toBe("Importar");
  });

  it("manager: una línea de precondición conductor, sin tour de nómina", () => {
    expect(copy.page.descriptionManager).toMatch(/empleado/i);
    expect(copy.page.descriptionManager).toMatch(/conductor/i);
    expect(copy.page.descriptionManager).not.toMatch(/nómina|SaaS|liquidaci/i);
    expect(copy.page.description).toBe("Gestiona el personal de la empresa");
  });

  it("no promete email en el placeholder", () => {
    expect(copy.filter.searchPlaceholder).not.toMatch(/email|correo|contacto/i);
  });

  it("no usa Activos/Inactivos en el listado", () => {
    const visible = JSON.stringify({
      filter: copy.filter,
      empty: copy.empty,
    });
    expect(visible).not.toMatch(/Activos|Inactivos/);
  });
});
