/**
 * VehicleCardSkeleton
 * Clean Architecture - Presentation Layer (Components)
 *
 * Skeleton loader para VehicleCard.
 * Muestra una estructura visual mientras se cargan los datos.
 *
 * Ubicación: src/features/vehicles/presentation/components/VehicleCardSkeleton.tsx
 */

import { Card, CardContent, CardFooter, CardHeader } from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";

// ============================================================================
// COMPONENT
// ============================================================================

export function VehicleCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          {/* Vehicle Icon & Unit Number */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          {/* Actions placeholder */}
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Vehicle Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Type */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-16" />
          </div>

          {/* Year */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-12" />
          </div>

          {/* License Plate */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-20" />
          </div>

          {/* Mileage */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex w-full items-center justify-between">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-8 w-20" />
        </div>
      </CardFooter>
    </Card>
  );
}
