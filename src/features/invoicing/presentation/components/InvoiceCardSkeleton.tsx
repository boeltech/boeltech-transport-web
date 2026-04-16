/**
 * InvoiceCardSkeleton
 * Clean Architecture - Presentation Layer (Components)
 *
 * Skeleton loader para InvoiceCard.
 *
 * Ubicación: src/features/invoicing/presentation/components/InvoiceCardSkeleton.tsx
 */

import { Card, CardContent, CardFooter, CardHeader } from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";

export function InvoiceCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Cliente */}
          <div className="col-span-2 flex items-start gap-2">
            <Skeleton className="h-4 w-4 rounded mt-0.5" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          {/* Método */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-5 w-12" />
          </div>
          {/* Fecha */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
          {/* Viajes */}
          <div className="col-span-2 flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex w-full items-center justify-between">
          <Skeleton className="h-6 w-20 rounded-full" />
          <div className="flex items-center gap-3">
            <div className="space-y-1 text-right">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-16 ml-auto" />
            </div>
            <Skeleton className="h-8 w-14" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
