import { describe, expect, it } from "vitest";
import { SettingsSection } from "../../domain";
import {
  SETTINGS_HUB_GROUPS,
  filterSettingsNavItemsByPermission,
  getSettingsHubGroupId,
  getSettingsNavItemsForGroup,
  resolveSettingsSectionFromPath,
} from "./settingsHubGroups";

describe("settingsHubGroups", () => {
  it("defines 4 job groups with at most 4 sections each", () => {
    expect(SETTINGS_HUB_GROUPS).toHaveLength(4);
    for (const group of SETTINGS_HUB_GROUPS) {
      expect(group.sectionIds.length).toBeGreaterThan(0);
      expect(group.sectionIds.length).toBeLessThanOrEqual(4);
    }
  });

  it("maps company sections to empresa and billing to facturacion", () => {
    expect(getSettingsHubGroupId(SettingsSection.GENERAL)).toBe("empresa");
    expect(getSettingsHubGroupId(SettingsSection.LOCATIONS)).toBe("empresa");
    expect(getSettingsHubGroupId(SettingsSection.BILLING)).toBe("facturacion");
    expect(getSettingsHubGroupId(SettingsSection.BILLING_SCHEMES)).toBe(
      "facturacion",
    );
    expect(getSettingsHubGroupId(SettingsSection.SUBSCRIPTION)).toBe(
      "facturacion",
    );
  });

  it("keeps billing-schemes between billing and subscription in facturacion", () => {
    const facturacion = getSettingsNavItemsForGroup("facturacion").map(
      (i) => i.id,
    );
    expect(facturacion).toEqual([
      SettingsSection.BILLING,
      SettingsSection.BILLING_SCHEMES,
      SettingsSection.SUBSCRIPTION,
    ]);
  });

  it("resolves deep links to the parent section", () => {
    expect(resolveSettingsSectionFromPath("/settings")).toBeNull();
    expect(resolveSettingsSectionFromPath("/settings/general")).toBe(
      SettingsSection.GENERAL,
    );
    expect(
      resolveSettingsSectionFromPath("/settings/billing/service-concepts"),
    ).toBe(SettingsSection.BILLING);
    expect(
      resolveSettingsSectionFromPath("/settings/catalogs/c_ClaveProdServ"),
    ).toBe(SettingsSection.CATALOGS);
  });

  it("returns nav items for a group in hub order", () => {
    const empresa = getSettingsNavItemsForGroup("empresa").map((i) => i.id);
    expect(empresa).toEqual([
      SettingsSection.GENERAL,
      SettingsSection.LOCATIONS,
    ]);
  });

  it("filters items by permission", () => {
    const items = getSettingsNavItemsForGroup("gobernanza");
    const filtered = filterSettingsNavItemsByPermission(
      items,
      (module, action) => module === "approval_policies" && action === "read",
    );
    expect(filtered.map((i) => i.id)).toEqual([SettingsSection.APPROVALS]);
  });
});
