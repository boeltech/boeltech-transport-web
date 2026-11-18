import type { ReactNode } from "react";
import { Card, CardContent } from "@shared/ui/card";
import { cn } from "@shared/lib/utils/cn";

/**
 * AddonTeaserRow — fila teaser de complemento embebido (p. ej. ficha de unidad).
 *
 * Solo superficies con contexto (X11 / DC5). No usar en badge de alertas,
 * dashboard ni resumen de viaje. SoT: `platforms/web/design.md` § Complementos.
 */

export interface AddonTeaserRowProps {
  /** Ícono muted a la izquierda (cuadrado 9×9). */
  icon: ReactNode;
  /** Título del complemento (p. ej. «Monitoreo GPS»). */
  title: ReactNode;
  /** Badge de tipo u otros chips junto al título. */
  badge?: ReactNode;
  /** Cuerpo: qué aporta y que no está en el plan. */
  description: ReactNode;
  /** CTA opcional (link «Conocer…»); sin permiso → omitir. */
  action?: ReactNode;
  className?: string;
  /** data-testid del Card contenedor. */
  "data-testid"?: string;
}

export function AddonTeaserRow({
  icon,
  title,
  badge,
  description,
  action,
  className,
  "data-testid": testId = "addon-teaser-row",
}: AddonTeaserRowProps) {
  return (
    <Card data-testid={testId} className={cn(className)}>
      <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:gap-4">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
          aria-hidden
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{title}</p>
            {badge}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
