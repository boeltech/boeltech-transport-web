/**
 * DetailTimeline
 * Shared UI - Data Display
 *
 * Timeline vertical reutilizable para visualizar secuencias de eventos:
 * - Paradas de un viaje
 * - Historial de cambios de estado
 * - Eventos del empleado (contrataciones, promociones, bajas)
 * - Mantenimientos del vehículo
 *
 * Cada item se compone de:
 * - Un dot circular (icon + color, opcionalmente "completado" → verde)
 * - Una línea vertical que conecta con el siguiente item (excepto el último)
 * - Un slot de contenido (Card, párrafos, etc.)
 *
 * @example
 * <DetailTimeline
 *   items={stops.map((stop) => ({
 *     id: stop.id,
 *     icon: <MapPin className="h-5 w-5" />,
 *     completed: !!stop.actualArrival,
 *     content: <StopCard stop={stop} />,
 *   }))}
 * />
 */

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";

// ============================================================================
// TYPES
// ============================================================================

export interface DetailTimelineItem {
  /** Identificador único (key de React). */
  id: string;
  /** Icono mostrado dentro del dot. Si `completed`, se reemplaza por Check. */
  icon: ReactNode;
  /** Si true, el dot se pinta de verde y la línea de conexión también. */
  completed?: boolean;
  /**
   * Clases para el fondo del dot cuando NO está completado.
   * Si se omite, se usa `bg-muted`.
   */
  dotBgClassName?: string;
  /**
   * Clases para el color del icon cuando NO está completado.
   * Si se omite, se usa `text-muted-foreground`.
   */
  dotIconClassName?: string;
  /** Tamaño del dot. Por defecto "md" (h-10 w-10). */
  dotSize?: "sm" | "md";
  /** Contenido a la derecha del dot. */
  content: ReactNode;
}

export interface DetailTimelineProps {
  items: DetailTimelineItem[];
  /** Clases extra para el contenedor. */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const dotSizeClasses: Record<NonNullable<DetailTimelineItem["dotSize"]>, string> =
  {
    sm: "h-8 w-8",
    md: "h-10 w-10",
  };

const lineMinHeight: Record<NonNullable<DetailTimelineItem["dotSize"]>, string> =
  {
    sm: "min-h-[24px]",
    md: "min-h-[60px]",
  };

// ============================================================================
// COMPONENT
// ============================================================================

export function DetailTimeline({ items, className }: DetailTimelineProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn("relative", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const dotSize = item.dotSize ?? "md";
        const sizeClass = dotSizeClasses[dotSize];
        const lineMin = lineMinHeight[dotSize];

        return (
          <div key={item.id} className="flex gap-4">
            {/* ── Dot + connector line ─────────────────────────────────── */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "shrink-0 rounded-full flex items-center justify-center border-2",
                  sizeClass,
                  item.completed
                    ? "bg-success-soft border-success"
                    : cn(
                        item.dotBgClassName ?? "bg-muted",
                        "border-muted-foreground/30",
                      ),
                )}
              >
                {item.completed ? (
                  <Check className="h-5 w-5 text-success" />
                ) : (
                  <span
                    className={cn(
                      "flex items-center justify-center",
                      item.dotIconClassName ?? "text-muted-foreground",
                    )}
                  >
                    {item.icon}
                  </span>
                )}
              </div>

              {!isLast ? (
                <div
                  className={cn(
                    "w-0.5 flex-1",
                    lineMin,
                    item.completed
                      ? "bg-success"
                      : "bg-muted-foreground/20",
                  )}
                  aria-hidden
                />
              ) : null}
            </div>

            {/* ── Content ──────────────────────────────────────────────── */}
            <div className="flex-1 pb-4 min-w-0">{item.content}</div>
          </div>
        );
      })}
    </div>
  );
}

export default DetailTimeline;
