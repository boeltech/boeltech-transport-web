/**
 * SettingsSidebar Component
 *
 * Sidebar de navegación interna para el módulo de configuración.
 * Se muestra dentro de la página de Settings.
 *
 * Ubicación: src/features/settings/ui/components/SettingsSidebar.tsx
 */

import { memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";
import { Badge } from "@shared/ui/badge";
import { usePermissions } from "@shared/permissions";
import { settingsNavItems, type SettingsNavItem } from "../navigation";

// ============================================================================
// TYPES
// ============================================================================

export interface SettingsSidebarProps {
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const SettingsSidebar = memo(function SettingsSidebar({
  className,
}: SettingsSidebarProps) {
  const location = useLocation();
  const { hasPermission } = usePermissions();

  // Filtrar items por permisos
  const visibleItems = settingsNavItems.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(item.permission.module, item.permission.action);
  });

  return (
    <nav
      className={cn("flex flex-col gap-1 w-full lg:w-64 shrink-0", className)}
      aria-label="Navegación de configuración"
    >
      {visibleItems.map((item) => (
        <SettingsNavLink
          key={item.id}
          item={item}
          isActive={isItemActive(location.pathname, item)}
        />
      ))}
    </nav>
  );
});

// ============================================================================
// NAV LINK COMPONENT
// ============================================================================

interface SettingsNavLinkProps {
  item: SettingsNavItem;
  isActive: boolean;
}

const SettingsNavLink = memo(function SettingsNavLink({
  item,
  isActive,
}: SettingsNavLinkProps) {
  const Icon = item.icon;

  if (item.disabled) {
    return (
      <div
        className={cn(
          "flex items-start gap-3 rounded-lg px-3 py-3",
          "text-muted-foreground/60 cursor-not-allowed",
        )}
      >
        <Icon className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{item.label}</span>
            {item.badge && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {item.badge}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground/50 mt-0.5 hidden lg:block">
            {item.description}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Link
      to={item.path}
      className={cn(
        "flex items-start gap-3 rounded-lg px-3 py-3 transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        isActive && "bg-accent text-accent-foreground",
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0 mt-0.5",
          isActive ? "text-primary" : "text-muted-foreground",
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{item.label}</span>
          {item.badge && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              {item.badge}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 hidden lg:block">
          {item.description}
        </p>
      </div>
    </Link>
  );
});

// ============================================================================
// HELPERS
// ============================================================================

function isItemActive(pathname: string, item: SettingsNavItem): boolean {
  // Coincidencia exacta
  if (pathname === item.path) return true;

  // Coincidencia por prefijo (para subrutas)
  if (pathname.startsWith(item.path + "/")) return true;

  return false;
}
