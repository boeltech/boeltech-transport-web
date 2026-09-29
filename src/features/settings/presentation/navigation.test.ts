import { describe, expect, it } from "vitest";
import { SettingsSection } from "../domain";
import {
  getActiveSettingsNavItem,
  getSettingsNavItem,
  settingsNavItems,
} from "./navigation";

/** Orden Capa 1: poner a punto → facturación → plan → padrón/consulta → preferencias. */
const EXPECTED_NAV_ORDER = [
  {
    id: SettingsSection.GENERAL,
    path: "/settings/general",
    label: "General",
  },
  {
    id: SettingsSection.BILLING,
    path: "/settings/billing",
    label: "Datos para facturar",
  },
  {
    id: SettingsSection.SUBSCRIPTION,
    path: "/settings/subscription",
    label: "Tu plan",
  },
  {
    id: SettingsSection.IMPORTS,
    path: "/settings/imports",
    label: "Importar padrón",
  },
  {
    id: SettingsSection.CATALOGS,
    path: "/settings/catalogs",
    label: "Catálogos",
  },
  {
    id: SettingsSection.LOCATIONS,
    path: "/settings/locations",
    label: "Bodegas",
  },
  {
    id: SettingsSection.NOTIFICATIONS,
    path: "/settings/notifications",
    label: "Avisos de la empresa",
  },
  {
    id: SettingsSection.DASHBOARD_LAYOUTS,
    path: "/settings/dashboard-layouts",
    label: "Inicio",
  },
] as const;

describe("settingsNavItems", () => {
  it("keeps job-aligned order, paths, and IA labels", () => {
    expect(
      settingsNavItems.map((item) => ({
        id: item.id,
        path: item.path,
        label: item.label,
      })),
    ).toEqual([...EXPECTED_NAV_ORDER]);
  });

  it("does not expose integrations in the nav", () => {
    expect(
      settingsNavItems.some(
        (item) => item.id === SettingsSection.INTEGRATIONS,
      ),
    ).toBe(false);
  });

  it("places billing immediately after general, without billing-schemes in nav", () => {
    const ids = settingsNavItems.map((item) => item.id);
    const billingIdx = ids.indexOf(SettingsSection.BILLING);
    expect(billingIdx).toBe(1);
    expect(ids).not.toContain(SettingsSection.BILLING_SCHEMES);
    expect(ids[billingIdx + 1]).toBe(SettingsSection.SUBSCRIPTION);
  });
});

describe("getSettingsNavItem / getActiveSettingsNavItem", () => {
  it("resolves by section id", () => {
    expect(getSettingsNavItem(SettingsSection.IMPORTS)?.label).toBe(
      "Importar padrón",
    );
  });

  it("resolves exact and nested paths", () => {
    expect(getActiveSettingsNavItem("/settings/billing")?.id).toBe(
      SettingsSection.BILLING,
    );
    expect(
      getActiveSettingsNavItem("/settings/catalogs/clave_prod_serv")?.id,
    ).toBe(SettingsSection.CATALOGS);
    expect(
      getActiveSettingsNavItem("/settings/billing/service-concepts")?.id,
    ).toBe(SettingsSection.BILLING);
  });
});
