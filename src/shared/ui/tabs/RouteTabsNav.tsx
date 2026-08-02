/**
 * RouteTabsNav — tabs horizontales con navegación por ruta.
 *
 * Misma apariencia que `@shared/ui/tabs` (TabsList / TabsTrigger soft),
 * para secciones multi-página (Configuración, Mi cuenta) sin Radix Tabs.
 */

import { memo, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

import { cn } from "@shared/lib/utils/cn";
import { Badge } from "@shared/ui/badge";
import {
  tabsListClassName,
  tabsTriggerActiveClassName,
  tabsTriggerClassName,
  tabsTriggerInactiveClassName,
} from "./tabs";

export type RouteTabsNavItem = {
  id: string;
  to: string;
  label: string;
  /** NavLink `end` — match exacto de path. */
  end?: boolean;
  icon?: LucideIcon;
  badge?: string;
  disabled?: boolean;
  /** Tooltip / title nativo. */
  title?: string;
};

export type RouteTabsNavProps = {
  items: readonly RouteTabsNavItem[];
  "aria-label": string;
  className?: string;
  /**
   * Override de activo. Por defecto: path exacto o prefijo `to/`.
   * Con `end: true` en el ítem, solo match exacto.
   */
  isItemActive?: (pathname: string, item: RouteTabsNavItem) => boolean;
};

function defaultIsItemActive(
  pathname: string,
  item: RouteTabsNavItem,
): boolean {
  if (item.end) return pathname === item.to;
  if (pathname === item.to) return true;
  return pathname.startsWith(`${item.to}/`);
}

export const RouteTabsNav = memo(function RouteTabsNav({
  items,
  "aria-label": ariaLabel,
  className,
  isItemActive = defaultIsItemActive,
}: RouteTabsNavProps) {
  const { pathname } = useLocation();

  return (
    <nav
      className={cn(
        tabsListClassName,
        "h-auto min-h-10 w-full max-w-full justify-start gap-1 overflow-x-auto",
        className,
      )}
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const active = !item.disabled && isItemActive(pathname, item);
        return (
          <RouteTab
            key={item.id}
            item={item}
            isActive={active}
          />
        );
      })}
    </nav>
  );
});

type RouteTabProps = {
  item: RouteTabsNavItem;
  isActive: boolean;
};

const RouteTab = memo(function RouteTab({ item, isActive }: RouteTabProps) {
  const Icon = item.icon;

  const content: ReactNode = (
    <>
      {Icon ? (
        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
      ) : null}
      <span>{item.label}</span>
      {item.badge ? (
        <Badge
          variant={isActive ? "secondary" : "outline"}
          className="px-1.5 py-0 text-[10px] font-medium"
        >
          {item.badge}
        </Badge>
      ) : null}
    </>
  );

  if (item.disabled) {
    return (
      <span
        className={cn(
          tabsTriggerClassName,
          "cursor-not-allowed opacity-50",
        )}
        title={item.title}
        aria-disabled="true"
      >
        {content}
      </span>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={item.end}
      title={item.title}
      className={cn(
        tabsTriggerClassName,
        "shrink-0",
        isActive ? tabsTriggerActiveClassName : tabsTriggerInactiveClassName,
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {content}
    </NavLink>
  );
});
