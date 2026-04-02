/**
 * ClientCardSkeleton Component
 * Clean Architecture - Presentation Layer
 *
 * Skeleton loader para la tarjeta de cliente.
 *
 * Ubicación: src/features/clients/presentation/components/ClientCardSkeleton.tsx
 */

import { Card, CardContent, CardHeader } from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";

// ============================================================================
// TYPES
// ============================================================================

export interface ClientCardSkeletonProps {
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ClientCardSkeleton({ className }: ClientCardSkeletonProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            {/* Código y badge */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-14" />
            </div>
            {/* Nombre */}
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          {/* Botón acciones */}
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* RFC y tipo */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-20" />
        </div>

        {/* Ubicación */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-36" />
        </div>

        {/* Contacto */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>

        {/* Términos de pago */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// GRID SKELETON
// ============================================================================

export interface ClientCardGridSkeletonProps {
  count?: number;
}

export function ClientCardGridSkeleton({
  count = 6,
}: ClientCardGridSkeletonProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ClientCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default ClientCardSkeleton;
