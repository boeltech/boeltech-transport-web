import { cn } from "@shared/lib/utils/cn";

/**
 * Ítem de nav platform — mismos tokens que el sidebar ERP (`navItemStyles`).
 * Copia local a propósito: no eleva exports del widget ni acopla a AppLayout.
 */
export function platformNavItemClassName(options: {
  isActive: boolean;
  isCollapsed?: boolean;
  className?: string;
}): string {
  const { isActive, isCollapsed, className } = options;
  return cn(
    "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    isActive &&
      "bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
    isCollapsed && "justify-center px-2",
    className,
  );
}
