/**
 * CargoStep - Paso 3 del Wizard
 * Mercancías a transportar, agrupadas por parada con operación de carga.
 *
 * Modelo Mercancía → Movimientos (pickup/delivery):
 * - Cada parada con operación de carga (pickup) es un contenedor visual.
 * - Al registrar una mercancía se crea automáticamente un movimiento "pickup".
 * - El usuario puede asignar opcionalmente puntos de entrega (delivery)
 *   con soporte de entregas parciales (dividir peso/unidades).
 * - Validación: todas las paradas pickup deben tener al menos una mercancía.
 *
 * Capacidad: la franja superior (`CargoCapacityStrip`) es la única superficie
 * que reporta peso cargado, disponible y sobrepeso; no se duplica en alertas.
 *
 * Ubicación: src/features/trips/presentation/pages/create/components/CargoStep.tsx
 */

import { useMemo, useState } from "react";
import type { UseFormReturn, UseFieldArrayReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { AlertWithIcon } from "@shared/ui/alert";
import {
  Package,
  Plus,
  Trash2,
  Edit2,
  MapPin,
  Navigation,
  Flag,
  AlertTriangle,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { SectionHeadingWithHint } from "@shared/ui/hint-icon";
import type { TripWizardFormValues, TripCargoFormValues } from "./validation";
import { StopType } from "@features/trips";
import { useVehicle } from "@features/vehicles/application";
import { CargoMovementSheet } from "./CargoMovementSheet";
import { CargoCapacityStrip } from "./CargoCapacityStrip";
import {
  formatWizardStopAddressLine,
  formatWizardStopCityLine,
} from "./wizardStopFormat";
import { wizardCopy } from "../../../copy";

const copy = wizardCopy.cargo;

// ============================================================================
// TYPES
// ============================================================================

interface CargoStepProps {
  form: UseFormReturn<TripWizardFormValues>;
  cargosFieldArray: UseFieldArrayReturn<TripWizardFormValues, "cargos">;
  clients: Array<{ id: string; legalName: string }>;
}

interface PickupStopInfo {
  index: number;
  address: string;
  city: string;
  state?: string;
  clientId?: string;
  clientName?: string;
  locationName?: string;
  category: "origin" | "waypoint" | "destination";
}

interface DeliveryStopInfo {
  index: number;
  address: string;
  city: string;
  locationName?: string;
  clientId?: string;
  clientName?: string;
  category: "origin" | "waypoint" | "destination";
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CargoStep({
  form,
  cargosFieldArray,
  clients,
}: CargoStepProps) {
  const { fields, append, remove, update } = cargosFieldArray;
  const [isCargoDialogOpen, setIsCargoDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [initialCargoValues, setInitialCargoValues] =
    useState<TripCargoFormValues | null>(null);
  const [activePickupStop, setActivePickupStop] =
    useState<PickupStopInfo | null>(null);

  // ============================================
  // Obtener vehículo seleccionado para validar capacidad
  // ============================================

  const vehicleId = form.watch("vehicleId");
  const { data: vehicle, isLoading: isLoadingVehicle } = useVehicle(vehicleId);

  // Capacidad del vehículo en kg (loadCapacity viene en toneladas)
  const vehicleCapacityKg = useMemo(() => {
    const tons = vehicle?.capacities?.loadCapacity;
    if (tons == null) return null;
    return tons * 1000;
  }, [vehicle]);

  // ============================================
  // Lectura de paradas desde el form (RouteStep)
  // ============================================

  const stops = form.watch("stops");

  /** Paradas con operación de carga (pickup) */
  const pickupStops: PickupStopInfo[] = useMemo(() => {
    if (!stops || stops.length === 0) return [];

    return stops.flatMap((stop, index) => {
      if (!stop.stopType.includes(StopType.PICKUP)) return [];

      const hasOrigin = stop.stopType.includes(StopType.ORIGIN);
      const hasDestination = stop.stopType.includes(StopType.DESTINATION);

      let category: "origin" | "waypoint" | "destination" = "waypoint";
      if (hasOrigin) category = "origin";
      else if (hasDestination) category = "destination";

      const client = stop.clientId
        ? clients.find((c) => c.id === stop.clientId)
        : undefined;

      const info: PickupStopInfo = {
        index,
        address: formatWizardStopAddressLine(stop),
        city: formatWizardStopCityLine(stop),
        state: stop.satStateCode,
        clientId: stop.clientId || undefined,
        clientName: client?.legalName,
        locationName: stop.locationName,
        category,
      };
      return [info];
    });
  }, [stops, clients]);

  /** Paradas con operación de descarga (delivery) */
  const deliveryStops: DeliveryStopInfo[] = useMemo(() => {
    if (!stops || stops.length === 0) return [];

    return stops.flatMap((stop, index) => {
      if (!stop.stopType.includes(StopType.DELIVERY)) return [];

      const hasOrigin = stop.stopType.includes(StopType.ORIGIN);
      const hasDestination = stop.stopType.includes(StopType.DESTINATION);

      let category: "origin" | "waypoint" | "destination" = "waypoint";
      if (hasDestination) category = "destination";
      else if (hasOrigin) category = "origin";

      const client = stop.clientId
        ? clients.find((c) => c.id === stop.clientId)
        : undefined;

      const info: DeliveryStopInfo = {
        index,
        address: formatWizardStopAddressLine(stop),
        city: formatWizardStopCityLine(stop),
        locationName: stop.locationName,
        clientId: stop.clientId || undefined,
        clientName: client?.legalName,
        category,
      };
      return [info];
    });
  }, [stops, clients]);

  /** Cargas cuyo primer movimiento pickup coincide con la parada */
  const getCargosForStop = (
    stopIndex: number,
  ): { cargo: (typeof fields)[number]; fieldIndex: number }[] => {
    return fields
      .map((cargo, fieldIndex) => ({ cargo, fieldIndex }))
      .filter(({ cargo }) => {
        const pickupMovement = cargo.movements?.find(
          (m) => m.movementType === "pickup",
        );
        return pickupMovement?.stopIndex === stopIndex;
      });
  };

  /** Paradas pickup sin cargas registradas */
  const stopsWithoutCargos: PickupStopInfo[] = useMemo(() => {
    return pickupStops.filter(
      (stop) => getCargosForStop(stop.index).length === 0,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupStops, fields]);

  /** Delivery stops después del pickup actual */
  const getAvailableDeliveryStops = (
    pickupStopIndex: number,
  ): DeliveryStopInfo[] => {
    return deliveryStops.filter((s) => s.index > pickupStopIndex);
  };

  // ============================================
  // Handlers
  // ============================================

  const handleOpenAddDialog = (pickupStop: PickupStopInfo) => {
    setEditingIndex(null);
    setInitialCargoValues(null);
    setActivePickupStop(pickupStop);
    setIsCargoDialogOpen(true);
  };

  const handleOpenEditDialog = (fieldIndex: number) => {
    const cargo = fields[fieldIndex];
    if (!cargo) return;
    const pickupMovement = cargo.movements?.find(
      (m) => m.movementType === "pickup",
    );
    const pickupStop =
      pickupMovement != null
        ? pickupStops.find((s) => s.index === pickupMovement.stopIndex) ?? null
        : null;
    setEditingIndex(fieldIndex);
    setInitialCargoValues(cargo);
    setActivePickupStop(pickupStop);
    setIsCargoDialogOpen(true);
  };

  const handleSubmitFromSheet = (
    values: TripCargoFormValues,
    submittedIndex: number | null,
    options?: { keepOpen?: boolean },
  ) => {
    if (submittedIndex !== null) {
      update(submittedIndex, values);
    } else {
      append(values);
    }
    setInitialCargoValues(null);
    setEditingIndex(null);
    // «Guardar y agregar otra» conserva la parada activa para seguir capturando.
    if (!options?.keepOpen) {
      setActivePickupStop(null);
    }
  };

  // ============================================
  // UI Helpers
  // ============================================

  const getStopLabel = (stopIndex: number): string => {
    const stop = stops?.[stopIndex];
    if (!stop) return copy.format.stopFallback(stopIndex);
    return copy.format.stopLabel(
      stopIndex,
      stop.locationName || "",
      formatWizardStopAddressLine(stop),
    );
  };

  const getCargoWeight = (cargo: {
    weightInKg?: number;
    weight?: number;
  }): number => cargo.weightInKg || cargo.weight || 0;

  const totalWeight = fields.reduce(
    (sum, cargo) => sum + getCargoWeight(cargo),
    0,
  );

  const formatWeight = copy.format.weight;

  const totalCargos = fields.length;
  const hasNoPickupStops = pickupStops.length === 0;
  const hasHazmatCargo = fields.some((c) => c.hazardousMaterial);
  const isCapacityUnknown =
    Boolean(vehicleId) &&
    !isLoadingVehicle &&
    (vehicleCapacityKg == null || vehicleCapacityKg === 0);
  const showCapacityStrip = Boolean(vehicleId) || totalCargos > 0;

  // ============================================
  // Render
  // ============================================

  return (
    <div className="space-y-6">
      {showCapacityStrip && (
        <CargoCapacityStrip
          capacityKg={vehicleCapacityKg}
          loadedKg={totalWeight}
          vehicleLabel={
            vehicle
              ? copy.capacity.vehicleSubtitle(
                  vehicle.unitNumber,
                  vehicle.brand,
                  vehicle.model,
                )
              : null
          }
          isCapacityUnknown={isCapacityUnknown}
        />
      )}

      {/* Una sola alerta a la vez, por prioridad operativa. */}
      {hasNoPickupStops ? (
        <AlertWithIcon variant="warning" title={copy.alert.noPickupStops.title}>
          {copy.alert.noPickupStops.body}
        </AlertWithIcon>
      ) : stopsWithoutCargos.length > 0 ? (
        <AlertWithIcon
          variant="warning"
          title={
            stopsWithoutCargos.length === 1
              ? copy.alert.stopsWithoutCargo.titleSingle
              : copy.alert.stopsWithoutCargo.titleMultiple(
                  stopsWithoutCargos.length,
                )
          }
        >
          <ul className="space-y-0.5">
            {stopsWithoutCargos.map((stop) => (
              <li key={stop.index}>
                {copy.format.stopWithoutCargoItem(
                  stop.index,
                  stop.locationName || stop.address,
                  stop.city,
                )}
              </li>
            ))}
          </ul>
        </AlertWithIcon>
      ) : null}

      {/* Encabezado con resumen */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <SectionHeadingWithHint
            title={
              <>
                <Package className="h-5 w-5 shrink-0" />
                {copy.section.merchandiseTrip}
              </>
            }
            titleClassName="inline-flex items-center gap-2 text-lg font-semibold tracking-tight"
            hintLabel={copy.hintLabel.merchandiseTrip}
            hint={<>{copy.hint.merchandiseTrip}</>}
          />
          <p className="text-sm text-muted-foreground">
            {copy.format.summaryCargos(totalCargos, pickupStops.length)}
            {totalWeight > 0 &&
              copy.format.summaryWeightTotal(formatWeight(totalWeight))}
          </p>
        </div>
        {hasHazmatCargo && (
          <Badge variant="warning" tone="soft" className="gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            {copy.badge.hazmatTrip}
          </Badge>
        )}
      </div>

      {/* ============ PARADAS COMO CONTENEDORES ============ */}
      {pickupStops.map((pickupStop) => {
        const stopCargos = getCargosForStop(pickupStop.index);
        const StopIcon =
          pickupStop.category === "origin"
            ? Navigation
            : pickupStop.category === "destination"
              ? Flag
              : MapPin;
        const hasMissing = stopCargos.length === 0;
        const stopWeight = stopCargos.reduce(
          (sum, { cargo }) => sum + getCargoWeight(cargo),
          0,
        );

        return (
          <Card
            key={pickupStop.index}
            className={cn(hasMissing && "border-warning/40")}
          >
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                      pickupStop.category === "origin" &&
                        "bg-success-soft text-success-soft-foreground",
                      pickupStop.category === "destination" &&
                        "bg-destructive-soft text-destructive-soft-foreground",
                      pickupStop.category === "waypoint" &&
                        "bg-neutral-soft text-neutral-soft-foreground",
                    )}
                  >
                    <StopIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base">
                        {copy.stopCard.stopNumber(pickupStop.index)}
                      </CardTitle>
                      <Badge variant="neutral" tone="soft">
                        {pickupStop.category === "origin"
                          ? copy.stopCard.origin
                          : pickupStop.category === "destination"
                            ? copy.stopCard.destination
                            : copy.stopCard.waypoint}
                      </Badge>
                      {hasMissing ? (
                        <Badge variant="warning" tone="soft">
                          {copy.stopCard.noMerchandise}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {copy.stopCard.summary(
                            stopCargos.length,
                            formatWeight(stopWeight),
                          )}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {pickupStop.locationName || pickupStop.address}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pickupStop.city}
                      {pickupStop.state && `, ${pickupStop.state}`}
                      {pickupStop.clientName && (
                        <span className="ml-1">
                          · {copy.stopCard.clientPrefix}{" "}
                          <span className="font-medium">
                            {pickupStop.clientName}
                          </span>
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant={hasMissing ? "default" : "outline"}
                  size="sm"
                  className="flex-shrink-0"
                  onClick={() => handleOpenAddDialog(pickupStop)}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  {copy.action.addMerchandise}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {stopCargos.length === 0 ? (
                <div className="rounded-lg border border-dashed border-warning/40 bg-warning-soft/30 py-4 text-center text-muted-foreground">
                  <Package className="mx-auto mb-1 h-8 w-8 opacity-40" />
                  <p className="text-sm">{copy.stopCard.emptyTitle}</p>
                  <p className="mt-0.5 text-xs">{copy.stopCard.emptyHint}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stopCargos.map(({ cargo, fieldIndex }) => {
                    const deliveries = (cargo.movements || []).filter(
                      (m) => m.movementType === "delivery",
                    );
                    const cargoWeight = getCargoWeight(cargo);

                    return (
                      <div
                        key={cargo.id || fieldIndex}
                        className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3"
                      >
                        <Package
                          className={cn(
                            "mt-0.5 h-4 w-4 flex-shrink-0",
                            cargo.hazardousMaterial
                              ? "text-warning"
                              : "text-muted-foreground",
                          )}
                        />
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <h4 className="truncate text-sm font-medium">
                            {cargo.description ||
                              copy.format.cargoFallback(fieldIndex)}
                          </h4>

                          <p className="text-sm text-muted-foreground">
                            {cargo.units
                              ? copy.format.units(
                                  cargo.units,
                                  cargo.satUnitName || "unidades",
                                )
                              : null}
                            {cargo.units && cargoWeight > 0 ? " · " : null}
                            {cargoWeight > 0
                              ? copy.format.weightKg(cargoWeight)
                              : null}
                          </p>

                          {(cargo.hazardousMaterial ||
                            cargo.isInsured ||
                            deliveries.length > 0) && (
                            <div className="flex flex-wrap gap-1.5">
                              {cargo.hazardousMaterial && (
                                <Badge
                                  variant="warning"
                                  tone="soft"
                                  className="gap-1 font-normal"
                                >
                                  <AlertTriangle className="h-3 w-3" />
                                  {copy.badge.hazmatShort}
                                </Badge>
                              )}
                              {cargo.isInsured && (
                                <Badge
                                  variant="info"
                                  tone="soft"
                                  className="gap-1 font-normal"
                                >
                                  <ShieldCheck className="h-3 w-3" />
                                  {copy.badge.insured}
                                </Badge>
                              )}
                              {deliveries.map((del, idx) => (
                                <Badge
                                  key={idx}
                                  variant="neutral"
                                  tone="soft"
                                  className="gap-1 font-normal"
                                >
                                  <Truck className="h-3 w-3" />
                                  {copy.format.deliveryBadge(
                                    getStopLabel(del.stopIndex),
                                    del.weight,
                                    del.units,
                                  )}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {cargo.notes && (
                            <p className="text-xs italic text-muted-foreground">
                              {cargo.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-shrink-0 gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            aria-label={copy.action.editMerchandise}
                            onClick={() => handleOpenEditDialog(fieldIndex)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            aria-label={copy.action.removeMerchandise}
                            onClick={() => remove(fieldIndex)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {stopCargos.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed"
                  onClick={() => handleOpenAddDialog(pickupStop)}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  {copy.action.addAnotherMerchandise}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* ============ SHEET AGREGAR/EDITAR MERCANCÍA ============ */}
      <CargoMovementSheet
        open={isCargoDialogOpen}
        onOpenChange={(open) => {
          setIsCargoDialogOpen(open);
          if (!open) {
            setEditingIndex(null);
            setInitialCargoValues(null);
            setActivePickupStop(null);
          }
        }}
        pickupStop={activePickupStop}
        availableDeliveryStops={
          activePickupStop ? getAvailableDeliveryStops(activePickupStop.index) : []
        }
        initialValues={initialCargoValues}
        editingIndex={editingIndex}
        vehicleCapacityKg={vehicleCapacityKg}
        baselineWeightKg={
          editingIndex !== null
            ? totalWeight - getCargoWeight(fields[editingIndex] ?? {})
            : totalWeight
        }
        stopCargoCount={
          activePickupStop
            ? getCargosForStop(activePickupStop.index).length
            : 0
        }
        onSubmit={handleSubmitFromSheet}
      />
    </div>
  );
}
