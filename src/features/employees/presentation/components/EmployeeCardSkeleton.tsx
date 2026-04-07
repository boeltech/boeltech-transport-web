/**
 * EmployeeCardSkeleton
 * Clean Architecture - Presentation Layer (Components)
 *
 * Skeleton loader para EmployeeCard.
 *
 * Ubicación: src/features/employees/presentation/components/EmployeeCardSkeleton.tsx
 */

import { Card, CardContent, CardFooter, CardHeader } from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";

export function EmployeeCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
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
