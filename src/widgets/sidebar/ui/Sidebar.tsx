/**
 * Sidebar Component
 *
 * Menú lateral de navegación con soporte para:
 * - Colapsar/expandir
 * - Filtrado por permisos
 * - Indicador de ruta activa (soft tint + barra)
 * - Tooltips cuando está colapsado
 *
 * Ubicación: src/widgets/sidebar/ui/Sidebar.tsx
 */

import { memo } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@shared/lib/utils/cn";
import { Button } from "@/shared/ui/button";
import { Wordmark } from "@/shared/ui/brand";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

import { useSidebar } from "@/app/providers/SidebarProvider";
import { useNavigationWithBadges } from "../model/useNavigationWithBadges";
import type { NavGroup, NavItem } from "../model/types";

// ============================================
// MAIN COMPONENT
// ============================================

export const Sidebar = memo(function Sidebar() {
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
        {/* Brand row: wordmark + collapse */}
        <div
          className={cn(
            "flex h-16 items-center border-b border-sidebar-border px-3",
            isCollapsed ? "justify-center" : "justify-between gap-2",
          )}
        >
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
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground"
              onClick={toggle}
              aria-label="Colapsar menú"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

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

        {/* Collapse only when icon rail */}
        {isCollapsed && (
          <div className="border-t border-sidebar-border p-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full text-muted-foreground"
                  onClick={toggle}
                  aria-label="Expandir menú"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Expandir</TooltipContent>
            </Tooltip>
          </div>
        )}
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
    <div className="mb-5">
      {group.title && !isCollapsed && (
        <h3 className="mb-2.5 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
          {group.title}
        </h3>
      )}

      {group.title && isCollapsed && (
        <div className="mx-2 mb-2.5 border-t border-sidebar-border" />
      )}

      <div className="space-y-0.5">
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
        "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive &&
          "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
        isCollapsed && "justify-center px-2",
        item.disabled && "opacity-50 pointer-events-none",
      )}
    >
      {isActive && !isCollapsed && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
        />
      )}
      <Icon className="h-5 w-5 shrink-0" strokeWidth={1.5} />
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
// NAV BADGE
// ============================================

interface NavBadgeProps {
  value: number | string;
}

const NavBadge = memo(function NavBadge({ value }: NavBadgeProps) {
  if (value === 0 || value === "") return null;

  if (typeof value === "string") {
    return (
      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground leading-none">
        {value}
      </span>
    );
  }

  const displayValue = value > 99 ? "99+" : value;
  return (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-medium text-destructive-foreground">
      {displayValue}
    </span>
  );
});
