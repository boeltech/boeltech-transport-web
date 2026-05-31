import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  Box,
  Layers,
  Package,
  Plus,
  RefreshCw,
} from "lucide-react";

import { useUpdateCargo } from "@features/trips/application";
import {
  CargoStatus,
  type CargoStatusType,
  type TripCargo,
  type TripStatusType,
  type TripStop,
  CARGO_STATUS_LABELS,
  TripStatus,
} from "@features/trips/domain";
import { formatCurrency } from "@features/trips";
import { useToast } from "@shared/hooks";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { DetailAlertCard } from "@shared/ui/data-display";
import { Skeleton } from "@shared/ui/skeleton";
import { cn } from "@shared/lib/utils/cn";

import { tripDetailCopy } from "../../copy";
import { TripDetailCargoByCargoView } from "./TripDetailCargoByCargoView";
import { TripDetailCargoByPickupView } from "./TripDetailCargoByPickupView";

const copy = tripDetailCopy.cargo;

type CargoDetailView = "byCargo" | "byPickup";

function getCargoStatusVariant(
  status: CargoStatusType,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "delivered":
      return "default";
    case "in_transit":
      return "secondary";
    case "cancelled":
    case "returned":
      return "destructive";
    default:
      return "outline";
  }
}

function CargosSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-64" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CargoLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-destructive/50">
      <CardContent className="py-6 text-center">
        <AlertCircle className="h-10 w-10 mx-auto text-destructive mb-3" />
        <p className="text-sm text-muted-foreground mb-3">{copy.state.loadError}</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" /> {copy.action.retry}
        </Button>
      </CardContent>
    </Card>
  );
}

export interface TripDetailCargoTabProps {
  tripId: string;
  tripStatus: TripStatusType;
  cargos: TripCargo[];
  orderedStops: TripStop[];
  pickupStops: TripStop[];
  isLoading: boolean;
  isError: boolean;
  canEditStructural: boolean;
  onRetry: () => void;
  onCargosChanged?: () => void;
}

export function TripDetailCargoTab({
  tripId,
  tripStatus,
  cargos,
  orderedStops,
  pickupStops,
  isLoading,
  isError,
  canEditStructural,
  onRetry,
  onCargosChanged,
}: TripDetailCargoTabProps) {
  const { toast } = useToast();
  const [cargoDetailView, setCargoDetailView] = useState<CargoDetailView>("byCargo");

  const deliverCargoMutation = useUpdateCargo(tripId, {
    onSuccess: () => {
      toast({ title: copy.toast.delivered, variant: "success" });
      onCargosChanged?.();
    },
    onError: (e: Error) =>
      toast({
        title: copy.toast.deliverError,
        description: e.message,
        variant: "destructive",
      }),
  });

  if (isLoading) {
    return <CargosSkeleton />;
  }

  if (isError) {
    return <CargoLoadError onRetry={onRetry} />;
  }

  if (cargos.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm font-medium">{copy.state.emptyTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {copy.state.emptyDescription}
          </p>
          {canEditStructural ? (
            <Button variant="outline" className="mt-5" asChild>
              <Link to={`/trips/${tripId}/edit`}>
                <Plus className="mr-2 h-4 w-4" />
                {copy.action.addInFullEdit}
              </Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const cargoCount = cargos.length;
  const totalDeclaredValue = cargos.reduce(
    (sum, c) => sum + (c.declaredValue || 0),
    0,
  );
  const totalCargoWeight = cargos.reduce((sum, c) => sum + (c.weight || 0), 0);

  const cargoStatusCounts = new Map<CargoStatusType, number>();
  for (const c of cargos) {
    cargoStatusCounts.set(c.status, (cargoStatusCounts.get(c.status) ?? 0) + 1);
  }
  const cargoStatusBreakdown = Array.from(cargoStatusCounts.entries()).sort(
    (a, b) => b[1] - a[1],
  );
  const cargoStatusMaxCount = cargoStatusBreakdown.reduce(
    (m, [, n]) => Math.max(m, n),
    0,
  );

  const cargosWithoutPickup = cargos.filter(
    (cargo) => !cargo.movements?.some((movement) => movement.movementType === "pickup"),
  );
  const cargosWithoutDelivery = cargos.filter(
    (cargo) =>
      cargo.status !== CargoStatus.CANCELLED &&
      !cargo.movements?.some((movement) => movement.movementType === "delivery"),
  );
  const unresolvedMovementCount = cargos.reduce((count, cargo) => {
    if (!cargo.movements?.length) return count;
    return (
      count +
      cargo.movements.filter((movement) => {
        const foundStop = orderedStops.find(
          (stop) =>
            stop.id === movement.stopId ||
            stop.sequenceOrder === movement.stopIndex,
        );
        return !foundStop;
      }).length
    );
  }, 0);

  const pickupGroups = pickupStops.map((stop) => {
    const items = cargos.filter((cargo) =>
      cargo.movements?.some(
        (movement) =>
          movement.movementType === "pickup" &&
          (movement.stopId === stop.id || movement.stopIndex === stop.sequenceOrder),
      ),
    );
    return { stop, items };
  });

  return (
    <div
      className={cn(
        "grid gap-6",
        cargoStatusBreakdown.length > 0 ? "lg:grid-cols-3" : "",
      )}
    >
      <div
        className={cn(
          "min-w-0 space-y-6",
          cargoStatusBreakdown.length > 0 ? "lg:col-span-2" : "",
        )}
      >
        <DetailAlertCard
          severity="info"
          icon={<Package className="h-4 w-4" />}
          title={copy.section.scope}
          items={
            canEditStructural
              ? [{ text: copy.hint.scopeEditable }]
              : [{ text: copy.hint.scopeReadOnly }]
          }
        />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 shrink-0 text-primary" />
              {copy.section.summary}
            </CardTitle>
            <CardDescription>{copy.hint.summary}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {copy.label.totalCargos}
                </p>
                <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight">
                  {cargoCount}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {copy.label.totalWeight}
                </p>
                <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight">
                  {totalCargoWeight > 0
                    ? `${totalCargoWeight.toLocaleString("es-MX")} kg`
                    : "—"}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {copy.label.declaredValue}
                </p>
                <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight">
                  {totalDeclaredValue > 0 ? formatCurrency(totalDeclaredValue) : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {cargosWithoutPickup.length > 0 ? (
          <DetailAlertCard
            severity="warning"
            icon={<AlertTriangle className="h-4 w-4" />}
            title={copy.alert.noPickupTitle}
            items={[
              { text: copy.alert.noPickupBody(cargosWithoutPickup.length) },
              { text: copy.hint.reviewPlanning },
            ]}
          />
        ) : null}

        {cargosWithoutDelivery.length > 0 || unresolvedMovementCount > 0 ? (
          <DetailAlertCard
            severity="info"
            icon={<Layers className="h-4 w-4" />}
            title={copy.alert.reviewTitle}
            items={[
              ...(cargosWithoutDelivery.length > 0
                ? [{ text: copy.alert.noDeliveryBody(cargosWithoutDelivery.length) }]
                : []),
              ...(unresolvedMovementCount > 0
                ? [{ text: copy.alert.unresolvedMovementBody(unresolvedMovementCount) }]
                : []),
            ]}
          />
        ) : null}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Box className="h-4 w-4 shrink-0" />
                  {copy.section.list}
                </CardTitle>
                <CardDescription className="mt-1.5">{copy.hint.list}</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-md border p-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={cargoDetailView === "byCargo" ? "secondary" : "ghost"}
                    className="h-7 px-2 text-xs"
                    onClick={() => setCargoDetailView("byCargo")}
                  >
                    {copy.action.viewByCargo}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={cargoDetailView === "byPickup" ? "secondary" : "ghost"}
                    className="h-7 px-2 text-xs"
                    onClick={() => setCargoDetailView("byPickup")}
                  >
                    {copy.action.viewByPickup}
                  </Button>
                </div>
                {canEditStructural ? (
                  <Button type="button" size="sm" variant="outline" asChild>
                    <Link to={`/trips/${tripId}/edit`}>{copy.action.openFullEdit}</Link>
                  </Button>
                ) : null}
                <Badge variant="secondary" className="w-fit shrink-0 text-xs">
                  {copy.format.cargoCount(cargoCount)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {cargoDetailView === "byCargo" ? (
              <TripDetailCargoByCargoView
                cargos={cargos}
                orderedStops={orderedStops}
                formatCurrency={formatCurrency}
                getCargoStatusVariant={getCargoStatusVariant}
                canDeliverCargo={tripStatus === TripStatus.IN_PROGRESS}
                isDeliverPending={deliverCargoMutation.isPending}
                onDeliverCargo={(cargoId) =>
                  deliverCargoMutation.mutate({
                    cargoId,
                    data: { status: CargoStatus.DELIVERED },
                  })
                }
              />
            ) : (
              <TripDetailCargoByPickupView
                groups={pickupGroups}
                orderedStops={orderedStops}
                formatCurrency={formatCurrency}
                getCargoStatusVariant={getCargoStatusVariant}
                canDeliverCargo={tripStatus === TripStatus.IN_PROGRESS}
                isDeliverPending={deliverCargoMutation.isPending}
                onDeliverCargo={(cargoId) =>
                  deliverCargoMutation.mutate({
                    cargoId,
                    data: { status: CargoStatus.DELIVERED },
                  })
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      {cargoStatusBreakdown.length > 0 ? (
        <div className="min-w-0 lg:col-span-1">
          <Card className="lg:sticky lg:top-24">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
                {copy.section.byStatus}
              </CardTitle>
              <CardDescription>{copy.hint.byStatus}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cargoStatusBreakdown.map(([status, count]) => {
                const pct =
                  cargoStatusMaxCount > 0
                    ? Math.round((count / cargoStatusMaxCount) * 100)
                    : 0;
                return (
                  <div key={status} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate text-muted-foreground">
                        {CARGO_STATUS_LABELS[status] || status}
                      </span>
                      <span className="shrink-0 font-medium tabular-nums">{count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/75 transition-[width]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
