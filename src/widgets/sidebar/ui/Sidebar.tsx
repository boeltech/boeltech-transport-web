import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, Truck, LogOut } from "lucide-react";

import { cn } from "@shared/lib/cn";
import { Button } from "@shared/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@shared/ui/tooltip";

import { useAuth } from "@app/providers/AuthProvider";
import { usePermissions } from "@app/providers/PermissionProvider";
import { useSidebar } from "@app/providers/SidebarProvider";
import {
  navigationConfig,
  filterNavigation,
  type NavGroup,
  type NavItem,
} from "@shared/config/navigation";

/**
 * Sidebar
 *
 * Menú lateral de navegación con soporte para:
 * - Colapsar/expandir (consume SidebarProvider)
 * - Filtrado por permisos (consume PermissionProvider)
 * - Indicador de ruta activa
 * - Tooltips cuando está colapsado
 */
export const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { hasPermission, role } = usePermissions();
  const { collapsed, toggle } = useSidebar();

  // Filtrar navegación según permisos
  const filteredNavigation = filterNavigation(
    navigationConfig,
    role || "",
    hasPermission
  );

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full flex-col">
        {/* ==========================================
            Header con Logo
            ========================================== */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 overflow-hidden"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
              <Truck className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="text-lg font-bold whitespace-nowrap">
                Boeltech
              </span>
            )}
          </Link>
        </div>

        {/* ==========================================
            Navegación
            ========================================== */}
        <nav className="flex-1 overflow-y-auto p-2">
          {filteredNavigation.map((group) => (
            <NavGroupComponent
              key={group.id}
              group={group}
              collapsed={collapsed}
              currentPath={location.pathname}
            />
          ))}
        </nav>

        {/* ==========================================
            Footer con acciones
            ========================================== */}
        <div className="border-t p-2">
          {/* Info del usuario (solo cuando está expandido) */}
          {!collapsed && user && (
            <div className="mb-2 rounded-lg bg-muted/50 p-3">
              <p className="text-sm font-medium truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          )}

          {/* Botón de Logout */}
          <NavItemButton
            icon={LogOut}
            label="Cerrar Sesión"
            collapsed={collapsed}
            onClick={logout}
          />

          {/* Botón de colapsar */}
          <Button
            variant="ghost"
            size="sm"
            className={cn("mt-2 w-full justify-center", collapsed && "px-0")}
            onClick={toggle}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="mr-2 h-4 w-4" />
                <span>Colapsar</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
};

// ============================================
// Componentes internos
// ============================================

interface NavGroupComponentProps {
  group: NavGroup;
  collapsed: boolean;
  currentPath: string;
}

const NavGroupComponent = ({
  group,
  collapsed,
  currentPath,
}: NavGroupComponentProps) => {
  return (
    <div className="mb-4">
      {/* Label del grupo (solo cuando está expandido) */}
      {!collapsed && (
        <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {group.label}
        </h3>
      )}

      {/* Separador cuando está colapsado */}
      {collapsed && <div className="mx-2 mb-2 border-t" />}

      {/* Items */}
      <div className="space-y-1">
        {group.items.map((item) => (
          <NavItemLink
            key={item.id}
            item={item}
            collapsed={collapsed}
            isActive={
              currentPath === item.href ||
              currentPath.startsWith(item.href + "/")
            }
          />
        ))}
      </div>
    </div>
  );
};

interface NavItemLinkProps {
  item: NavItem;
  collapsed: boolean;
  isActive: boolean;
}

const NavItemLink = ({ item, collapsed, isActive }: NavItemLinkProps) => {
  const Icon = item.icon;

  const content = (
    <Link
      to={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        isActive &&
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-medium text-destructive-foreground">
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {item.label}
          {item.badge !== undefined && item.badge > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-medium text-destructive-foreground">
              {item.badge}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
};

interface NavItemButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  collapsed: boolean;
  onClick?: () => void;
}

const NavItemButton = ({
  icon: Icon,
  label,
  collapsed,
  onClick,
}: NavItemButtonProps) => {
  const content = (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "text-muted-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
};
