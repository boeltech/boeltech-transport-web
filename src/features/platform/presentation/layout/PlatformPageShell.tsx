import { memo, type ReactNode } from "react";
import { cn } from "@shared/lib/utils/cn";

export interface PlatformPageShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Shell de contenido para rutas `/platform/*`.
 * Sin sidebar de settings tenant ni PermissionProvider.
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
