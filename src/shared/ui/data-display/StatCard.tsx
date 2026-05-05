/**
 * StatCard
 * Shared UI - Data Display
 *
 * Tarjeta para mostrar un KPI / métrica.
 * Patrón usado en VehicleDetailPage, DriverDetailPage, CatalogsPage, etc.
 */

import type { ReactNode } from "react";
import { Card, CardContent } from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";
import { cn } from "@shared/lib/utils/cn";

// ============================================================================
// TYPES
// ============================================================================

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
  /** Clases extra para el Card raíz. */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function StatCard({
  title,
  value,
  icon,
  description,
  isLoading = false,
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
              <p className="text-2xl font-bold">{value}</p>
            )}
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <div
            className={cn(
              "h-10 w-10 rounded-lg bg-primary/10",
              "flex items-center justify-center",
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
