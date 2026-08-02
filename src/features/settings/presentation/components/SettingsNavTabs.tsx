/**
 * SettingsNavTabs — navegación horizontal de Configuración.
 * Estilo canónico ERP: RouteTabsNav (= TabsList / TabsTrigger soft).
 */

import { memo, useMemo } from "react";
import { RouteTabsNav, type RouteTabsNavItem } from "@shared/ui/tabs";
import { usePermissions } from "@shared/permissions";
import { settingsNavItems } from "../navigation";

export interface SettingsNavTabsProps {
  className?: string;
}

export const SettingsNavTabs = memo(function SettingsNavTabs({
  className,
}: SettingsNavTabsProps) {
  const { hasPermission } = usePermissions();

  const items = useMemo((): RouteTabsNavItem[] => {
    return settingsNavItems
      .filter((item) => {
        if (!item.permission) return true;
        return hasPermission(item.permission.module, item.permission.action);
      })
      .map((item) => ({
        id: item.id,
        to: item.path,
        label: item.label,
        icon: item.icon,
        badge: item.badge,
        disabled: item.disabled,
        title: item.description,
      }));
  }, [hasPermission]);

  return (
    <RouteTabsNav
      items={items}
      aria-label="Secciones de configuración"
      className={className}
    />
  );
});
