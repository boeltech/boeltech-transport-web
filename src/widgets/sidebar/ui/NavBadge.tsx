/**
 * Badge de contador en ítems del sidebar (aprobaciones, etc.).
 */

import { memo } from "react";
import { cn } from "@shared/lib/utils/cn";

export interface NavBadgeProps {
  value: number | string;
  /** En riel colapsado: pill compacto o punto si el número no cabe. */
  collapsed?: boolean;
  className?: string;
}

function shouldRenderBadge(value: number | string): boolean {
  return value !== 0 && value !== "";
}

export const NavBadge = memo(function NavBadge({
  value,
  collapsed = false,
  className,
}: NavBadgeProps) {
  if (!shouldRenderBadge(value)) return null;

  if (typeof value === "string") {
    if (collapsed) {
      return (
        <span
          aria-hidden
          className={cn(
            "absolute -right-0.5 -top-0.5 size-2 rounded-full bg-sidebar-primary",
            className,
          )}
        />
      );
    }
    return (
      <span
        className={cn(
          "rounded-full bg-sidebar-accent px-2 py-0.5 text-[10px] font-medium leading-none text-sidebar-accent-foreground",
          className,
        )}
      >
        {value}
      </span>
    );
  }

  const displayValue = value > 99 ? "99+" : value;

  if (collapsed) {
    // Un dígito cabe en el ícono; más → punto de urgencia.
    if (value > 9) {
      return (
        <span
          aria-hidden
          className={cn(
            "absolute -right-0.5 -top-0.5 size-2 rounded-full bg-destructive",
            className,
          )}
        />
      );
    }
    return (
      <span
        className={cn(
          "absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[10px] font-medium leading-none text-destructive-foreground",
          className,
        )}
      >
        {displayValue}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-medium text-destructive-foreground",
        className,
      )}
    >
      {displayValue}
    </span>
  );
});
