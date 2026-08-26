import { describe, expect, it } from "vitest";
import {
  clientPortalNavigationConfig,
  driverPortalNavigationConfig,
  navigationConfig,
} from "../model/navigation";
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
    expect(labels).toContain("Cobros");
  });

  it("exposes portal labels without staff finance/fleet jargon", () => {
    expect(navigationCopy.portal.dashboard).toBe("Inicio");
    expect(navigationCopy.portal.trips).toBe("Mis envíos");
    expect(navigationCopy.portal.invoices).toBe("Mis facturas");
    expect(navigationCopy.driverPortal.dashboard).toBe("Inicio");
    expect(navigationCopy.driverPortal.trips).toBe("Mis viajes");
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
      "trailers",
      "drivers",
      "employees",
    ]);
  });

  it("exposes daily finance queues in sidebar without period ritual or consult tabs", () => {
    const finance = navigationConfig.find((group) => group.id === "finance");
    const ids = finance?.items.map((item) => item.id) ?? [];
    const labels = finance?.items.map((item) => item.label) ?? [];

    expect(finance?.title).toBe("Finanzas");
    expect(labels).toContain("Resumen");
    expect(labels).toContain("Por facturar");
    expect(labels).toContain("Cobros");
    expect(labels).toContain("Aprobaciones");
    expect(labels).toContain("Envío de facturas");
    expect(labels).toContain("Análisis");
    expect(ids).toContain("finance-dispatch-runs");
    expect(ids).toContain("finance-analysis");
  });

  it("uses distinct Lucide icons within the finance group", () => {
    const finance = navigationConfig.find((group) => group.id === "finance");
    const items = finance?.items ?? [];
    const iconById = Object.fromEntries(
      items.map((item) => [item.id, item.icon.displayName ?? item.icon.name]),
    );

    expect(iconById["finance-hub"]).not.toBe(iconById["finance-invoices"]);
    expect(iconById["finance-analysis"]).not.toBe(iconById["reports-list"]);

    const icons = items.map((item) => item.icon);
    expect(new Set(icons).size).toBe(icons.length);
  });
});

describe("clientPortalNavigationConfig", () => {
  it("only lists consulta items (no Reportes / Cobros / flota)", () => {
    const items = clientPortalNavigationConfig.flatMap((g) => g.items);
    const ids = items.map((item) => item.id);
    const labels = items.map((item) => item.label);

    expect(ids).toEqual(["dashboard", "trips", "finance-invoices"]);
    expect(labels).toEqual(["Inicio", "Mis envíos", "Mis facturas"]);
    expect(ids).not.toContain("reports");
    expect(labels.some((l) => /reporte|cobro|flota|vehículo/i.test(l))).toBe(
      false,
    );
  });
});

describe("driverPortalNavigationConfig", () => {
  it("only lists Inicio + Mis viajes (no Reportes / Flota / Finanzas)", () => {
    const items = driverPortalNavigationConfig.flatMap((g) => g.items);
    const ids = items.map((item) => item.id);
    const labels = items.map((item) => item.label);

    expect(ids).toEqual(["dashboard", "trips"]);
    expect(labels).toEqual(["Inicio", "Mis viajes"]);
    expect(ids).not.toContain("reports");
    expect(ids).not.toContain("vehicles");
    expect(ids).not.toContain("finance-hub");
    expect(labels.some((l) => /reporte|flota|finanza|factura/i.test(l))).toBe(
      false,
    );
  });
});
