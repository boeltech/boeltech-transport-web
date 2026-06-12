/**
 * CargoStep - Paso 3 del Wizard
 * Cargas: Mercancías a transportar con soporte para Carta Porte 3.1
 *
 * Modelo Carga → Movimientos (pickup/delivery):
 * - Cada parada con operación de carga (pickup) es un contenedor visual.
 * - Al agregar una carga se crea automáticamente un movimiento "pickup".
 * - El usuario puede asignar opcionalmente puntos de entrega (delivery)
 *   con soporte de entregas parciales (dividir peso/unidades).
 * - Validación: todas las paradas pickup deben tener al menos una carga.
 *
 * Campos Carta Porte 3.1:
 * - satProductCode: Clave del producto SAT (c_ClaveProdServCP)
 * - satUnitCode: Clave de unidad SAT (c_ClaveUnidad)
 * - weightInKg: Peso en kg (obligatorio para CP)
 * - hazardousMaterial: Bandera de material peligroso
 * - hazardousMaterialCode: Clave del material peligroso
 * - packagingType: Tipo de embalaje
 *
 * Validación de capacidad:
 * - Se valida que el peso total de las cargas no exceda la capacidad del vehículo
 * - Se muestra un indicador visual de capacidad utilizada
 * - Se alerta si se excede la capacidad para sugerir cambiar de vehículo
 *
 * Ubicación: src/pages/trips/create/components/CargoStep.tsx
 */

import { useMemo, useState } from "react";
import type { UseFormReturn, UseFieldArrayReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
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
  AlertCircle,
  Scale,
  Box,
  FileText,
} from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { SectionHeadingWithHint } from "@shared/ui/hint-icon";
import type { TripWizardFormValues, TripCargoFormValues } from "./validation";
import { StopType } from "@features/trips";
import { useVehicle } from "@features/vehicles/application";
import { CargoMovementSheet } from "./CargoMovementSheet";
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
  ) => {
    if (submittedIndex !== null) {
      update(submittedIndex, values);
    } else {
      append(values);
    }
    setInitialCargoValues(null);
    setEditingIndex(null);
    setActivePickupStop(null);
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

  const totalWeight = fields.reduce(
    (sum, cargo) => sum + (cargo.weightInKg || cargo.weight || 0),
    0,
  );

  // ============================================
  // Cálculos de capacidad del vehículo
  // ============================================

  const capacityPercentage = useMemo(() => {
    if (!vehicleCapacityKg || vehicleCapacityKg === 0) return 0;
    return Math.min((totalWeight / vehicleCapacityKg) * 100, 100);
  }, [totalWeight, vehicleCapacityKg]);

  const isOverCapacity = vehicleCapacityKg
    ? totalWeight > vehicleCapacityKg
    : false;
  const isNearCapacity = vehicleCapacityKg
    ? capacityPercentage >= 90 && !isOverCapacity
    : false;
  const isModerateCapacity = vehicleCapacityKg
    ? capacityPercentage >= 70 && capacityPercentage < 90
    : false;

  const getCapacityColor = (): string => {
    if (isOverCapacity) return "text-destructive";
    if (isNearCapacity) return "text-warning";
    if (isModerateCapacity) return "text-warning";
    return "text-success";
  };

  const getProgressColor = (): string => {
    if (isOverCapacity) return "bg-destructive";
    if (isNearCapacity) return "bg-warning";
    if (isModerateCapacity) return "bg-warning";
    return "bg-success";
  };

  const formatWeight = copy.format.weight;

  const totalCargos = fields.length;
  const hasNoPickupStops = pickupStops.length === 0;
  const hasHazmatCargo = fields.some((c) => c.hazardousMaterial);

  // ============================================
  // Render
  // ============================================

  return (
    <div className="space-y-6">
      {/* Alerta: no hay paradas con carga */}
      {hasNoPickupStops && (
        <Card className="border-warning/30 bg-warning-soft/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-warning-soft-foreground">
                  {copy.alert.noPickupStops.title}
                </p>
                <p className="text-xs text-warning-soft-foreground mt-1">
                  {copy.alert.noPickupStops.body}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta: paradas sin cargas */}
      {stopsWithoutCargos.length > 0 && !hasNoPickupStops && (
        <Card className="border-warning/30 bg-warning-soft/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-warning-soft-foreground">
                  {stopsWithoutCargos.length === 1
                    ? copy.alert.stopsWithoutCargo.titleSingle
                    : copy.alert.stopsWithoutCargo.titleMultiple(stopsWithoutCargos.length)}
                </p>
                <ul className="text-xs text-warning-soft-foreground mt-1 space-y-0.5">
                  {stopsWithoutCargos.map((stop) => (
                    <li key={stop.index}>
                      •{" "}
                      {copy.format.stopWithoutCargoItem(
                        stop.index,
                        stop.locationName || stop.address,
                        stop.city,
                      )}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-warning-soft-foreground mt-2">
                  {copy.alert.stopsWithoutCargo.footer}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============ INDICADOR DE CAPACIDAD DEL VEHÍCULO ============ */}
      {vehicleCapacityKg && vehicleCapacityKg > 0 && (
        <Card
          className={cn(
            "transition-colors",
            isOverCapacity && "border-destructive/30 bg-destructive-soft/50",
            isNearCapacity && "border-warning/30 bg-warning-soft/50",
          )}
        >
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Header con icono de camión */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex items-center justify-center h-10 w-10 rounded-lg",
                      isOverCapacity && "bg-destructive-soft text-destructive",
                      isNearCapacity && "bg-warning-soft text-warning",
                      isModerateCapacity && "bg-warning-soft text-warning-soft-foreground",
                      !isOverCapacity &&
                        !isNearCapacity &&
                        !isModerateCapacity &&
                        "bg-success-soft text-success",
                    )}
                  >
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      {copy.capacity.title}
                      {vehicle && (
                        <span className="text-xs font-normal text-muted-foreground">
                          {copy.format.vehicleSubtitle(
                            vehicle.unitNumber,
                            vehicle.brand,
                            vehicle.model,
                          )}
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {copy.format.maxCapacity(formatWeight(vehicleCapacityKg))}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("text-2xl font-bold", getCapacityColor())}>
                    {capacityPercentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">{copy.capacity.utilized}</p>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="space-y-2">
                <div className="relative h-4 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      getProgressColor(),
                    )}
                    style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                  />
                  {/* Indicador de exceso */}
                  {isOverCapacity && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-white drop-shadow-sm">
                        {copy.capacity.exceeded}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {copy.capacity.loadedLabel}{" "}
                    <span className={cn("font-medium", getCapacityColor())}>
                      {formatWeight(totalWeight)}
                    </span>
                  </span>
                  <span>
                    {copy.capacity.availableLabel}{" "}
                    <span className="font-medium">
                      {isOverCapacity
                        ? copy.format.excessAvailable(
                            formatWeight(totalWeight - vehicleCapacityKg),
                          )
                        : formatWeight(vehicleCapacityKg - totalWeight)}
                    </span>
                  </span>
                </div>
              </div>

              {/* Desglose por carga (solo si hay cargas) */}
              {fields.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {copy.capacity.breakdown}
                  </p>
                  <div className="space-y-1">
                    {fields.map((cargo, idx) => {
                      const cargoWeight = cargo.weightInKg || cargo.weight || 0;
                      const cargoPercentage =
                        vehicleCapacityKg > 0
                          ? (cargoWeight / vehicleCapacityKg) * 100
                          : 0;
                      return (
                        <div
                          key={cargo.id || idx}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="truncate max-w-[60%] text-muted-foreground">
                            {cargo.description || copy.format.cargoFallback(idx)}
                          </span>
                          <span className="font-medium">
                            {copy.format.cargoBreakdownPercentage(
                              formatWeight(cargoWeight),
                              cargoPercentage,
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta: Sobrepeso del vehículo */}
      {isOverCapacity && (
        <Card className="border-destructive/30 bg-destructive-soft/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive-soft-foreground">
                  {copy.alert.overCapacity.title}
                </p>
                <p className="text-xs text-destructive-soft-foreground mt-1">
                  {copy.format.overCapacityBody(
                    formatWeight(totalWeight),
                    formatWeight(vehicleCapacityKg!),
                    formatWeight(totalWeight - vehicleCapacityKg!),
                  )}
                </p>
                <p className="text-xs text-destructive-soft-foreground mt-2">
                  {copy.alert.overCapacity.options}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta: Vehículo sin capacidad definida */}
      {vehicleId &&
        !isLoadingVehicle &&
        (!vehicleCapacityKg || vehicleCapacityKg === 0) && (
          <Card className="border-info/30 bg-info-soft/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-info mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-info-soft-foreground">
                    {copy.alert.noVehicleCapacity.title}
                  </p>
                  <p className="text-xs text-info-soft-foreground mt-1">
                    {copy.alert.noVehicleCapacity.body}
                  </p>
                  <p className="text-xs text-info-soft-foreground mt-1">
                    {copy.alert.noVehicleCapacity.footer}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Encabezado con resumen */}
      <div className="flex items-center justify-between">
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
            {totalWeight > 0 && copy.format.summaryWeightTotal(formatWeight(totalWeight))}
          </p>
        </div>
        <div className="text-right space-y-1">
          {hasHazmatCargo && (
            <div className="flex items-center gap-1 text-xs text-warning">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{copy.badge.hazmatTrip}</span>
            </div>
          )}
        </div>
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

        return (
          <Card
            key={pickupStop.index}
            className={cn(
              pickupStop.category === "origin" && "border-success/30",
              pickupStop.category === "destination" && "border-destructive/30",
              hasMissing && "border-warning/30",
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={cn(
                      "flex items-center justify-center h-8 w-8 rounded-full flex-shrink-0",
                      pickupStop.category === "origin" &&
                        "bg-success-soft text-success-soft-foreground",
                      pickupStop.category === "destination" &&
                        "bg-destructive-soft text-destructive-soft-foreground",
                      pickupStop.category === "waypoint" &&
                        "bg-gray-100 text-gray-700",
                    )}
                  >
                    <StopIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base">
                        {copy.stopCard.stopNumber(pickupStop.index)}
                      </CardTitle>
                      <span
                        className={cn(
                          "px-2 py-0.5 text-xs font-medium rounded",
                          pickupStop.category === "origin" &&
                            "bg-success-soft text-success-soft-foreground",
                          pickupStop.category === "destination" &&
                            "bg-destructive-soft text-destructive-soft-foreground",
                          pickupStop.category === "waypoint" &&
                            "bg-gray-100 text-gray-700",
                        )}
                      >
                        {pickupStop.category === "origin"
                          ? copy.stopCard.origin
                          : pickupStop.category === "destination"
                            ? copy.stopCard.destination
                            : copy.stopCard.waypoint}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-info-soft text-info-soft-foreground">
                        {copy.stopCard.pickup}
                      </span>
                      {hasMissing && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-warning-soft text-warning-soft-foreground">
                          {copy.stopCard.noMerchandise}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
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
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {stopCargos.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground border border-dashed border-warning/30 rounded-lg bg-warning-soft/30">
                  <Package className="h-8 w-8 mx-auto mb-1 opacity-40" />
                  <p className="text-sm">{copy.stopCard.emptyTitle}</p>
                  <p className="text-xs mt-0.5">{copy.stopCard.emptyHint}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stopCargos.map(({ cargo, fieldIndex }) => {
                    const deliveries = (cargo.movements || []).filter(
                      (m) => m.movementType === "delivery",
                    );

                    return (
                      <div
                        key={cargo.id || fieldIndex}
                        className={cn(
                          "flex items-start gap-3 p-3 border rounded-lg bg-muted/30",
                          cargo.hazardousMaterial &&
                            "border-warning/30 bg-warning-soft/30",
                        )}
                      >
                        <Package
                          className={cn(
                            "h-4 w-4 mt-0.5 flex-shrink-0",
                            cargo.hazardousMaterial
                              ? "text-warning"
                              : "text-muted-foreground",
                          )}
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-medium truncate">
                              {cargo.description}
                            </h4>
                          </div>

                          {/* Badges de info */}
                          <div className="flex flex-wrap gap-1.5">
                            {cargo.satProductCode && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded bg-info-soft text-info-soft-foreground border border-info/30">
                                <FileText className="h-3 w-3" />
                              {copy.format.satCode(cargo.satProductCode)}
                              </span>
                            )}
                            {cargo.hazardousMaterial && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded bg-warning-soft text-warning-soft-foreground border border-warning/30">
                                <AlertTriangle className="h-3 w-3" />
                                {copy.badge.hazmatShort}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {cargo.weightInKg && (
                              <span className="flex items-center gap-1">
                                <Scale className="h-3 w-3" />
                                {copy.format.weightKg(cargo.weightInKg)}
                              </span>
                            )}
                            {!cargo.weightInKg && cargo.weight && (
                              <span>{copy.format.weightLegacy(cargo.weight)}</span>
                            )}
                            {cargo.units && (
                              <span className="flex items-center gap-1">
                                <Box className="h-3 w-3" />
                                {copy.format.units(cargo.units, cargo.satUnitName || "uds")}
                              </span>
                            )}
                          </div>

                          {(cargo.aseguraCarga || cargo.polizaCarga) && (
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {cargo.aseguraCarga ? (
                                <span>{copy.format.insurance(cargo.aseguraCarga)}</span>
                              ) : null}
                              {cargo.polizaCarga ? (
                                <span className="font-mono">
                                  {copy.format.policy(cargo.polizaCarga)}
                                </span>
                              ) : null}
                            </div>
                          )}

                          {/* Entregas asignadas */}
                          {deliveries.length > 0 && (
                            <div className="mt-1.5 space-y-1">
                              {deliveries.map((del, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 mr-2 px-1.5 py-0.5 text-xs rounded bg-warning-soft text-warning-soft-foreground border border-warning/30"
                                >
                                  <Truck className="h-3 w-3" />
                                  {copy.format.deliveryBadge(
                                    getStopLabel(del.stopIndex),
                                    del.weight,
                                    del.units,
                                  )}
                                </span>
                              ))}
                            </div>
                          )}

                          {cargo.notes && (
                            <p className="text-xs text-muted-foreground italic">
                              {cargo.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleOpenEditDialog(fieldIndex)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
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

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-dashed"
                onClick={() => handleOpenAddDialog(pickupStop)}
              >
                <Plus className="h-4 w-4 mr-1" />
                {copy.action.addMerchandise}
              </Button>
            </CardContent>
          </Card>
        );
      })}


      {/* ============ SHEET AGREGAR/EDITAR CARGA ============ */}
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
            ? totalWeight -
              (fields[editingIndex]?.weightInKg ||
                fields[editingIndex]?.weight ||
                0)
            : totalWeight
        }
        onSubmit={handleSubmitFromSheet}
      />
    </div>
  );
}
