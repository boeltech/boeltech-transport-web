import { memo, type ReactNode } from "react";
import { cn } from "@shared/lib/utils/cn";

export interface PlatformPageShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Contenedor de título opcional para rutas `/platform/*` dentro de PlatformShell.
 *
 * D3: ListPageShell / DetailPageShell / FormPageShell compartidos son OK aquí
 * (p. ej. ListPageShell con `showHeader={false}`). No usar SettingsPageShell
 * (chrome de settings tenant + PermissionProvider).
 */
export const PlatformPageShell = memo(function PlatformPageShell({
  title,
  description,
  children,
  className,
}: PlatformPageShellProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
});
