import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Package, Plus, RefreshCw } from "lucide-react";

import {
  useAddCargo,
  useDeleteCargo,
  useReassignCargoMovementStop,
  useUpdateCargo,
} from "@features/trips/application";
import {
  StopType,
  type TripCargo,
  type TripStatusType,
  type TripStop,
} from "@features/trips/domain";
import { useToast } from "@shared/hooks";
import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
import { EmptyState } from "@shared/ui/feedback-states";
import { Skeleton } from "@shared/ui/skeleton";

import { tripDetailCopy } from "../../copy";
import { attachStopIdsToCreateCargoMovements } from "./tripCargoDetailHelpers";
import {
  formValuesToUpdateCargoInput,
  tripCargoToFormValues,
} from "./tripCargoFormBridge";
import { TripDetailCargoMasterDetail } from "./TripDetailCargoMasterDetail";
import { resolveStopForMovement } from "../../utils/stopCargoCorrelation";
import {
  CargoMovementSheet,
  type CargoSheetDeliveryStop,
  type CargoSheetPickupStop,
} from "../../pages/create/components/CargoMovementSheet";
import type { TripCargoFormValues } from "../../pages/create/components/validation";
import { mapWizardCargosToCreateInput } from "../../pages/create/wizardCargoPayload";
import { hasStopType } from "../trip-route/tripRouteDetailHelpers";

const copy = tripDetailCopy.cargo;

function CargosSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 w-full" />
      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
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

function toPickupSheetStop(
  stop: TripStop,
  orderedStops: TripStop[],
): CargoSheetPickupStop {
  return {
    index: Math.max(
      0,
      orderedStops.findIndex((item) => item.id === stop.id),
    ),
    address: stop.address,
    city: stop.city,
    state: stop.state ?? undefined,
    locationName: stop.locationName ?? undefined,
  };
}

function toDeliverySheetStops(
  orderedStops: TripStop[],
  pickupIndex: number,
): CargoSheetDeliveryStop[] {
  return orderedStops.flatMap((stop, index) => {
    if (index <= pickupIndex) return [];
    const isDelivery =
      hasStopType(stop.stopType, StopType.DELIVERY) ||
      hasStopType(stop.stopType, StopType.DESTINATION);
    if (!isDelivery) return [];
    return [
      {
        index,
        address: stop.address,
        city: stop.city,
        locationName: stop.locationName ?? undefined,
      },
    ];
  });
}

export function TripDetailCargoTab({
  tripId,
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
  const navigate = useNavigate();
  const addCargo = useAddCargo(tripId);
  const updateCargo = useUpdateCargo(tripId);
  const deleteCargo = useDeleteCargo(tripId);
  const reassignMovementStop = useReassignCargoMovementStop(tripId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCargoId, setEditingCargoId] = useState<string | null>(null);
  /** Pickup elegido en alta cuando el viaje tiene varias recogidas. */
  const [createPickupStopId, setCreatePickupStopId] = useState<string | null>(
    null,
  );
  /** Pickup elegido en edición (reasignación). */
  const [editPickupStopId, setEditPickupStopId] = useState<string | null>(null);

  const editingCargo =
    editingCargoId != null
      ? (cargos.find((cargo) => cargo.id === editingCargoId) ?? null)
      : null;

  const resolvePickupStopForCargo = (
    cargo: TripCargo | null,
  ): TripStop | null => {
    if (cargo) {
      const pickupMovement = cargo.movements?.find(
        (movement) => movement.movementType === "pickup",
      );
      if (pickupMovement) {
        const resolved = resolveStopForMovement(pickupMovement, orderedStops);
        if (resolved) return resolved;
      }
    }
    return null;
  };

  const createPickupStop =
    (createPickupStopId
      ? pickupStops.find((stop) => stop.id === createPickupStopId)
      : null) ??
    pickupStops[0] ??
    null;

  const editPickupStop = editPickupStopId
    ? (pickupStops.find((stop) => stop.id === editPickupStopId) ?? null)
    : null;

  const activePickupStop = editingCargo
    ? (editPickupStop ??
      resolvePickupStopForCargo(editingCargo) ??
      createPickupStop)
    : createPickupStop;

  const pickupSheetStop = activePickupStop
    ? toPickupSheetStop(activePickupStop, orderedStops)
    : null;
  const availablePickupSheetStops = pickupStops.map((stop) =>
    toPickupSheetStop(stop, orderedStops),
  );
  const deliverySheetStops = pickupSheetStop
    ? toDeliverySheetStops(orderedStops, pickupSheetStop.index)
    : [];

  const editingWeightKg = editingCargo
    ? (editingCargo.weightInKg ?? editingCargo.weight ?? 0)
    : 0;
  const totalWeightKg = cargos.reduce(
    (sum, cargo) => sum + (cargo.weightInKg ?? cargo.weight ?? 0),
    0,
  );
  const baselineWeightKg = totalWeightKg - editingWeightKg;

  const cargosAtActivePickup = activePickupStop
    ? cargos.filter((cargo) =>
        cargo.movements?.some((movement) => {
          if (movement.movementType !== "pickup") return false;
          const resolved = resolveStopForMovement(movement, orderedStops);
          return resolved?.id === activePickupStop.id;
        }),
      )
    : cargos;

  const closeSheet = () => {
    setSheetOpen(false);
    setEditingCargoId(null);
    setCreatePickupStopId(null);
    setEditPickupStopId(null);
  };

  const openAddCargo = (pickupStopId?: string) => {
    setEditingCargoId(null);
    setEditPickupStopId(null);
    setCreatePickupStopId(
      pickupStopId ?? pickupStops[0]?.id ?? null,
    );
    setSheetOpen(true);
  };

  const openEditCargo = (cargoId: string) => {
    setCreatePickupStopId(null);
    setEditingCargoId(cargoId);
    const cargo = cargos.find((item) => item.id === cargoId) ?? null;
    setEditPickupStopId(resolvePickupStopForCargo(cargo)?.id ?? null);
    setSheetOpen(true);
  };

  const handlePickupStopChange = (stop: CargoSheetPickupStop) => {
    const matched = orderedStops[stop.index];
    if (!matched?.id) return;
    if (editingCargoId) {
      setEditPickupStopId(matched.id);
      return;
    }
    setCreatePickupStopId(matched.id);
  };

  const handleRemoveCargo = (cargoId: string) => {
    deleteCargo.mutate(cargoId, {
      onSuccess: () => {
        toast({ title: copy.toast.cargoRemoved, variant: "success" });
        if (editingCargoId === cargoId) {
          closeSheet();
        }
        onCargosChanged?.();
      },
      onError: (error) => {
        toast({
          title: copy.toast.cargoRemoveError,
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleCargoSubmit = async (
    values: TripCargoFormValues,
    _editingIndex: number | null,
    _options?: { keepOpen?: boolean },
  ) => {
    if (editingCargoId) {
      try {
        const originalPickup = resolvePickupStopForCargo(editingCargo);
        const nextPickup =
          editPickupStop ??
          (pickupSheetStop
            ? orderedStops[pickupSheetStop.index] ?? null
            : null);
        const pickupChanged =
          nextPickup != null &&
          originalPickup != null &&
          nextPickup.id !== originalPickup.id;

        if (pickupChanged) {
          const pickupMovement = editingCargo?.movements?.find(
            (movement) => movement.movementType === "pickup",
          );
          if (!pickupMovement?.id) {
            throw new Error(copy.toast.cargoPickupMovementMissing);
          }
          const nextIndex = orderedStops.findIndex(
            (stop) => stop.id === nextPickup.id,
          );
          if (nextIndex < 0) {
            throw new Error(copy.toast.cargoStopUnresolved);
          }
          await reassignMovementStop.mutateAsync({
            cargoId: editingCargoId,
            movementId: pickupMovement.id,
            data: { stopId: nextPickup.id, stopIndex: nextIndex },
          });
        }

        await updateCargo.mutateAsync({
          cargoId: editingCargoId,
          data: formValuesToUpdateCargoInput(values),
        });
        toast({ title: copy.toast.cargoUpdated, variant: "success" });
        onCargosChanged?.();
      } catch (error) {
        throw error instanceof Error
          ? error
          : new Error(copy.toast.cargoUpdateError);
      }
      return;
    }

    const mapped = mapWizardCargosToCreateInput([values]);
    const payload = mapped?.[0];
    if (!payload) {
      throw new Error(copy.toast.cargoAddError);
    }

    const withStopIds = attachStopIdsToCreateCargoMovements(
      payload,
      orderedStops,
    );
    if (!withStopIds.ok) {
      throw new Error(copy.toast.cargoStopUnresolved);
    }

    try {
      await addCargo.mutateAsync(withStopIds.cargo);
      toast({ title: copy.toast.cargoAdded, variant: "success" });
      onCargosChanged?.();
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error(copy.toast.cargoAddError);
    }
  };

  const cargoSheet =
    pickupSheetStop && canEditStructural ? (
      <CargoMovementSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setEditingCargoId(null);
            setCreatePickupStopId(null);
            setEditPickupStopId(null);
          }
        }}
        pickupStop={sheetOpen ? pickupSheetStop : null}
        availablePickupStops={availablePickupSheetStops}
        onPickupStopChange={handlePickupStopChange}
        availableDeliveryStops={deliverySheetStops}
        initialValues={
          editingCargo ? tripCargoToFormValues(editingCargo) : null
        }
        editingIndex={editingCargoId ? 0 : null}
        deliveriesReadOnly={editingCargoId != null}
        vehicleCapacityKg={null}
        baselineWeightKg={baselineWeightKg}
        stopCargoCount={cargosAtActivePickup.length}
        submitErrorTitle={
          editingCargoId
            ? copy.toast.cargoUpdateError
            : copy.toast.cargoAddError
        }
        onSubmit={handleCargoSubmit}
      />
    ) : null;

  if (isLoading) {
    return <CargosSkeleton />;
  }

  if (isError) {
    return <CargoLoadError onRetry={onRetry} />;
  }

  if (cargos.length === 0) {
    const hasPickup = pickupStops.length > 0;
    return (
      <>
        <div className="rounded-xl border border-dashed bg-card">
          <EmptyState
            icon={<Package />}
            title={
              hasPickup ? copy.state.emptyTitle : copy.state.emptyNoPickupTitle
            }
            description={
              hasPickup
                ? copy.state.emptyDescription
                : copy.state.emptyNoPickupDescription
            }
            size="md"
            cta={
              canEditStructural && hasPickup
                ? {
                    label: copy.action.addCargo,
                    icon: <Plus />,
                    onClick: () => openAddCargo(),
                  }
                : canEditStructural && !hasPickup
                  ? {
                      label: copy.action.goToRoute,
                      onClick: () => navigate(`/trips/${tripId}?tab=route`),
                    }
                  : undefined
            }
          />
        </div>
        {cargoSheet}
      </>
    );
  }

  return (
    <>
      <TripDetailCargoMasterDetail
        cargos={cargos}
        orderedStops={orderedStops}
        canEditStructural={canEditStructural}
        onAddCargo={() => openAddCargo()}
        onEditCargo={openEditCargo}
        onRemoveCargo={handleRemoveCargo}
        isRemoving={deleteCargo.isPending}
      />
      {cargoSheet}
    </>
  );
}
