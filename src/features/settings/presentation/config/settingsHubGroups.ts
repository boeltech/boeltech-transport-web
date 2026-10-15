/**
 * IA del hub Configuración (Oleada 1 / decisión A): 4 grupos de job.
 * Las rutas públicas de cada sección se preservan.
 */

import type { Action, Module } from "@shared/permissions";
import {
  SettingsSection,
  type SettingsSectionValue,
} from "../../domain";
import { settingsNavItems, type SettingsNavItem } from "../navigation";

export type SettingsHubGroupId =
  | "empresa"
  | "facturacion"
  | "padron"
  | "gobernanza";

export interface SettingsHubGroupDefinition {
  id: SettingsHubGroupId;
  /** Orden de secciones dentro del grupo (≤4). */
  sectionIds: readonly SettingsSectionValue[];
}

/** Orden canónico de grupos en el landing. */
export const SETTINGS_HUB_GROUPS: readonly SettingsHubGroupDefinition[] = [
  {
    id: "empresa",
    sectionIds: [SettingsSection.GENERAL, SettingsSection.LOCATIONS],
  },
  {
    id: "facturacion",
    sectionIds: [SettingsSection.BILLING, SettingsSection.SUBSCRIPTION],
  },
  {
    id: "padron",
    sectionIds: [SettingsSection.IMPORTS, SettingsSection.CATALOGS],
  },
  {
    id: "gobernanza",
    sectionIds: [
      SettingsSection.APPROVALS,
      SettingsSection.NOTIFICATIONS,
      SettingsSection.DASHBOARD_LAYOUTS,
    ],
  },
] as const;

const SECTION_TO_GROUP = new Map<SettingsSectionValue, SettingsHubGroupId>(
  SETTINGS_HUB_GROUPS.flatMap((group) =>
    group.sectionIds.map((sectionId) => [sectionId, group.id] as const),
  ),
);

export function getSettingsHubGroupId(
  sectionId: SettingsSectionValue,
): SettingsHubGroupId | undefined {
  return SECTION_TO_GROUP.get(sectionId);
}

/**
 * Resuelve la sección activa desde el pathname (deep links preservados).
 * Subrutas (`/settings/billing/service-concepts`, `/settings/catalogs/:code`)
 * heredan el grupo de la sección padre.
 */
export function resolveSettingsSectionFromPath(
  pathname: string,
): SettingsSectionValue | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/settings") return null;

  const match = settingsNavItems
    .slice()
    .sort((a, b) => b.path.length - a.path.length)
    .find(
      (item) =>
        normalized === item.path || normalized.startsWith(`${item.path}/`),
    );

  return match?.id ?? null;
}

export function getSettingsNavItemsForGroup(
  groupId: SettingsHubGroupId,
): SettingsNavItem[] {
  const group = SETTINGS_HUB_GROUPS.find((g) => g.id === groupId);
  if (!group) return [];
  return group.sectionIds
    .map((id) => settingsNavItems.find((item) => item.id === id))
    .filter((item): item is SettingsNavItem => item != null);
}

export function filterSettingsNavItemsByPermission(
  items: readonly SettingsNavItem[],
  hasPermission: (module: Module, action: Action) => boolean,
): SettingsNavItem[] {
  return items.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(item.permission.module, item.permission.action);
  });
}
