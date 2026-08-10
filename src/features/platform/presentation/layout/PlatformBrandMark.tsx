/**
 * Mark visual de la consola platform (tenant 0).
 *
 * Deliberadamente distinto del Wordmark de laTuno: Shield + nombre
 * `BRAND.platformName`. No usar `@shared/ui/brand` Wordmark aquí.
 */
import { Shield } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { platformCopy } from "../copy/platformCopy";

type PlatformBrandMarkProps = {
  /** Solo icono (sidebar colapsado / mobile header compacto). */
  compact?: boolean;
  className?: string;
  iconClassName?: string;
};

export function PlatformBrandMark({
  compact = false,
  className,
  iconClassName,
}: PlatformBrandMarkProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
          iconClassName,
        )}
        aria-hidden
      >
        <Shield className="h-5 w-5" />
      </div>
      {!compact ? (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {platformCopy.brand.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {platformCopy.brand.subtitle}
          </p>
        </div>
      ) : null}
    </div>
  );
}
