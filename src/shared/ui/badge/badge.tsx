/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@shared/lib/utils/cn";

/**
 * Badge variants — Design System Fase 0
 *
 * Cada variante semántica tiene dos tonos:
 *   - `solid` (default): fondo lleno con color saturado del token.
 *     Úsalo para estados que requieren máximo énfasis (errores críticos,
 *     conteos importantes, CTAs visuales).
 *   - `soft`: fondo tenue tintado, texto en color saturado. Más
 *     legible en listas densas y dashboards. Es el default recomendado
 *     para chips de estado en tablas (viaje "en curso", conductor
 *     "disponible", etc.).
 *
 * Uso típico:
 *   <Badge variant="success">Completado</Badge>            // solid
 *   <Badge variant="success" tone="soft">Completado</Badge> // soft
 *
 * Reglas:
 *   - NUNCA usar colores Tailwind crudos (bg-green-500, text-yellow-700, …).
 *   - Si necesitas un estado nuevo, agrega un token primero en index.css.
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        // Semantic — solid (tonos saturados, máximo énfasis)
        success:
          "border-transparent bg-success text-success-foreground shadow hover:bg-success/80",
        warning:
          "border-transparent bg-warning text-warning-foreground shadow hover:bg-warning/80",
        info:
          "border-transparent bg-info text-info-foreground shadow hover:bg-info/80",
        neutral:
          "border-transparent bg-neutral text-neutral-foreground shadow hover:bg-neutral/80",
      },
      tone: {
        solid: "",
        // Soft — overrides el background y texto a tonos tenues.
        // Solo aplica visualmente cuando la variante es semántica.
        soft: "",
      },
    },
    compoundVariants: [
      // Soft para cada variante semántica
      {
        variant: "success",
        tone: "soft",
        className:
          "bg-success-soft text-success-soft-foreground shadow-none hover:bg-success-soft/80",
      },
      {
        variant: "warning",
        tone: "soft",
        className:
          "bg-warning-soft text-warning-soft-foreground shadow-none hover:bg-warning-soft/80",
      },
      {
        variant: "info",
        tone: "soft",
        className:
          "bg-info-soft text-info-soft-foreground shadow-none hover:bg-info-soft/80",
      },
      {
        variant: "destructive",
        tone: "soft",
        className:
          "bg-destructive-soft text-destructive-soft-foreground shadow-none hover:bg-destructive-soft/80",
      },
      {
        variant: "neutral",
        tone: "soft",
        className:
          "bg-neutral-soft text-neutral-soft-foreground shadow-none hover:bg-neutral-soft/80",
      },
    ],
    defaultVariants: {
      variant: "default",
      tone: "solid",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, tone, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, tone }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
