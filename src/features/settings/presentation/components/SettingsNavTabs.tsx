/**
 * SettingsNavTabs — navegación horizontal de Configuración.
 * En secciones: solo siblings del grupo activo (≤4). En hub: oculto.
 */

import { memo, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { RouteTabsNav, type RouteTabsNavItem } from "@shared/ui/tabs";
import { usePermissions } from "@shared/permissions";
import {
  filterSettingsNavItemsByPermission,
  getSettingsHubGroupId,
  getSettingsNavItemsForGroup,
  resolveSettingsSectionFromPath,
} from "../config/settingsHubGroups";
import { settingsNavItems } from "../navigation";

export interface SettingsNavTabsProps {
  className?: string;
}

export const SettingsNavTabs = memo(function SettingsNavTabs({
  className,
}: SettingsNavTabsProps) {
  const { pathname } = useLocation();
  const { hasPermission } = usePermissions();

  const items = useMemo((): RouteTabsNavItem[] => {
    const sectionId = resolveSettingsSectionFromPath(pathname);
    const groupId = sectionId
      ? getSettingsHubGroupId(sectionId)
      : undefined;

    const source = groupId
      ? getSettingsNavItemsForGroup(groupId)
      : settingsNavItems;

    return filterSettingsNavItemsByPermission(source, hasPermission).map(
      (item) => ({
        id: item.id,
        to: item.path,
        label: item.label,
        icon: item.icon,
        badge: item.badge,
        disabled: item.disabled,
        title: item.description,
      }),
    );
  }, [hasPermission, pathname]);

  if (items.length === 0) return null;

  return (
    <RouteTabsNav
      items={items}
      aria-label="Secciones de configuración"
      className={className}
    />
  );
});
