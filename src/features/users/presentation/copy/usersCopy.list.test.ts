import { describe, expect, it } from "vitest";

import { usersCopy } from "./usersCopy";

const copy = usersCopy.list;

describe("usersCopy.list", () => {
  it("usa copy corto en search y panel", () => {
    expect(copy.filter.searchPlaceholder).toBe("Nombre o correo");
    expect(copy.filter.showFilters).toBe("Filtros");
    expect(copy.filter.statusAll).toBe("Todos");
    expect(copy.filter.roleAll).toBe("Todos");
  });

  it("no promete rol, estado ni «Buscar por» en el placeholder", () => {
    expect(copy.filter.searchPlaceholder).not.toMatch(/rol|estado|buscar por/i);
  });

  it("distingue empty virgen del recortado y no usa Más filtros", () => {
    expect(copy.empty.descriptionClear).toMatch(/primera persona/i);
    expect(copy.empty.descriptionClear).toMatch(/Dar acceso ya/i);
    expect(copy.empty.descriptionFiltered).toMatch(/limpia/i);
    expect(copy.empty.descriptionClear).not.toMatch(/limpia/i);
    expect(JSON.stringify({ filter: copy.filter, empty: copy.empty })).not.toMatch(
      /Más filtros/,
    );
  });

  it("describe acceso y vínculos, no superusuario", () => {
    expect(copy.description).toMatch(/acceso/i);
    expect(copy.description).toMatch(/vincul/i);
    expect(copy.description).not.toMatch(/superusuario|puedes hacer de todo/i);
  });
});

describe("usersCopy.adminOrientation", () => {
  it("enseña 3 tiempos sin tour ni hermanos", () => {
    const orientation = usersCopy.adminOrientation;
    expect(orientation.body).toMatch(/Invitar|Dar acceso ya/i);
    expect(orientation.body).toMatch(/cliente/i);
    expect(orientation.body).toMatch(/conductor/i);
    expect(orientation.body).not.toMatch(
      /superusuario|puedes hacer de todo|Viajes|Por facturar|SAT/i,
    );
  });
});

describe("usersCopy.addUser", () => {
  it("portales = Dar acceso ya y lista vacía escala al gerente", () => {
    expect(usersCopy.addUser.modes.register).toBe("Dar acceso ya");
    expect(usersCopy.addUser.registerDescription).toMatch(/portal/i);
    expect(usersCopy.addUser.link.clientDescription).toMatch(/cliente/i);
    expect(usersCopy.addUser.link.driverDescription).toMatch(/conductor/i);
    expect(usersCopy.addUser.link.clientEmpty).toMatch(/gerente/i);
    expect(usersCopy.addUser.link.driverEmpty).toMatch(/gerente/i);
    expect(usersCopy.addUser.link.clientEmpty).not.toMatch(/\/clients\/new/);
    expect(usersCopy.addUser.link.driverEmpty).not.toMatch(/\/drivers\/new/);
  });
});
