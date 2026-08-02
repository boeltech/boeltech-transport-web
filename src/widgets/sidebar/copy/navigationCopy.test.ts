import { describe, expect, it } from "vitest";
import { navigationConfig } from "../model/navigation";
import { navigationCopy } from "./navigationCopy";

describe("navigationCopy", () => {
  it("uses correct Spanish accents in shell labels", () => {
    expect(navigationCopy.item.vehicles).toBe("Vehículos");
    expect(navigationCopy.item.usersActivity).toBe("Historial de usuarios");
    expect(navigationCopy.item.settings).toBe("Configuración");
    expect(navigationCopy.group.operations).toBe("Operación");
    expect(navigationCopy.group.admin).toBe("Administración");
  });

  it("does not contain mojibake plus-sign corruption", () => {
    const allStrings = JSON.stringify(navigationCopy);
    expect(allStrings).not.toMatch(/[A-Za-z]\+[A-Za-z]/);
  });

  it("wires copy into navigationConfig labels", () => {
    const labels = navigationConfig.flatMap((group) =>
      group.items.map((item) => item.label),
    );

    expect(labels).toContain("Vehículos");
    expect(labels).toContain("Historial de usuarios");
    expect(labels).toContain("Configuración");
    expect(labels).toContain("Por facturar");
  });
});

describe("navigationConfig", () => {
  it("shows at most five group headers", () => {
    const groupTitles = navigationConfig
      .map((group) => group.title)
      .filter((title) => title !== "");

    expect(groupTitles).toEqual([
      "Operación",
      "Flota y personal",
      "Comercial",
      "Finanzas",
      "Administración",
    ]);
  });

  it("does not advertise screens that are not built", () => {
    const items = navigationConfig.flatMap((group) => group.items);

    expect(items.filter((item) => item.disabled)).toEqual([]);
    expect(items.filter((item) => typeof item.badge === "string")).toEqual([]);
  });

  it("keeps employees inside the fleet and staff group", () => {
    const fleet = navigationConfig.find((group) => group.id === "fleet");

    expect(fleet?.items.map((item) => item.id)).toEqual([
      "vehicles",
      "drivers",
      "employees",
    ]);
  });
});
