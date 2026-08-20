/**
 * TrailerCardSkeleton
 * Clean Architecture - Presentation Layer (Components)
 *
 * Skeleton de TrailerCard mientras carga el listado.
 */

import { Card, CardContent, CardFooter, CardHeader } from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";

export function TrailerCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-5 w-24" />
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-28" />
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex w-full items-center justify-between">
          <Skeleton className="h-6 w-20 rounded-full" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
