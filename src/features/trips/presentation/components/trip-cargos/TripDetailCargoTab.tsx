import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Package, Plus, RefreshCw } from "lucide-react";

import {
  CargoError,
  useAddCargo,
  useAddCargoMovement,
  useDeleteCargo,
  useReassignCargoMovementStop,
  useUpdateCargo,
} from "@features/trips/application";
import {
  StopType,
  TripStatus,
  type CfdiEmissionIntent,
  type TripCargo,
  type TripStatusType,
  type TripStop,
  type UpdateCargoMovementStopInput,
} from "@features/trips/domain";
import { useVehicle } from "@features/vehicles";
import { useToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
import { EmptyState } from "@shared/ui/feedback-states";
import { Skeleton } from "@shared/ui/skeleton";

import { tripDetailCopy } from "../../copy";
import { cfdiEmissionIntentCopy } from "../../copy/cfdiEmissionIntentCopy";
import {
  attachStopIdsToCreateCargoMovements,
  canShowAddDeliveryInCargoEdit,
  getCargoWeightKg,
  resolveCargoMutationErrorMessage,
  resolveCargoRemoveErrorToast,
  shouldWarnFiscalAttentionOnCargoAppend,
} from "./tripCargoDetailHelpers";
import {
  formValuesToUpdateCargoInput,
  tripCargoToFormValues,
} from "./tripCargoFormBridge";
import { TripCargoSummaryStrip } from "./TripCargoSummaryStrip";
import { TripDetailCargoMasterDetail } from "./TripDetailCargoMasterDetail";
import {
  countCargoYardStatus,
  resolveSharedPickupLabel,
  sumCargoUnits,
} from "./tripCargoSummaryHelpers";
import { resolveStopForMovement } from "../../utils/stopCargoCorrelation";
import {
  applySingleDeliveryQtyInherit,
  normalizeMovementQty,
} from "../../utils/cargoDeliveryCoverage";
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
      <Skeleton className="h-[5.5rem] w-full rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,21rem)]">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="hidden h-72 w-full rounded-xl lg:block" />
      </div>
    </div>
  );
}

function CargoLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-destructive/50">
      <CardContent className="py-6 text-center">
        <AlertCircle
          className="h-10 w-10 mx-auto text-destructive mb-3"
          aria-hidden
        />
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
  /** ADR-0093 — append carga mid-trip. */
  canAppendCargo?: boolean;
  /** ADR-0096 — empty advisory cuando liquidación sin CFDI. */
  cfdiEmissionIntent?: CfdiEmissionIntent;
  /** Q6: primaria de flete activa stamped|cancellation_pending. */
  hasActivePrimaryInvoice?: boolean;
  invoiceStatus?: string | null;
  /** Unidad asignada — capacidad advisory (loadCapacity t→kg). */
  vehicleId?: string | null;
  /**
   * D44 — avisa al shell cuando el Sheet de carga está abierto
   * (Qué sigue → outline).
   */
  onEditingChange?: (editing: boolean) => void;
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
  tripStatus,
  cargos,
  orderedStops,
  pickupStops,
  isLoading,
  isError,
  canEditStructural,
  canAppendCargo = false,
  cfdiEmissionIntent,
  hasActivePrimaryInvoice = false,
  invoiceStatus = null,
  vehicleId = null,
  onEditingChange,
  onRetry,
  onCargosChanged,
}: TripDetailCargoTabProps) {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const addCargo = useAddCargo(tripId);
  const updateCargo = useUpdateCargo(tripId);
  const deleteCargo = useDeleteCargo(tripId);
  const addCargoMovement = useAddCargoMovement(tripId);
  const reassignMovementStop = useReassignCargoMovementStop(tripId);
  const canDeleteCargo =
    canEditStructural && hasPermission("trips", "delete");
  const { data: vehicle, isLoading: isLoadingVehicle } = useVehicle(
    vehicleId ?? "",
    { enabled: Boolean(vehicleId) },
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCargoId, setEditingCargoId] = useState<string | null>(null);

  useEffect(() => {
    onEditingChange?.(sheetOpen);
    return () => onEditingChange?.(false);
  }, [onEditingChange, sheetOpen]);
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

  const editingWeightKg = editingCargo ? getCargoWeightKg(editingCargo) : 0;
  const totalWeightKg = cargos.reduce(
    (sum, cargo) => sum + getCargoWeightKg(cargo),
    0,
  );
  const baselineWeightKg = totalWeightKg - editingWeightKg;

  const vehicleCapacityKg = useMemo(() => {
    const tons = vehicle?.capacities?.loadCapacity;
    if (tons == null) return null;
    return tons * 1000;
  }, [vehicle]);

  const isCapacityUnknown =
    Boolean(vehicleId) &&
    !isLoadingVehicle &&
    (vehicleCapacityKg == null || vehicleCapacityKg === 0);

  const capacityMutable =
    tripStatus === TripStatus.DRAFT ||
    tripStatus === TripStatus.SCHEDULED ||
    tripStatus === TripStatus.IN_PROGRESS;

  const yardCounts = useMemo(() => countCargoYardStatus(cargos), [cargos]);
  const totalUnits = useMemo(() => sumCargoUnits(cargos), [cargos]);
  const pickupSummaryLabel = useMemo(
    () => resolveSharedPickupLabel(cargos, orderedStops),
    [cargos, orderedStops],
  );

  const summaryStrip = (
    <TripCargoSummaryStrip
      capacityKg={vehicleCapacityKg}
      loadedKg={totalWeightKg}
      unitNumber={vehicle?.unitNumber ?? null}
      isCapacityUnknown={isCapacityUnknown}
      capacityMutable={capacityMutable}
      cargoCount={cargos.length}
      totalUnits={totalUnits}
      pickupSummaryLabel={pickupSummaryLabel}
      inTransitCount={yardCounts.inTransit}
      deliveredCount={yardCounts.delivered}
    />
  );

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
      onError: (error: CargoError) => {
        const resolved = resolveCargoRemoveErrorToast({
          code: error.code,
          message: error.message,
        });
        toast({
          title: resolved.title,
          description: resolved.description,
          variant: "destructive",
        });
      },
    });
  };

  // Sheet cierra / keepOpen; editingIndex no aplica en detalle (estado vía editingCargoId).
  const handleCargoSubmit = async (values: TripCargoFormValues) => {
    if (editingCargoId) {
      try {
        const originalPickup = resolvePickupStopForCargo(editingCargo);
        const nextPickup =
          editPickupStop ??
          (pickupSheetStop
            ? orderedStops[pickupSheetStop.index] ?? null
            : null);
        const existingPickupMovement = editingCargo?.movements?.find(
          (movement) => movement.movementType === "pickup",
        );
        const pickupChanged =
          nextPickup != null &&
          originalPickup != null &&
          nextPickup.id !== originalPickup.id;

        // T-SC2 / C6: sin movimiento de recogida → POST pickup (endpoint existente).
        if (!existingPickupMovement && nextPickup) {
          const nextIndex = orderedStops.findIndex(
            (stop) => stop.id === nextPickup.id,
          );
          if (nextIndex < 0) {
            throw new Error(copy.toast.cargoStopUnresolved);
          }
          await addCargoMovement.mutateAsync({
            cargoId: editingCargoId,
            data: {
              stopId: nextPickup.id,
              stopIndex: nextIndex,
              movementType: "pickup",
            },
          });
        } else if (pickupChanged) {
          if (!existingPickupMovement?.id) {
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
            movementId: existingPickupMovement.id,
            data: { stopId: nextPickup.id, stopIndex: nextIndex },
          });
        }

        const originalDeliveries =
          editingCargo?.movements?.filter(
            (movement) => movement.movementType === "delivery",
          ) ?? [];
        // D-F7-8: 1 delivery vacío hereda totales antes de PATCH/POST.
        const nextDeliveries = applySingleDeliveryQtyInherit({
          cargoWeightKg: values.weightInKg ?? values.weight,
          cargoUnits: values.units,
          deliveries: (values.movements ?? []).filter(
            (movement) => movement.movementType === "delivery",
          ),
        });

        // Existentes: PATCH parada y/o qty (F1 body weight/units).
        for (let i = 0; i < originalDeliveries.length; i += 1) {
          const deliveryMovement = originalDeliveries[i];
          if (!deliveryMovement?.id || deliveryMovement.completedAt) continue;
          const nextDelivery = nextDeliveries[i];
          if (!nextDelivery || nextDelivery.stopIndex < 0) continue;

          const stopChanged =
            nextDelivery.stopIndex !== deliveryMovement.stopIndex;
          const nextWeight = normalizeMovementQty(nextDelivery.weight);
          const nextUnits = normalizeMovementQty(nextDelivery.units);
          const weightChanged =
            nextWeight !== normalizeMovementQty(deliveryMovement.weight);
          const unitsChanged =
            nextUnits !== normalizeMovementQty(deliveryMovement.units);

          if (!stopChanged && !weightChanged && !unitsChanged) continue;

          const data: UpdateCargoMovementStopInput = {};
          if (stopChanged) {
            const nextStop = orderedStops[nextDelivery.stopIndex];
            if (!nextStop?.id) {
              throw new Error(copy.toast.cargoStopUnresolved);
            }
            data.stopId = nextStop.id;
            data.stopIndex = nextDelivery.stopIndex;
          }
          if (weightChanged) data.weight = nextWeight;
          if (unitsChanged) data.units = nextUnits;

          await reassignMovementStop.mutateAsync({
            cargoId: editingCargoId,
            movementId: deliveryMovement.id,
            data,
          });
        }

        // Altas de entrega en edición → POST …/movements (F3).
        for (let i = originalDeliveries.length; i < nextDeliveries.length; i += 1) {
          const delivery = nextDeliveries[i];
          if (!delivery || delivery.stopIndex < 0) {
            throw new Error(copy.toast.cargoStopUnresolved);
          }
          const stop = orderedStops[delivery.stopIndex];
          if (!stop?.id) {
            throw new Error(copy.toast.cargoStopUnresolved);
          }
          await addCargoMovement.mutateAsync({
            cargoId: editingCargoId,
            data: {
              stopId: stop.id,
              stopIndex: delivery.stopIndex,
              movementType: "delivery",
              weight: delivery.weight,
              units: delivery.units,
              notes: delivery.notes,
            },
          });
        }

        await updateCargo.mutateAsync({
          cargoId: editingCargoId,
          data: formValuesToUpdateCargoInput(values),
        });
        toast({ title: copy.toast.cargoUpdated, variant: "success" });
        onCargosChanged?.();
      } catch (error) {
        throw new Error(
          resolveCargoMutationErrorMessage(error, copy.toast.cargoUpdateError),
        );
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
      throw new Error(
        resolveCargoMutationErrorMessage(error, copy.toast.cargoAddError),
      );
    }
  };

  const cargoSheet =
    pickupSheetStop && (canAppendCargo || canEditStructural) ? (
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
        missingPickupMovement={
          editingCargoId != null &&
          !(
            editingCargo?.movements?.some(
              (movement) => movement.movementType === "pickup",
            ) ?? false
          )
        }
        deliveriesReadOnly={
          editingCargoId != null &&
          Boolean(
            editingCargo?.movements?.some(
              (movement) =>
                movement.movementType === "delivery" &&
                movement.completedAt != null,
            ),
          )
        }
        allowAddDelivery={
          editingCargoId == null
            ? true
            : canShowAddDeliveryInCargoEdit(orderedStops)
        }
        vehicleCapacityKg={vehicleCapacityKg}
        baselineWeightKg={baselineWeightKg}
        stopCargoCount={cargosAtActivePickup.length}
        tripPhase={
          tripStatus === TripStatus.IN_PROGRESS
            ? "in_progress"
            : "draft_or_scheduled"
        }
        vehicleUnitNumber={vehicle?.unitNumber ?? null}
        showConfirmEffects={
          canAppendCargo &&
          !canEditStructural &&
          editingCargoId == null
        }
        confirmEffectsIncludeFiscal={shouldWarnFiscalAttentionOnCargoAppend({
          cfdiEmissionIntent,
          hasActivePrimaryInvoice,
          invoiceStatus,
        })}
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
    const canMutateCargo = canEditStructural || canAppendCargo;
    const isSinCfdiEmpty =
      hasPickup && cfdiEmissionIntent === "sin_cfdi_efectivo";
    const emptyTitle = hasPickup
      ? isSinCfdiEmpty
        ? cfdiEmissionIntentCopy.cargoGate.emptyTitle
        : copy.state.emptyTitle
      : copy.state.emptyNoPickupTitle;
    const emptyDescription = hasPickup
      ? isSinCfdiEmpty
        ? cfdiEmissionIntentCopy.cargoGate.emptyBody
        : copy.state.emptyDescription
      : copy.state.emptyNoPickupDescription;
    return (
      <>
        <div className="space-y-4">
          {summaryStrip}
          <div className="rounded-xl border border-dashed bg-card">
            <EmptyState
              icon={<Package />}
              title={emptyTitle}
              description={emptyDescription}
              size="md"
              cta={
                canMutateCargo && hasPickup
                  ? {
                      label: copy.action.addCargo,
                      icon: <Plus />,
                      onClick: () => openAddCargo(),
                    }
                  : canMutateCargo && !hasPickup
                    ? {
                        label: copy.action.goToRoute,
                        onClick: () => navigate(`/trips/${tripId}?tab=route`),
                      }
                    : undefined
              }
            />
            {isSinCfdiEmpty ? (
              <p className="px-6 pb-6 -mt-2 text-center text-xs text-muted-foreground">
                {cfdiEmissionIntentCopy.cargoGate.emptyHint}
              </p>
            ) : null}
          </div>
        </div>
        {cargoSheet}
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {summaryStrip}
        <TripDetailCargoMasterDetail
          cargos={cargos}
          orderedStops={orderedStops}
          tripStatus={tripStatus}
          canEditStructural={canEditStructural}
          canDeleteCargo={canDeleteCargo}
          canAppendCargo={canEditStructural || canAppendCargo}
          showAppendOnlyBanner={canAppendCargo && !canEditStructural}
          appendMarksFiscalAttention={shouldWarnFiscalAttentionOnCargoAppend({
            cfdiEmissionIntent,
            hasActivePrimaryInvoice,
            invoiceStatus,
          })}
          onAddCargo={() => openAddCargo()}
          onEditCargo={openEditCargo}
          onRemoveCargo={handleRemoveCargo}
          onGoToRoute={() => navigate(`/trips/${tripId}?tab=route`)}
          isRemoving={deleteCargo.isPending}
        />
      </div>
      {cargoSheet}
    </>
  );
}
