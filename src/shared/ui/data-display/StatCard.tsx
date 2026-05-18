/**
 * StatCard
 * Shared UI - Data Display
 *
 * Tarjeta para mostrar un KPI / métrica.
 * Patrón usado en VehicleDetailPage, DriverDetailPage, CatalogsPage, etc.
 *
 * Design System — Fase 2:
 *   - Nuevo prop `tone` para colorear el ícono y el fondo según el carácter
 *     del KPI (success para "viajes completados", warning para "pendientes",
 *     destructive para "cancelados", etc.).
 *   - Default tone: "primary" (azul-tinta de marca, comportamiento histórico).
 */

import type { ReactNode } from "react";
import { Card, CardContent } from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";
import { cn } from "@shared/lib/utils/cn";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Tono semántico del KPI.
 *
 * - `primary` (default): azul-tinta de marca. Para KPIs neutros (totales,
 *   conteos generales).
 * - `success`: verde. Para KPIs positivos (completados, ingresos).
 * - `warning`: ámbar. Para KPIs de atención (pendientes, por vencer).
 * - `info`: azul informativo. Para KPIs informativos no críticos.
 * - `destructive`: rojo. Para KPIs negativos (cancelados, vencidos).
 * - `neutral`: gris. Para KPIs sin connotación (borradores, inactivos).
 */
export type StatCardTone =
  | "primary"
  | "success"
  | "warning"
  | "info"
  | "destructive"
  | "neutral";

export interface StatCardProps {
  /** Título corto del KPI (ej. "Viajes Totales"). */
  title: string;
  /** Valor del KPI; aceptado como string o número (se renderiza tal cual). */
  value: string | number;
  /** Icono lateral. */
  icon: ReactNode;
  /** Descripción complementaria opcional debajo del valor. */
  description?: string;
  /** Estado de carga; muestra skeletons en lugar del valor. */
  isLoading?: boolean;
  /**
   * Tono semántico del KPI. Colorea el ícono y su fondo.
   * Default: "primary" (comportamiento histórico).
   */
  tone?: StatCardTone;
  /** Clases extra para el Card raíz. */
  className?: string;
}

// ============================================================================
// TONE STYLES
// ============================================================================

const TONE_ICON_CLASSES: Record<StatCardTone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success-soft text-success-soft-foreground",
  warning: "bg-warning-soft text-warning-soft-foreground",
  info: "bg-info-soft text-info-soft-foreground",
  destructive: "bg-destructive-soft text-destructive-soft-foreground",
  neutral: "bg-neutral-soft text-neutral-soft-foreground",
};

// ============================================================================
// COMPONENT
// ============================================================================

export function StatCard({
  title,
  value,
  icon,
  description,
  isLoading = false,
  tone = "primary",
  className,
}: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold tabular-nums">{value}</p>
            )}
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <div
            className={cn(
              "h-10 w-10 rounded-lg",
              "flex items-center justify-center",
              TONE_ICON_CLASSES[tone],
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default StatCard;
