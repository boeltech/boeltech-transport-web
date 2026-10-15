import { cn } from "@shared/lib/utils/cn";

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
    isActive &&
      "bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
    isCollapsed && "justify-center px-2",
    disabled && "pointer-events-none opacity-50",
    className,
  );
}

/** Labels de grupo: sentence-case, contraste sobre ink. */
export function navGroupLabelClassName(): string {
  return "mb-2 px-3 text-xs font-medium text-sidebar-foreground/60";
}
