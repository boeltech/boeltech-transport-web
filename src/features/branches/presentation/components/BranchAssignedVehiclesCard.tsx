import { Link } from "react-router-dom";
import { Truck } from "lucide-react";
import { VehicleStatusBadge } from "@features/vehicles/presentation/config/vehicleStatusConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";
import { useBranchVehicles } from "../../application";
import { branchesCopy } from "../copy/branchesCopy";

interface BranchAssignedVehiclesCardProps {
  branchId: string;
}

export function BranchAssignedVehiclesCard({
  branchId,
}: BranchAssignedVehiclesCardProps) {
  const { data: vehicles = [], isLoading } = useBranchVehicles(branchId);
  const copy = branchesCopy.detail.vehicles;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-muted-foreground" />
            {branchesCopy.detail.cards.vehicles}
          </span>
          {!isLoading ? (
            <span className="text-sm font-normal text-muted-foreground">
              {copy.count(vehicles.length)}
            </span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : vehicles.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">{copy.empty}</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {vehicles.map((vehicle) => (
              <li
                key={vehicle.id}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">
                      {vehicle.unitNumber}
                    </p>
                    <VehicleStatusBadge status={vehicle.status} />
                  </div>
                  <p className="text-muted-foreground">
                    {[
                      vehicle.licensePlate,
                      [vehicle.brand, vehicle.model].filter(Boolean).join(" "),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <Link
                  to={`/vehicles/${vehicle.id}`}
                  className="shrink-0 text-primary underline-offset-4 hover:underline"
                >
                  {copy.viewVehicle}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
