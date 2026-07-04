/**
 * Sidebar Component
 *
 * Menú lateral de navegación con soporte para:
 * - Colapsar/expandir
 * - Filtrado por permisos
 * - Indicador de ruta activa
 * - Tooltips cuando está colapsado
 *
 * Ubicación: src/widgets/sidebar/ui/Sidebar.tsx
 */

import { memo } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";

import { cn } from "@shared/lib/utils/cn";
import { Button } from "@/shared/ui/button";
import { Wordmark } from "@/shared/ui/brand";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

// import { useAuth } from "@/shared/hooks/useAuth";
import { useAuth } from "@features/auth";
import { useSidebar } from "@/app/providers/SidebarProvider";
import { useNavigationWithBadges } from "../model/useNavigationWithBadges";
import type { NavGroup, NavItem } from "../model/types";

// ============================================
// MAIN COMPONENT
// ============================================

export const Sidebar = memo(function Sidebar() {
  const { user, logout } = useAuth();
  const { isCollapsed, toggle } = useSidebar();
  const { navigation, isItemActive } = useNavigationWithBadges();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-full flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
          isCollapsed ? "w-[70px]" : "w-[260px]",
        )}
      >
        {/* ==========================================
            Header con Wordmark (Design System Fase 1)
            ========================================== */}
        <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-4">
          <Link
            to="/dashboard"
            className="flex items-center justify-center overflow-hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
            aria-label="Ir al dashboard de Boeltech"
          >
            <Wordmark
              compact={isCollapsed}
              variant="brand"
              decorative
              className={isCollapsed ? "text-2xl" : "text-xl"}
            />
          </Link>
        </div>

        {/* ==========================================
            Navegación
            ========================================== */}
        <nav className="flex-1 overflow-y-auto p-2">
          {navigation.map((group) => (
            <NavGroupComponent
              key={group.id}
              group={group}
              isCollapsed={isCollapsed}
              isItemActive={isItemActive}
            />
          ))}
        </nav>

        {/* ==========================================
            Footer
            ========================================== */}
        <div className="border-t p-2">
          {/* Info del usuario */}
          {!isCollapsed && user && (
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
          <NavActionButton
            icon={LogOut}
            label="Cerrar Sesión"
            isCollapsed={isCollapsed}
            onClick={logout}
          />

          {/* Botón de colapsar */}
          <Button
            variant="ghost"
            size="sm"
            className={cn("mt-2 w-full justify-center", isCollapsed && "px-0")}
            onClick={toggle}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="mr-2 h-4 w-4" />
                <span>Colapsar</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
});

// ============================================
// NAV GROUP COMPONENT
// ============================================

interface NavGroupComponentProps {
  group: NavGroup;
  isCollapsed: boolean;
  isItemActive: (item: NavItem) => boolean;
}

const NavGroupComponent = memo(function NavGroupComponent({
  group,
  isCollapsed,
  isItemActive,
}: NavGroupComponentProps) {
  return (
    <div className="mb-4">
      {/* Título del grupo */}
      {group.title && !isCollapsed && (
        <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {group.title}
        </h3>
      )}

      {/* Separador cuando está colapsado */}
      {group.title && isCollapsed && <div className="mx-2 mb-2 border-t" />}

      {/* Items */}
      <div className="space-y-1">
        {group.items.map((item) => (
          <NavItemLink
            key={item.id}
            item={item}
            isCollapsed={isCollapsed}
            isActive={isItemActive(item)}
          />
        ))}
      </div>
    </div>
  );
});

// ============================================
// NAV ITEM LINK
// ============================================

interface NavItemLinkProps {
  item: NavItem;
  isCollapsed: boolean;
  isActive: boolean;
}

const NavItemLink = memo(function NavItemLink({
  item,
  isCollapsed,
  isActive,
}: NavItemLinkProps) {
  const Icon = item.icon;

  const content = (
    <Link
      to={item.path}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        isActive &&
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
        isCollapsed && "justify-center px-2",
        item.disabled && "opacity-50 pointer-events-none",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge !== undefined && <NavBadge value={item.badge} />}
        </>
      )}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {item.label}
          {item.badge !== undefined && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground leading-none">
              {item.badge}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
});

// ============================================
// NAV ACTION BUTTON
// ============================================

interface NavActionButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isCollapsed: boolean;
  onClick?: () => void;
}

const NavActionButton = memo(function NavActionButton({
  icon: Icon,
  label,
  isCollapsed,
  onClick,
}: NavActionButtonProps) {
  const content = (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "text-muted-foreground",
        isCollapsed && "justify-center px-2",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!isCollapsed && <span>{label}</span>}
    </button>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
});

// ============================================
// NAV BADGE
// ============================================

interface NavBadgeProps {
  value: number | string;
}

const NavBadge = memo(function NavBadge({ value }: NavBadgeProps) {
  if (value === 0 || value === "") return null;

  // Badge de texto (ej: "Próximamente") → pill muted
  if (typeof value === "string") {
    return (
      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground leading-none">
        {value}
      </span>
    );
  }

  // Badge numérico → contador rojo
  const displayValue = value > 99 ? "99+" : value;
  return (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-medium text-destructive-foreground">
      {displayValue}
    </span>
  );
});
