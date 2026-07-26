/**
 * SettingsNavTabs — navegación horizontal de Configuración (estilo Sneat / primary).
 * Sustituye el sidebar interno; cada tab navega a su ruta.
 */

import { memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";
import { Badge } from "@shared/ui/badge";
import { usePermissions } from "@shared/permissions";
import { settingsNavItems, type SettingsNavItem } from "../navigation";

export interface SettingsNavTabsProps {
  className?: string;
}

export const SettingsNavTabs = memo(function SettingsNavTabs({
  className,
}: SettingsNavTabsProps) {
  const location = useLocation();
  const { hasPermission } = usePermissions();

  const visibleItems = settingsNavItems.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(item.permission.module, item.permission.action);
  });

  return (
    <nav
      className={cn(
        "flex gap-1 overflow-x-auto rounded-lg bg-muted/50 p-1",
        className,
      )}
      aria-label="Secciones de configuración"
    >
      {visibleItems.map((item) => (
        <SettingsNavTab
          key={item.id}
          item={item}
          isActive={isItemActive(location.pathname, item)}
        />
      ))}
    </nav>
  );
});

interface SettingsNavTabProps {
  item: SettingsNavItem;
  isActive: boolean;
}

const SettingsNavTab = memo(function SettingsNavTab({
  item,
  isActive,
}: SettingsNavTabProps) {
  const Icon = item.icon;

  if (item.disabled) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
          "cursor-not-allowed text-muted-foreground/50",
        )}
        title={item.description}
      >
        <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
        {item.label}
        {item.badge ? (
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
            {item.badge}
          </Badge>
        ) : null}
      </span>
    );
  }

  return (
    <Link
      to={item.path}
      title={item.description}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-background/80 hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
      {item.label}
      {item.badge ? (
        <Badge
          variant={isActive ? "secondary" : "outline"}
          className="px-1.5 py-0 text-[10px]"
        >
          {item.badge}
        </Badge>
      ) : null}
    </Link>
  );
});

function isItemActive(pathname: string, item: SettingsNavItem): boolean {
  if (pathname === item.path) return true;
  if (pathname.startsWith(`${item.path}/`)) return true;
  return false;
}
