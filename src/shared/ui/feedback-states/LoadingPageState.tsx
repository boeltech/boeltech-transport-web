/**
 * LoadingPageState
 * Shared UI - Feedback States
 *
 * Skeletons estandarizados por tipo de página.
 * Cada variante refleja la estructura del shell correspondiente.
 *
 * - "list"   → header + toolbar + tabla + paginación
 * - "detail" → header + stats + tabs + cards
 * - "form"   → header + 4 form section cards + actions
 * - "wizard" → header + steps + 1 card de paso + nav bar
 */

import { Card, CardContent, CardHeader } from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";
import { cn } from "@shared/lib/utils/cn";

// ============================================================================
// TYPES
// ============================================================================

export type LoadingPageVariant = "list" | "detail" | "form" | "wizard";

export interface LoadingPageStateProps {
  /** Tipo de página que se está cargando. */
  variant: LoadingPageVariant;
  /** Clases extra para el contenedor. */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function LoadingPageState({
  variant,
  className,
}: LoadingPageStateProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {variant === "list" ? <ListSkeleton /> : null}
      {variant === "detail" ? <DetailSkeleton /> : null}
      {variant === "form" ? <FormSkeleton /> : null}
      {variant === "wizard" ? <WizardSkeleton /> : null}
    </div>
  );
}

export default LoadingPageState;

// ============================================================================
// VARIANTS
// ============================================================================

function ListSkeleton() {
  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-9 ml-auto" />
        <Skeleton className="h-9 w-20" />
      </div>

      {/* Table rows */}
      <div className="rounded-lg border">
        <div className="border-b p-4">
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-b last:border-b-0 p-4">
            <Skeleton className="h-5 w-full" />
          </div>
        ))}
      </div>
    </>
  );
}

function DetailSkeleton() {
  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-24" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Skeleton className="h-10 w-full max-w-xl" />

      {/* Content */}
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

function FormSkeleton() {
  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Form section cards */}
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </>
  );
}

function WizardSkeleton() {
  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>

      {/* Steps */}
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>

      {/* Step content */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Nav bar */}
      <div className="flex items-center justify-between border-t pt-6 mt-6">
        <Skeleton className="h-10 w-28" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </>
  );
}
