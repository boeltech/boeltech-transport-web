/**
 * Sidebar Component
 *
 * Menú lateral de navegación con soporte para:
 * - Colapsar/expandir
 * - Filtrado por permisos
 * - Indicador de ruta activa (tokens sidebar + riel 3px)
 * - Badge visible en colapsado
 * - Tooltips cuando está colapsado
 *
 * Ubicación: src/widgets/sidebar/ui/Sidebar.tsx
 *
 * Nota: el landmark `<aside>` vive en LayoutShell; aquí solo el chrome interno.
 */

import { memo } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@shared/lib/utils/cn";
import { Button } from "@/shared/ui/button";
import { BrandLockup, BRAND } from "@/shared/ui/brand";
import { ScrollArea } from "@/shared/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

import { useSidebar } from "@/app/providers/SidebarProvider";
import { useNavigationWithBadges } from "../model/useNavigationWithBadges";
import { SIDEBAR_LABEL_FADE_CLASS } from "../model/sidebarLayout";
import type { NavGroup, NavItem } from "../model/types";
import { NavActiveRail } from "./NavActiveRail";
import { NavBadge } from "./NavBadge";
import {
  navGroupLabelClassName,
  navItemClassName,
  navLabelVisibilityClassName,
  sidebarChromeButtonClassName,
  sidebarFocusRingClassName,
} from "./navItemStyles";

// ============================================
// MAIN COMPONENT
// ============================================

export const Sidebar = memo(function Sidebar() {
  const { isCollapsed, toggle } = useSidebar();
  const { navigation, isItemActive } = useNavigationWithBadges();

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full w-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        {/* Brand row + collapse/expand — always at top (never footer) */}
        <div className="flex h-14 items-center border-b border-sidebar-border px-3">
          <div
            className={cn(
              "flex w-full items-center",
              isCollapsed ? "justify-center" : "justify-between gap-2",
            )}
          >
            <Link
              to="/dashboard"
              className={cn(
                "flex items-center overflow-hidden rounded-md text-sidebar-foreground",
                sidebarFocusRingClassName,
              )}
              aria-label={`Ir al dashboard de ${BRAND.productName}`}
            >
              <BrandLockup
                compact={isCollapsed}
                variant="onInk"
                markVariant="brand"
                decorative
                markSize={isCollapsed ? 32 : 30}
              />
            </Link>
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className={sidebarChromeButtonClassName()}
                onClick={toggle}
                aria-label="Colapsar menú"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {isCollapsed && (
          <div className="flex justify-center border-b border-sidebar-border p-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={sidebarChromeButtonClassName()}
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

        <ScrollArea className="min-h-0 flex-1">
          <nav className="p-2" aria-label="Navegación principal">
            {navigation.map((group) => (
              <NavGroupComponent
                key={group.id}
                group={group}
                isCollapsed={isCollapsed}
                isItemActive={isItemActive}
              />
            ))}
          </nav>
        </ScrollArea>
      </div>
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
    <div className="mb-3">
      {group.title && (
        <div className="relative mb-2 min-h-px">
          <h3
            className={cn(
              navGroupLabelClassName("mb-0"),
              SIDEBAR_LABEL_FADE_CLASS,
              isCollapsed
                ? "pointer-events-none absolute inset-x-0 opacity-0"
                : "opacity-100",
            )}
            aria-hidden={isCollapsed || undefined}
          >
            {group.title}
          </h3>
          <div
            className={cn(
              "mx-2 border-t border-sidebar-border",
              SIDEBAR_LABEL_FADE_CLASS,
              isCollapsed
                ? "opacity-100"
                : "pointer-events-none absolute inset-x-0 opacity-0",
            )}
            aria-hidden
          />
        </div>
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
  const hasBadge =
    item.badge !== undefined && item.badge !== 0 && item.badge !== "";

  const content = (
    <Link
      to={item.path}
      aria-current={isActive ? "page" : undefined}
      aria-label={isCollapsed ? item.label : undefined}
      className={navItemClassName({
        isActive,
        isCollapsed,
        disabled: item.disabled,
      })}
    >
      <NavActiveRail visible={isActive} />
      <span className="relative inline-flex shrink-0">
        <Icon className="h-5 w-5" strokeWidth={1.5} />
        {isCollapsed && hasBadge && (
          <NavBadge value={item.badge!} collapsed />
        )}
      </span>
      <span
        className={cn("flex-1 truncate", navLabelVisibilityClassName(!isCollapsed))}
        aria-hidden={isCollapsed || undefined}
      >
        {item.label}
      </span>
      {item.badge !== undefined && (
        <span
          className={navLabelVisibilityClassName(!isCollapsed)}
          aria-hidden={isCollapsed || undefined}
        >
          <NavBadge value={item.badge} />
        </span>
      )}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {item.label}
          {hasBadge && (
            <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-medium leading-none text-destructive-foreground">
              {typeof item.badge === "number" && item.badge > 99
                ? "99+"
                : item.badge}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
});
