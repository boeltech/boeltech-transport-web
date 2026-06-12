/**
 * ChartCard — wrapper estándar para charts en páginas de feature.
 * Card + header (title/tools) + content + footer + estados loading/error.
 */

import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";
import { cn } from "@shared/lib/utils/cn";

export interface ChartCardProps {
  title: string;
  description?: string;
  tools?: ReactNode;
  footer?: ReactNode;
  /** Obligatorio — fuerza a features a manejar loading explícitamente. */
  isLoading: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
  /** Etiqueta accesible para screen readers (nombre del gráfico). */
  "aria-label"?: string;
}

export function ChartCard({
  title,
  description,
  tools,
  footer,
  isLoading,
  error,
  children,
  className,
  "aria-label": ariaLabel,
}: ChartCardProps) {
  const chartAreaLabel = ariaLabel ?? title;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>{title}</CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </div>
        {tools ? (
          <div className="flex shrink-0 items-center gap-2">{tools}</div>
        ) : null}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div
            className="space-y-3"
            role="status"
            aria-busy="true"
            aria-label={`Cargando ${chartAreaLabel}`}
          >
            <Skeleton className="h-[240px] w-full rounded-lg" />
            <div className="flex gap-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
        ) : error ? (
          <div
            role="alert"
            aria-live="polite"
            className={cn(
              "flex min-h-[240px] flex-col items-center justify-center gap-2",
              "rounded-lg border border-destructive/30 bg-destructive-soft/40 px-4 py-8 text-center",
            )}
          >
            <AlertCircle
              className="h-8 w-8 text-destructive"
              aria-hidden
            />
            <p className="text-sm font-medium text-destructive-soft-foreground">
              No se pudo cargar el gráfico
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">{error}</p>
          </div>
        ) : (
          <div role="img" aria-label={chartAreaLabel}>
            {children}
          </div>
        )}
      </CardContent>
      {footer && !isLoading && !error ? (
        <CardFooter>{footer}</CardFooter>
      ) : null}
    </Card>
  );
}
