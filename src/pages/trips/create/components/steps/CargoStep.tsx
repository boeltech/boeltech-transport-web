/**
 * CargoStep - Paso 3 del Wizard
 * Cargas: Mercancías a transportar
 *
 * Modelo Carga → Movimientos (pickup/delivery):
 * - Cada parada con operación de carga (pickup) es un contenedor visual.
 * - Al agregar una carga se crea automáticamente un movimiento "pickup".
 * - El usuario puede asignar opcionalmente puntos de entrega (delivery)
 *   con soporte de entregas parciales (dividir peso/unidades).
 * - Validación: todas las paradas pickup deben tener al menos una carga.
 */

import { useState, useMemo } from "react";
import type { UseFormReturn, UseFieldArrayReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Input } from "@shared/ui/input";
import { Button } from "@shared/ui/button";
import { Textarea } from "@shared/ui/text-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@shared/ui/dialog";
import {
  Package,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  MapPin,
  Navigation,
  Flag,
  AlertTriangle,
  Truck,
} from "lucide-react";
import { cn } from "@shared/lib/utils";
import type {
  TripWizardFormValues,
  TripCargoFormValues,
  CargoMovementFormValues,
} from "../types";
import { StopType } from "@features/trips";

// ============================================================================
// TYPES
// ============================================================================

interface CargoStepProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<TripWizardFormValues, any, any>;
  cargosFieldArray: UseFieldArrayReturn<TripWizardFormValues, "cargos">;
  clients: Array<{ id: string; legalName: string }>;
  isLoadingClients: boolean;
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
// CONSTANTS
// ============================================================================

const CURRENCY_OPTIONS = [
  { value: "MXN", label: "MXN - Peso Mexicano" },
  { value: "USD", label: "USD - Dólar Americano" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function CargoStep({
  form,
  cargosFieldArray,
  clients,
  isLoadingClients,
}: CargoStepProps) {
  const { fields, append, remove, update } = cargosFieldArray;
  const [isCargoDialogOpen, setIsCargoDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newCargo, setNewCargo] = useState<Partial<TripCargoFormValues>>({});

  // Estado para entregas parciales en el dialog
  const [deliveryAssignments, setDeliveryAssignments] = useState<
    CargoMovementFormValues[]
  >([]);

  // ============================================
  // Lectura de paradas desde el form (RouteStep)
  // ============================================

  const stops = form.watch("stops");

  /** Paradas con operación de carga (pickup) */
  const pickupStops: PickupStopInfo[] = useMemo(() => {
    if (!stops || stops.length === 0) return [];

    return stops
      .map((stop, index) => {
        if (!stop.stopType.includes(StopType.PICKUP)) return null;

        const hasOrigin = stop.stopType.includes(StopType.ORIGIN);
        const hasDestination = stop.stopType.includes(StopType.DESTINATION);

        let category: "origin" | "waypoint" | "destination" = "waypoint";
        if (hasOrigin) category = "origin";
        else if (hasDestination) category = "destination";

        const client = stop.clientId
          ? clients.find((c) => c.id === stop.clientId)
          : undefined;

        return {
          index,
          address: stop.address,
          city: stop.city,
          state: stop.state,
          clientId: stop.clientId,
          clientName: client?.legalName,
          locationName: stop.locationName,
          category,
        } satisfies PickupStopInfo;
      })
      .filter((s): s is PickupStopInfo => s !== null);
  }, [stops, clients]);

  /** Paradas con operación de descarga (delivery) */
  const deliveryStops: DeliveryStopInfo[] = useMemo(() => {
    if (!stops || stops.length === 0) return [];

    return stops
      .map((stop, index) => {
        if (!stop.stopType.includes(StopType.DELIVERY)) return null;

        const hasOrigin = stop.stopType.includes(StopType.ORIGIN);
        const hasDestination = stop.stopType.includes(StopType.DESTINATION);

        let category: "origin" | "waypoint" | "destination" = "waypoint";
        if (hasDestination) category = "destination";
        else if (hasOrigin) category = "origin";

        const client = stop.clientId
          ? clients.find((c) => c.id === stop.clientId)
          : undefined;

        return {
          index,
          address: stop.address,
          city: stop.city,
          locationName: stop.locationName,
          clientId: stop.clientId,
          clientName: client?.legalName,
          category,
        } satisfies DeliveryStopInfo;
      })
      .filter((s): s is DeliveryStopInfo => s !== null);
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

  /** Delivery stops después del pickup actual y compatibles con el cliente */
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
    const clientId = pickupStop.clientId || "";
    setNewCargo({
      clientId,
      description: "",
      productType: "",
      weight: undefined,
      volume: undefined,
      units: undefined,
      declaredValue: undefined,
      rate: 0,
      currency: "MXN",
      movements: [{ stopIndex: pickupStop.index, movementType: "pickup" }],
      notes: "",
      specialInstructions: "",
    });
    setDeliveryAssignments([]);
    setIsCargoDialogOpen(true);
  };

  const handleOpenEditDialog = (fieldIndex: number) => {
    setEditingIndex(fieldIndex);
    const cargo = fields[fieldIndex];
    setNewCargo({ ...cargo });
    const existingDeliveries = (cargo.movements || []).filter(
      (m) => m.movementType === "delivery",
    );
    setDeliveryAssignments(existingDeliveries);
    setIsCargoDialogOpen(true);
  };

  const handleAddDeliveryAssignment = () => {
    setDeliveryAssignments((prev) => [
      ...prev,
      { stopIndex: -1, movementType: "delivery" as const },
    ]);
  };

  const handleUpdateDeliveryAssignment = (
    index: number,
    field: keyof CargoMovementFormValues,
    value: string | number,
  ) => {
    setDeliveryAssignments((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)),
    );
  };

  const handleRemoveDeliveryAssignment = (index: number) => {
    setDeliveryAssignments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveCargo = () => {
    if (
      !newCargo.clientId ||
      !newCargo.description ||
      newCargo.rate === undefined ||
      !newCargo.movements ||
      newCargo.movements.length === 0
    ) {
      return;
    }

    const pickupMovement = newCargo.movements.find(
      (m) => m.movementType === "pickup",
    );
    if (!pickupMovement) return;

    const validDeliveries: CargoMovementFormValues[] = deliveryAssignments
      .filter((d) => d.stopIndex >= 0)
      .map((d) => ({
        stopIndex: d.stopIndex,
        movementType: "delivery" as const,
        weight: d.weight,
        units: d.units,
        notes: d.notes,
      }));

    const allMovements: CargoMovementFormValues[] = [
      pickupMovement,
      ...validDeliveries,
    ];

    const cargoData: TripCargoFormValues = {
      id: newCargo.id,
      clientId: newCargo.clientId,
      description: newCargo.description,
      productType: newCargo.productType,
      weight: newCargo.weight,
      volume: newCargo.volume,
      units: newCargo.units,
      declaredValue: newCargo.declaredValue,
      rate: newCargo.rate || 0,
      currency: newCargo.currency || "MXN",
      movements: allMovements,
      notes: newCargo.notes,
      specialInstructions: newCargo.specialInstructions,
    };

    if (editingIndex !== null) {
      update(editingIndex, cargoData);
    } else {
      append(cargoData);
    }

    setNewCargo({});
    setDeliveryAssignments([]);
    setEditingIndex(null);
    setIsCargoDialogOpen(false);
  };

  // ============================================
  // UI Helpers
  // ============================================

  const getClientName = (clientId: string): string => {
    const client = clients.find((c) => c.id === clientId);
    return client?.legalName || "Sin cliente";
  };

  const getStopLabel = (stopIndex: number): string => {
    const stop = stops?.[stopIndex];
    if (!stop) return `Parada #${stopIndex + 1}`;
    return `#${stopIndex + 1} ${stop.locationName || stop.address}`;
  };

  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const totalRevenue = fields.reduce(
    (sum, cargo) => sum + (cargo.rate || 0),
    0,
  );

  const totalCargos = fields.length;
  const hasNoPickupStops = pickupStops.length === 0;

  // Dialog helpers
  const currentPickupStop = pickupStops.find((s) => {
    const pm = newCargo.movements?.find((m) => m.movementType === "pickup");
    return pm && s.index === pm.stopIndex;
  });
  const stopHasClient = !!currentPickupStop?.clientId;

  const availableDeliveryForDialog = currentPickupStop
    ? getAvailableDeliveryStops(currentPickupStop.index)
    : [];

  // ============================================
  // Render
  // ============================================

  return (
    <div className="space-y-6">
      {/* Alerta: no hay paradas con carga */}
      {hasNoPickupStops && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  No hay paradas con operación de carga
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Regrese al paso de Ruta y asegúrese de que al menos una parada
                  tenga la operación de &quot;Carga&quot; (pickup) para poder
                  registrar mercancías.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta: paradas sin cargas */}
      {stopsWithoutCargos.length > 0 && !hasNoPickupStops && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-900">
                  {stopsWithoutCargos.length === 1
                    ? "1 parada de carga sin mercancías registradas"
                    : `${stopsWithoutCargos.length} paradas de carga sin mercancías registradas`}
                </p>
                <ul className="text-xs text-orange-700 mt-1 space-y-0.5">
                  {stopsWithoutCargos.map((stop) => (
                    <li key={stop.index}>
                      • Parada #{stop.index + 1}:{" "}
                      {stop.locationName || stop.address} ({stop.city})
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-orange-700 mt-2">
                  Todas las paradas de carga deben tener al menos una mercancía
                  para continuar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" /> Cargas del Viaje
          </h3>
          <p className="text-sm text-muted-foreground">
            {totalCargos} carga{totalCargos !== 1 ? "s" : ""} en{" "}
            {pickupStops.length} punto
            {pickupStops.length !== 1 ? "s" : ""} de carga
          </p>
        </div>
        {totalCargos > 0 && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Ingreso Total</p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(totalRevenue, "MXN")}
            </p>
          </div>
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
        const stopTotal = stopCargos.reduce(
          (sum, { cargo }) => sum + (cargo.rate || 0),
          0,
        );
        const hasMissing = stopCargos.length === 0;

        return (
          <Card
            key={pickupStop.index}
            className={cn(
              pickupStop.category === "origin" && "border-green-200",
              pickupStop.category === "destination" && "border-red-200",
              hasMissing && "border-orange-300",
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={cn(
                      "flex items-center justify-center h-8 w-8 rounded-full flex-shrink-0",
                      pickupStop.category === "origin" &&
                        "bg-green-100 text-green-700",
                      pickupStop.category === "destination" &&
                        "bg-red-100 text-red-700",
                      pickupStop.category === "waypoint" &&
                        "bg-gray-100 text-gray-700",
                    )}
                  >
                    <StopIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base">
                        Parada #{pickupStop.index + 1}
                      </CardTitle>
                      <span
                        className={cn(
                          "px-2 py-0.5 text-xs font-medium rounded",
                          pickupStop.category === "origin" &&
                            "bg-green-100 text-green-700",
                          pickupStop.category === "destination" &&
                            "bg-red-100 text-red-700",
                          pickupStop.category === "waypoint" &&
                            "bg-gray-100 text-gray-700",
                        )}
                      >
                        {pickupStop.category === "origin"
                          ? "Origen"
                          : pickupStop.category === "destination"
                            ? "Destino"
                            : "Escala"}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700">
                        Carga
                      </span>
                      {hasMissing && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-orange-100 text-orange-700">
                          Sin mercancías
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
                          · Cliente:{" "}
                          <span className="font-medium">
                            {pickupStop.clientName}
                          </span>
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {stopCargos.length > 0 && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">Subtotal</p>
                    <p className="text-sm font-semibold text-primary">
                      {formatCurrency(stopTotal, "MXN")}
                    </p>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {stopCargos.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground border border-dashed border-orange-300 rounded-lg bg-orange-50/30">
                  <Package className="h-8 w-8 mx-auto mb-1 opacity-40" />
                  <p className="text-sm">Sin cargas registradas</p>
                  <p className="text-xs mt-0.5">
                    Debe registrar al menos una carga en esta parada
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stopCargos.map(({ cargo, fieldIndex }) => {
                    const deliveries = (cargo.movements || []).filter(
                      (m) => m.movementType === "delivery",
                    );

                    return (
                      <div
                        key={cargo.id}
                        className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30"
                      >
                        <Package className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-medium truncate">
                              {cargo.description}
                            </h4>
                            <span className="text-sm font-semibold text-primary flex-shrink-0">
                              {formatCurrency(cargo.rate, cargo.currency)}
                            </span>
                          </div>

                          {cargo.clientId !== pickupStop.clientId && (
                            <p className="text-xs text-muted-foreground">
                              Cliente: {getClientName(cargo.clientId)}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {cargo.productType && (
                              <span>Tipo: {cargo.productType}</span>
                            )}
                            {cargo.weight && (
                              <span>Peso: {cargo.weight} kg</span>
                            )}
                            {cargo.volume && (
                              <span>Vol: {cargo.volume} m³</span>
                            )}
                            {cargo.units && <span>Uds: {cargo.units}</span>}
                          </div>

                          {/* Entregas asignadas */}
                          {deliveries.length > 0 && (
                            <div className="mt-1.5 space-y-1">
                              {deliveries.map((del, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 mr-2 px-1.5 py-0.5 text-xs rounded bg-orange-50 text-orange-700 border border-orange-200"
                                >
                                  <Truck className="h-3 w-3" />
                                  Entrega: {getStopLabel(del.stopIndex)}
                                  {del.weight != null && ` · ${del.weight} kg`}
                                  {del.units != null && ` · ${del.units} uds`}
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
                Agregar Carga
              </Button>
            </CardContent>
          </Card>
        );
      })}

      {/* Total general */}
      {totalCargos > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="font-medium">Ingreso Total Estimado:</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(totalRevenue, "MXN")}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============ DIALOG AGREGAR/EDITAR CARGA ============ */}
      <Dialog open={isCargoDialogOpen} onOpenChange={setIsCargoDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? "Editar Carga" : "Agregar Carga"}
            </DialogTitle>
            {currentPickupStop && (
              <p className="text-sm text-muted-foreground">
                Parada #{currentPickupStop.index + 1}:{" "}
                {currentPickupStop.locationName || currentPickupStop.address}
                {currentPickupStop.clientName &&
                  ` · ${currentPickupStop.clientName}`}
              </p>
            )}
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Cliente */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente *</label>
              {stopHasClient ? (
                <>
                  <Input
                    value={getClientName(newCargo.clientId || "")}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cliente asociado a la parada de carga
                  </p>
                </>
              ) : (
                <Select
                  value={newCargo.clientId || ""}
                  onValueChange={(value) =>
                    setNewCargo({ ...newCargo, clientId: value })
                  }
                  disabled={isLoadingClients}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.legalName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Descripción de la Carga *
              </label>
              <Input
                placeholder="Ej: Electrodomésticos, Materiales de construcción..."
                value={newCargo.description || ""}
                onChange={(e) =>
                  setNewCargo({ ...newCargo, description: e.target.value })
                }
              />
            </div>

            {/* Tipo de producto */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Producto</label>
              <Input
                placeholder="Ej: Electrónica, Perecederos, Químicos..."
                value={newCargo.productType || ""}
                onChange={(e) =>
                  setNewCargo({ ...newCargo, productType: e.target.value })
                }
              />
            </div>

            {/* Dimensiones */}
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Peso (kg)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newCargo.weight ?? ""}
                  onChange={(e) =>
                    setNewCargo({
                      ...newCargo,
                      weight: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Volumen (m³)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newCargo.volume ?? ""}
                  onChange={(e) =>
                    setNewCargo({
                      ...newCargo,
                      volume: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unidades</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newCargo.units ?? ""}
                  onChange={(e) =>
                    setNewCargo({
                      ...newCargo,
                      units: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor Declarado</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newCargo.declaredValue ?? ""}
                  onChange={(e) =>
                    setNewCargo({
                      ...newCargo,
                      declaredValue: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
            </div>

            {/* Tarifa */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <DollarSign className="h-4 w-4" /> Tarifa *
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newCargo.rate ?? ""}
                  onChange={(e) =>
                    setNewCargo({
                      ...newCargo,
                      rate: e.target.value ? Number(e.target.value) : 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Moneda</label>
                <Select
                  value={newCargo.currency || "MXN"}
                  onValueChange={(value) =>
                    setNewCargo({ ...newCargo, currency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ========== ENTREGAS (DELIVERY ASSIGNMENTS) ========== */}
            {availableDeliveryForDialog.length > 0 && (
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Truck className="h-4 w-4" /> Puntos de Entrega
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddDeliveryAssignment}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Agregar Entrega
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Opcional: asigne en qué paradas se entregará esta carga. Para
                  entregas parciales, especifique peso o unidades por punto.
                </p>

                {deliveryAssignments.length === 0 ? (
                  <div className="text-center py-3 border border-dashed rounded-lg text-xs text-muted-foreground">
                    Sin entregas asignadas. Puede asignarlas después.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {deliveryAssignments.map((delivery, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-3 border rounded-lg bg-orange-50/30"
                      >
                        <div className="flex-1 space-y-2">
                          <Select
                            value={
                              delivery.stopIndex >= 0
                                ? String(delivery.stopIndex)
                                : ""
                            }
                            onValueChange={(val) =>
                              handleUpdateDeliveryAssignment(
                                idx,
                                "stopIndex",
                                Number(val),
                              )
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Seleccionar parada..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableDeliveryForDialog.map((s) => (
                                <SelectItem
                                  key={s.index}
                                  value={String(s.index)}
                                >
                                  #{s.index + 1} {s.locationName || s.address} (
                                  {s.city})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="number"
                              placeholder="Peso (kg)"
                              className="h-8 text-xs"
                              value={delivery.weight ?? ""}
                              onChange={(e) =>
                                handleUpdateDeliveryAssignment(
                                  idx,
                                  "weight",
                                  e.target.value
                                    ? Number(e.target.value)
                                    : (undefined as any),
                                )
                              }
                            />
                            <Input
                              type="number"
                              placeholder="Unidades"
                              className="h-8 text-xs"
                              value={delivery.units ?? ""}
                              onChange={(e) =>
                                handleUpdateDeliveryAssignment(
                                  idx,
                                  "units",
                                  e.target.value
                                    ? Number(e.target.value)
                                    : (undefined as any),
                                )
                              }
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive flex-shrink-0"
                          onClick={() => handleRemoveDeliveryAssignment(idx)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notas */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notas</label>
              <Textarea
                placeholder="Observaciones sobre la carga..."
                value={newCargo.notes || ""}
                onChange={(e) =>
                  setNewCargo({ ...newCargo, notes: e.target.value })
                }
              />
            </div>

            {/* Instrucciones especiales */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Instrucciones Especiales
              </label>
              <Textarea
                placeholder="Manejo especial, temperatura, fragilidad..."
                value={newCargo.specialInstructions || ""}
                onChange={(e) =>
                  setNewCargo({
                    ...newCargo,
                    specialInstructions: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCargoDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveCargo}
              disabled={
                !newCargo.clientId ||
                !newCargo.description ||
                !newCargo.movements ||
                newCargo.movements.length === 0
              }
            >
              {editingIndex !== null ? "Guardar Cambios" : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
