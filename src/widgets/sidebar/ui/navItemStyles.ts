import { cn } from "@shared/lib/utils/cn";
import { SIDEBAR_LABEL_FADE_CLASS } from "../model/sidebarLayout";

/** Anillo focus-visible coherente sobre ink del sidebar. */
export const sidebarFocusRingClassName =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar";

/** Chrome interno (colapsar / expandir / cerrar móvil). */
export function sidebarChromeButtonClassName(className?: string): string {
  return cn(
    "size-8 shrink-0 text-sidebar-foreground/70",
    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    sidebarFocusRingClassName,
    className,
  );
}

/** Ítem de nav: activo = accent + tipografía foreground; riel ámbar (sidebar-primary). */
export function navItemClassName(options: {
  isActive: boolean;
  isCollapsed?: boolean;
  disabled?: boolean;
  className?: string;
}): string {
  const { isActive, isCollapsed, disabled, className } = options;
  return cn(
    "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    sidebarFocusRingClassName,
    isActive &&
      "bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
    isCollapsed && "justify-center px-2 gap-0",
    disabled && "pointer-events-none opacity-50",
    className,
  );
}

/** Labels de grupo: sentence-case, contraste sobre ink. */
export function navGroupLabelClassName(className?: string): string {
  return cn(
    "mb-2 px-3 text-xs font-medium text-sidebar-foreground/60",
    className,
  );
}

/**
 * Visibilidad de label (ítem o grupo) al colapsar.
 * Oculta del flujo cuando no es visible para no empujar el ícono.
 */
export function navLabelVisibilityClassName(visible: boolean): string {
  return cn(
    SIDEBAR_LABEL_FADE_CLASS,
    visible
      ? "opacity-100"
      : "pointer-events-none w-0 flex-none overflow-hidden opacity-0",
  );
}
