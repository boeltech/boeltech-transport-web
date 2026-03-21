/**
 * RouteStep - Paso 2 del Wizard
 * Ruta: Paradas del viaje organizadas en bloques (Origen, Escalas, Destino)
 *
 * Reglas de negocio:
 * - Origen: solo 1 parada, solo operación "carga" (pickup), siempre índice 0
 * - Escalas: N paradas, carga y/o descarga (editable inline), índices 1..N
 * - Destino: solo 1 parada, solo operación "descarga" (delivery), siempre último índice
 * - Drag & drop solo entre escalas (origen y destino son fijos)
 * - El índice del array y sequenceOrder siempre son idénticos
 *
 * Ubicación: src/pages/trips/create/components/RouteStep.tsx
 */

import { useState, useCallback } from "react";
import type { UseFormReturn, UseFieldArrayReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Textarea } from "@shared/ui/text-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Checkbox } from "@shared/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@shared/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/ui/popover";
import {
  MapPin,
  Trash2,
  GripVertical,
  Navigation,
  Flag,
  ChevronUp,
  ChevronDown,
  Building2,
  Pencil,
  Plus,
} from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import type { TripWizardFormValues, TripStopFormValues } from "../validation";
import { useActiveClients } from "@/features/clients/application/hooks/useClients";
import { useClientAddresses } from "@/features/clients/application/hooks/useClientAddresses";
import { ADDRESS_TYPE_LABELS } from "@/features/clients/domain/entities";
import { StopType } from "@features/trips";

interface RouteStepProps {
  form: UseFormReturn<TripWizardFormValues, any, any>;
  stopsFieldArray: UseFieldArrayReturn<TripWizardFormValues, "stops", any>;
}

// Tipos de operación en la parada
const STOP_OPERATION_OPTIONS = [
  { value: "pickup", label: "Carga", icon: MapPin, color: "text-blue-600" },
  {
    value: "delivery",
    label: "Descarga",
    icon: MapPin,
    color: "text-orange-600",
  },
];

// Interfaz extendida para el estado del formulario de nueva parada
interface NewStopState extends Partial<TripStopFormValues> {
  stopCategory?: "origin" | "waypoint" | "destination";
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function RouteStep({ form, stopsFieldArray }: RouteStepProps) {
  const { fields } = stopsFieldArray;
  const [isAddStopDialogOpen, setIsAddStopDialogOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingStopIndex, setEditingStopIndex] = useState<number | null>(null);

  const [newStop, setNewStop] = useState<NewStopState>({
    stopCategory: undefined,
    stopType: [],
    clientId: "",
    clientAddressId: "",
    address: "",
    city: "",
    state: "",
    contactName: "",
    contactPhone: "",
    notes: "",
  });

  // ========== REORDENAR ARRAY DE STOPS ==========

  /**
   * Reordena físicamente el array de stops para que:
   * - Origen siempre sea el primero (índice 0)
   * - Escalas estén en medio (índices 1..N-1), ordenadas por su sequenceOrder actual
   * - Destino siempre sea el último (índice N)
   *
   * Después de reordenar, actualiza el sequenceOrder de cada stop para que
   * coincida con su nuevo índice en el array.
   */
  const reorderStopsArray = useCallback(() => {
    const currentStops = form.getValues("stops");
    if (currentStops.length === 0) return;

    // 1. Extraer paradas por tipo
    const origin = currentStops.find((stop) =>
      stop.stopType?.includes(StopType.ORIGIN),
    );

    const destination = currentStops.find((stop) =>
      stop.stopType?.includes(StopType.DESTINATION),
    );

    const waypoints = currentStops
      .filter(
        (stop) =>
          stop.stopType?.includes(StopType.WAYPOINT) &&
          !stop.stopType?.includes(StopType.ORIGIN) &&
          !stop.stopType?.includes(StopType.DESTINATION),
      )
      // Mantener el orden relativo de las escalas usando sequenceOrder
      .sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0));

    // 2. Reconstruir el array en el orden correcto
    const reorderedStops: TripStopFormValues[] = [];

    if (origin) {
      reorderedStops.push(origin);
    }

    reorderedStops.push(...waypoints);

    if (destination) {
      reorderedStops.push(destination);
    }

    // 3. Actualizar sequenceOrder = índice para cada stop
    reorderedStops.forEach((stop, index) => {
      stop.sequenceOrder = index;
    });

    // 4. Reemplazar todo el array en el form
    form.setValue("stops", reorderedStops, {
      shouldValidate: false,
      shouldDirty: true,
    });
  }, [form]);

  // ========== CLASIFICACIÓN DE PARADAS ==========

  /**
   * Obtiene las paradas clasificadas por tipo.
   * Como el array siempre está ordenado, los índices son predecibles:
   * - Origen: índice 0 (si existe)
   * - Escalas: índices intermedios
   * - Destino: último índice (si existe)
   */
  const getClassifiedStops = useCallback(() => {
    const stops = form.getValues("stops") || [];

    const originIndex = stops.findIndex((stop) =>
      stop.stopType?.includes(StopType.ORIGIN),
    );

    const destinationIndex = stops.findIndex((stop) =>
      stop.stopType?.includes(StopType.DESTINATION),
    );

    const waypointIndices = stops
      .map((stop, index) => ({ stop, index }))
      .filter(
        ({ stop }) =>
          stop.stopType?.includes(StopType.WAYPOINT) &&
          !stop.stopType?.includes(StopType.ORIGIN) &&
          !stop.stopType?.includes(StopType.DESTINATION),
      )
      .map((w) => w.index);

    return {
      originIndex,
      destinationIndex,
      waypointIndices,
    };
  }, [form]);

  const { originIndex, destinationIndex, waypointIndices } =
    getClassifiedStops();

  const hasOrigin = originIndex !== -1;
  const hasDestination = destinationIndex !== -1;
  const hasWaypoints = waypointIndices.length > 0;

  // ========== DATOS EXTERNOS ==========

  const { data: clients = [] } = useActiveClients();
  const { data: addresses = [] } = useClientAddresses(newStop.clientId);

  // ========== HANDLERS DE DIRECCIÓN ==========

  const handleAddressSelect = (addressId: string) => {
    const selectedAddress = addresses.find((addr) => addr.id === addressId);
    if (selectedAddress) {
      setNewStop((prev) => ({
        ...prev,
        clientAddressId: addressId,
        locationName: selectedAddress.locationName || "",
        address: selectedAddress.address,
        city: selectedAddress.city,
        state: selectedAddress.state || "",
        postalCode: selectedAddress.postalCode || "",
        contactName: selectedAddress.contactName || "",
        contactPhone: selectedAddress.contactPhone || "",
      }));
    } else {
      setNewStop((prev) => ({
        ...prev,
        clientAddressId: addressId,
      }));
    }
  };

  const handleClientChange = (clientId: string) => {
    setNewStop({
      ...newStop,
      clientId,
      clientAddressId: "",
      locationName: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      contactName: "",
      contactPhone: "",
    });
  };

  // ========== AGREGAR PARADA ==========

  const handleAddStop = () => {
    if (
      newStop.address &&
      newStop.city &&
      newStop.stopCategory &&
      newStop.stopType &&
      newStop.stopType.length > 0
    ) {
      const stopTypes: TripStopFormValues["stopType"] = [
        newStop.stopCategory as any,
        ...newStop.stopType,
      ];

      // sequenceOrder temporal, se recalculará en reorderStopsArray
      const newStopData: TripStopFormValues = {
        sequenceOrder: 999,
        stopType: stopTypes,
        clientId: newStop.clientId || undefined,
        clientAddressId: newStop.clientAddressId || undefined,
        address: newStop.address,
        city: newStop.city,
        state: newStop.state || "",
        postalCode: newStop.postalCode,
        locationName: newStop.locationName,
        contactName: newStop.contactName,
        contactPhone: newStop.contactPhone,
        estimatedArrival: newStop.estimatedArrival,
        notes: newStop.notes,
      };

      // Agregar al array actual
      const currentStops = form.getValues("stops") || [];
      form.setValue("stops", [...currentStops, newStopData]);

      // Reordenar el array
      requestAnimationFrame(() => {
        reorderStopsArray();
      });

      resetNewStopForm();
      setIsAddStopDialogOpen(false);
    }
  };

  const resetNewStopForm = () => {
    setNewStop({
      stopCategory: undefined,
      stopType: [],
      clientId: "",
      clientAddressId: "",
      address: "",
      city: "",
      state: "",
      contactName: "",
      contactPhone: "",
      notes: "",
    });
  };

  const openAddStopDialog = (
    category: "origin" | "waypoint" | "destination",
  ) => {
    const defaultOperations =
      category === "origin"
        ? (["pickup"] as any)
        : category === "destination"
          ? (["delivery"] as any)
          : [];

    setNewStop({
      stopCategory: category,
      stopType: defaultOperations,
      clientId: "",
      clientAddressId: "",
      address: "",
      city: "",
      state: "",
      contactName: "",
      contactPhone: "",
      notes: "",
    });
    setIsAddStopDialogOpen(true);
  };

  // ========== ELIMINAR PARADA ==========

  const handleRemoveStop = (index: number) => {
    const currentStops = form.getValues("stops") || [];
    const updatedStops = currentStops.filter((_, i) => i !== index);
    form.setValue("stops", updatedStops);

    // Reordenar el array
    requestAnimationFrame(() => {
      reorderStopsArray();
    });
  };

  // ========== MOVER ESCALAS (up/down) ==========

  /**
   * Mueve una escala arriba o abajo intercambiando posiciones.
   * Solo funciona para escalas (waypoints).
   */
  const handleMoveWaypoint = (
    currentIndex: number,
    direction: "up" | "down",
  ) => {
    const currentStops = form.getValues("stops") || [];

    // Verificar que el índice actual es una escala
    const currentStop = currentStops[currentIndex];
    if (
      !currentStop?.stopType?.includes(StopType.WAYPOINT) ||
      currentStop?.stopType?.includes(StopType.ORIGIN) ||
      currentStop?.stopType?.includes(StopType.DESTINATION)
    ) {
      return;
    }

    // Calcular el índice destino
    let targetIndex: number;

    if (direction === "up") {
      // Buscar la escala anterior (no el origen)
      targetIndex = currentIndex - 1;
      // Si el target es el origen (índice 0 y es origin), no mover
      const targetStop = currentStops[targetIndex];
      if (targetStop?.stopType?.includes(StopType.ORIGIN)) {
        return;
      }
    } else {
      // Buscar la escala siguiente (no el destino)
      targetIndex = currentIndex + 1;
      // Si el target es el destino, no mover
      const targetStop = currentStops[targetIndex];
      if (targetStop?.stopType?.includes(StopType.DESTINATION)) {
        return;
      }
    }

    // Verificar límites
    if (targetIndex < 0 || targetIndex >= currentStops.length) {
      return;
    }

    // Intercambiar posiciones en el array
    const updatedStops = [...currentStops];
    const temp = updatedStops[currentIndex];
    updatedStops[currentIndex] = updatedStops[targetIndex];
    updatedStops[targetIndex] = temp;

    // Actualizar sequenceOrder
    updatedStops.forEach((stop, index) => {
      stop.sequenceOrder = index;
    });

    form.setValue("stops", updatedStops, {
      shouldValidate: false,
      shouldDirty: true,
    });
  };

  // ========== DRAG AND DROP (solo escalas) ==========

  const handleDragStart = (index: number) => {
    // Solo permitir drag en escalas
    if (waypointIndices.includes(index)) {
      setDraggedIndex(index);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (
      draggedIndex === null ||
      draggedIndex === dropIndex ||
      !waypointIndices.includes(dropIndex) ||
      !waypointIndices.includes(draggedIndex)
    ) {
      setDraggedIndex(null);
      return;
    }

    const currentStops = form.getValues("stops") || [];

    // Intercambiar posiciones
    const updatedStops = [...currentStops];
    const temp = updatedStops[draggedIndex];
    updatedStops[draggedIndex] = updatedStops[dropIndex];
    updatedStops[dropIndex] = temp;

    // Actualizar sequenceOrder
    updatedStops.forEach((stop, index) => {
      stop.sequenceOrder = index;
    });

    form.setValue("stops", updatedStops, {
      shouldValidate: false,
      shouldDirty: true,
    });

    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // ========== EDITAR OPERACIONES DE ESCALA ==========

  const handleWaypointOperationChange = (
    stopIndex: number,
    operation: string,
    checked: boolean,
  ) => {
    const currentStop = form.getValues(`stops.${stopIndex}`);
    if (!currentStop) return;

    const currentOperations = currentStop.stopType.filter(
      (type) =>
        type !== StopType.ORIGIN &&
        type !== StopType.DESTINATION &&
        type !== StopType.WAYPOINT,
    );

    let newOperations: string[];

    if (checked) {
      newOperations = [...currentOperations, operation];
    } else {
      newOperations = currentOperations.filter((t) => t !== operation);
    }

    if (newOperations.length === 0) return;

    const newStopType = [
      StopType.WAYPOINT,
      ...newOperations,
    ] as TripStopFormValues["stopType"];

    form.setValue(`stops.${stopIndex}.stopType`, newStopType);
  };

  // ========== UI HELPERS ==========

  const getStopTypeInfo = (type: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      origin: { label: "Origen", color: "bg-green-100 text-green-700" },
      destination: { label: "Destino", color: "bg-red-100 text-red-700" },
      waypoint: { label: "Escala", color: "bg-gray-100 text-gray-700" },
      pickup: { label: "Carga", color: "bg-blue-100 text-blue-700" },
      delivery: { label: "Descarga", color: "bg-orange-100 text-orange-700" },
    };
    return labels[type] || { label: type, color: "bg-gray-100 text-gray-700" };
  };

  const getAvailableOperations = (
    category: "origin" | "waypoint" | "destination" | undefined,
  ) => {
    if (!category) return [];

    switch (category) {
      case "origin":
        return STOP_OPERATION_OPTIONS.filter((opt) => opt.value === "pickup");
      case "destination":
        return STOP_OPERATION_OPTIONS.filter((opt) => opt.value === "delivery");
      case "waypoint":
        return STOP_OPERATION_OPTIONS;
      default:
        return [];
    }
  };

  // ========== RENDER STOP CARD ==========

  const renderStopCard = (
    index: number,
    type: "origin" | "waypoint" | "destination",
  ) => {
    const stop = form.watch(`stops.${index}`);
    if (!stop || !stop.stopType) return null;

    const isWaypoint = type === "waypoint";
    const canDrag = isWaypoint && waypointIndices.length > 1;

    // Para escalas: determinar si es la primera o última escala
    const isFirstWaypoint = isWaypoint && index === waypointIndices[0];
    const isLastWaypoint =
      isWaypoint && index === waypointIndices[waypointIndices.length - 1];

    // Número de secuencia para mostrar (índice + 1)
    const displayOrder = index + 1;

    return (
      <div
        key={fields[index]?.id || index}
        draggable={canDrag}
        onDragStart={() => canDrag && handleDragStart(index)}
        onDragOver={canDrag ? handleDragOver : undefined}
        onDrop={canDrag ? (e) => handleDrop(e, index) : undefined}
        onDragEnd={handleDragEnd}
        className={cn(
          "flex items-start gap-3 p-4 border rounded-lg transition-all",
          draggedIndex === index && "opacity-50",
          canDrag && "hover:shadow-md cursor-move",
          type === "origin" && "border-green-200 bg-green-50/50",
          type === "destination" && "border-red-200 bg-red-50/50",
          type === "waypoint" && "border-gray-200 bg-white",
        )}
      >
        {/* Indicador de orden y Drag Handle */}
        <div className="flex flex-col items-center gap-1 pt-1">
          {isWaypoint ? (
            <GripVertical
              className={cn(
                "h-5 w-5",
                canDrag ? "text-muted-foreground" : "text-muted-foreground/30",
              )}
            />
          ) : (
            <span className="text-xs font-semibold text-muted-foreground w-5 text-center">
              #{displayOrder}
            </span>
          )}
          {isWaypoint && (
            <span className="text-xs font-medium text-muted-foreground">
              #{displayOrder}
            </span>
          )}
        </div>

        {/* Stop Icon */}
        <div className="pt-1">
          {type === "origin" && (
            <Navigation className="h-5 w-5 text-green-600" />
          )}
          {type === "waypoint" && <MapPin className="h-5 w-5 text-gray-600" />}
          {type === "destination" && <Flag className="h-5 w-5 text-red-600" />}
        </div>

        {/* Stop Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1">
                {Array.isArray(stop.stopType) &&
                  stop.stopType.map((stopType) => {
                    const info = getStopTypeInfo(stopType);
                    return (
                      <span
                        key={stopType}
                        className={cn(
                          "px-2 py-0.5 text-xs font-medium rounded",
                          info.color,
                        )}
                      >
                        {info.label}
                      </span>
                    );
                  })}

                {/* Botón editar operaciones - solo para escalas */}
                {isWaypoint && (
                  <Popover
                    open={editingStopIndex === index}
                    onOpenChange={(open) =>
                      setEditingStopIndex(open ? index : null)
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-1"
                        title="Editar operaciones de esta escala"
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" align="start">
                      <div className="space-y-3">
                        <p className="text-sm font-medium">
                          Operaciones de la Escala
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Seleccione carga, descarga o ambas
                        </p>
                        <div className="space-y-2">
                          {STOP_OPERATION_OPTIONS.map((option) => {
                            const OpIcon = option.icon;
                            const isChecked = stop.stopType.includes(
                              option.value as any,
                            );
                            const operationCount = stop.stopType.filter(
                              (t) =>
                                t === StopType.PICKUP ||
                                t === StopType.DELIVERY,
                            ).length;
                            const isLastOperation =
                              isChecked && operationCount === 1;

                            return (
                              <div
                                key={option.value}
                                className={cn(
                                  "flex items-center gap-3 p-2.5 border rounded-lg transition-colors",
                                  isChecked && "border-primary bg-primary/5",
                                )}
                              >
                                <Checkbox
                                  id={`edit-op-${index}-${option.value}`}
                                  checked={isChecked}
                                  disabled={isLastOperation}
                                  onCheckedChange={(checked) => {
                                    handleWaypointOperationChange(
                                      index,
                                      option.value,
                                      !!checked,
                                    );
                                  }}
                                />
                                <label
                                  htmlFor={`edit-op-${index}-${option.value}`}
                                  className={cn(
                                    "flex items-center gap-2 text-sm font-medium leading-none cursor-pointer",
                                    isLastOperation &&
                                      "opacity-50 cursor-not-allowed",
                                  )}
                                >
                                  <OpIcon
                                    className={cn("h-4 w-4", option.color)}
                                  />
                                  {option.label}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {stop.locationName && (
                <p className="font-medium truncate mt-1">{stop.locationName}</p>
              )}
              <p className="text-sm text-muted-foreground truncate">
                {stop.address}
              </p>
              <p className="text-sm text-muted-foreground">
                {stop.city}
                {stop.state && `, ${stop.state}`}
              </p>
            </div>
          </div>

          {stop.contactName && (
            <p className="text-xs text-muted-foreground mt-2">
              Contacto: {stop.contactName}
              {stop.contactPhone && ` · ${stop.contactPhone}`}
            </p>
          )}

          {stop.notes && (
            <p className="text-xs text-muted-foreground mt-2 italic">
              {stop.notes}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1">
          {/* Botones arriba/abajo solo para escalas */}
          {isWaypoint && waypointIndices.length > 1 && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleMoveWaypoint(index, "up")}
                disabled={isFirstWaypoint}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleMoveWaypoint(index, "down")}
                disabled={isLastWaypoint}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => handleRemoveStop(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // ========== RENDER EMPTY BLOCK ==========

  const renderEmptyBlock = (
    type: "origin" | "waypoint" | "destination",
    title: string,
    description: string,
    icon: React.ReactNode,
    iconColor: string,
  ) => (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center",
        type === "origin" && "border-green-300 bg-green-50/30",
        type === "waypoint" && "border-gray-300 bg-gray-50/30",
        type === "destination" && "border-red-300 bg-red-50/30",
      )}
    >
      <div
        className={cn(
          "mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3",
          type === "origin" && "bg-green-100",
          type === "waypoint" && "bg-gray-100",
          type === "destination" && "bg-red-100",
        )}
      >
        {icon}
      </div>
      <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground mb-4">{description}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => openAddStopDialog(type)}
        className={cn(
          type === "origin" &&
            "border-green-300 text-green-700 hover:bg-green-50",
          type === "waypoint" &&
            "border-gray-300 text-gray-700 hover:bg-gray-50",
          type === "destination" &&
            "border-red-300 text-red-700 hover:bg-red-50",
        )}
      >
        <Plus className="h-4 w-4 mr-2" />
        Agregar{" "}
        {type === "origin"
          ? "Origen"
          : type === "destination"
            ? "Destino"
            : "Escala"}
      </Button>
    </div>
  );

  // ========== RENDER ==========

  return (
    <div className="space-y-4">
      {/* Bloque ORIGEN */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Navigation className="h-5 w-5 text-green-600" />
            Origen
            <span className="text-xs font-normal text-muted-foreground">
              (1 parada)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasOrigin
            ? renderStopCard(originIndex, "origin")
            : renderEmptyBlock(
                "origin",
                "Sin parada de origen",
                "Agregue el punto de inicio del viaje",
                <Navigation className="h-6 w-6 text-green-600" />,
                "text-green-600",
              )}
        </CardContent>
      </Card>

      {/* Bloque ESCALAS */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-5 w-5 text-gray-600" />
              Escalas
              <span className="text-xs font-normal text-muted-foreground">
                ({waypointIndices.length}{" "}
                {waypointIndices.length === 1 ? "parada" : "paradas"})
              </span>
            </CardTitle>
            {hasWaypoints && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openAddStopDialog("waypoint")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Escala
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {hasWaypoints ? (
            <div className="space-y-2">
              {/* Las escalas ya están ordenadas por índice en el array */}
              {waypointIndices.map((index) =>
                renderStopCard(index, "waypoint"),
              )}
            </div>
          ) : (
            renderEmptyBlock(
              "waypoint",
              "Sin escalas intermedias",
              "Las escalas son opcionales. Puede agregar paradas intermedias para carga/descarga parcial",
              <MapPin className="h-6 w-6 text-gray-600" />,
              "text-gray-600",
            )
          )}
        </CardContent>
      </Card>

      {/* Bloque DESTINO */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Flag className="h-5 w-5 text-red-600" />
            Destino
            <span className="text-xs font-normal text-muted-foreground">
              (1 parada)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasDestination
            ? renderStopCard(destinationIndex, "destination")
            : renderEmptyBlock(
                "destination",
                "Sin parada de destino",
                "Agregue el punto final del viaje",
                <Flag className="h-6 w-6 text-red-600" />,
                "text-red-600",
              )}
        </CardContent>
      </Card>

      {/* Información de ayuda */}
      <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
        <p className="font-medium mb-1">Reglas de la ruta:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>El viaje debe tener exactamente 1 origen y 1 destino</li>
          <li>Las escalas son opcionales y pueden ser múltiples</li>
          <li>Puede reordenar las escalas arrastrándolas o con los botones</li>
          <li>
            En el origen solo se permite carga; en el destino solo descarga
          </li>
          <li>En las escalas puede realizar carga, descarga o ambas</li>
        </ul>
      </div>

      {/* Dialog para agregar parada */}
      <Dialog open={isAddStopDialogOpen} onOpenChange={setIsAddStopDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Agregar {newStop.stopCategory === "origin" && "Parada de Origen"}
              {newStop.stopCategory === "waypoint" && "Escala"}
              {newStop.stopCategory === "destination" && "Parada de Destino"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Información del Tipo de Parada */}
            <div
              className={cn(
                "p-4 border-2 rounded-lg",
                newStop.stopCategory === "origin" &&
                  "border-green-200 bg-green-50",
                newStop.stopCategory === "waypoint" &&
                  "border-gray-200 bg-gray-50",
                newStop.stopCategory === "destination" &&
                  "border-red-200 bg-red-50",
              )}
            >
              <div className="flex items-center gap-3">
                {newStop.stopCategory === "origin" && (
                  <>
                    <Navigation className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-medium text-sm">Parada de Origen</p>
                      <p className="text-xs text-muted-foreground">
                        Punto de inicio del viaje. Solo permite carga de
                        mercancía.
                      </p>
                    </div>
                  </>
                )}
                {newStop.stopCategory === "waypoint" && (
                  <>
                    <MapPin className="h-6 w-6 text-gray-600" />
                    <div>
                      <p className="font-medium text-sm">Escala Intermedia</p>
                      <p className="text-xs text-muted-foreground">
                        Puede realizar carga, descarga o ambas operaciones.
                      </p>
                    </div>
                  </>
                )}
                {newStop.stopCategory === "destination" && (
                  <>
                    <Flag className="h-6 w-6 text-red-600" />
                    <div>
                      <p className="font-medium text-sm">Parada de Destino</p>
                      <p className="text-xs text-muted-foreground">
                        Punto final del viaje. Solo permite descarga de
                        mercancía.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Operaciones (solo para escalas) */}
            {newStop.stopCategory === "waypoint" && (
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Operaciones en esta Parada *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {getAvailableOperations(newStop.stopCategory).map(
                    (option) => {
                      const OpIcon = option.icon;
                      const isChecked =
                        newStop.stopType?.includes(option.value as any) ??
                        false;

                      return (
                        <div
                          key={option.value}
                          className={cn(
                            "flex items-center gap-3 p-3 border rounded-lg cursor-pointer",
                            isChecked && "border-primary bg-primary/5",
                          )}
                          onClick={() => {
                            const currentTypes = newStop.stopType || [];
                            let newTypes: typeof currentTypes;

                            if (isChecked) {
                              newTypes = currentTypes.filter(
                                (t) => t !== option.value,
                              );
                            } else {
                              newTypes = [
                                ...currentTypes,
                                option.value as TripStopFormValues["stopType"][number],
                              ];
                            }

                            setNewStop({
                              ...newStop,
                              stopType: newTypes,
                            });
                          }}
                        >
                          <Checkbox
                            id={`operation-${option.value}`}
                            checked={isChecked}
                            onCheckedChange={() => {}}
                          />
                          <label
                            htmlFor={`operation-${option.value}`}
                            className="flex items-center gap-2 text-sm font-medium leading-none cursor-pointer"
                          >
                            <OpIcon className={cn("h-4 w-4", option.color)} />
                            {option.label}
                          </label>
                        </div>
                      );
                    },
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Seleccione al menos una operación
                </p>
              </div>
            )}

            {/* Selector de Cliente */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Cliente (opcional)
              </label>
              <Select
                value={newStop.clientId || ""}
                onValueChange={handleClientChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-client">Sin cliente</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.legalName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selector de Dirección del Cliente */}
            {newStop.clientId && addresses.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Dirección del Cliente
                </label>
                <Select
                  value={newStop.clientAddressId || ""}
                  onValueChange={handleAddressSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar dirección..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-client-address">
                      Ingresar manualmente
                    </SelectItem>
                    {addresses.map((address) => (
                      <SelectItem key={address.id} value={address.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {address.locationName || address.address}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {address.city}
                            {address.state && `, ${address.state}`} -{" "}
                            {ADDRESS_TYPE_LABELS[address.addressType]}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {newStop.clientId && addresses.length === 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                Este cliente no tiene direcciones registradas. Ingrese la
                dirección manualmente.
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Nombre del Lugar (opcional)
              </label>
              <Input
                placeholder="Ej: Bodega Central, CEDIS Norte..."
                value={newStop.locationName || ""}
                onChange={(e) =>
                  setNewStop({ ...newStop, locationName: e.target.value })
                }
                disabled={!!newStop.clientAddressId}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Dirección *</label>
              <Input
                placeholder="Calle, número, colonia..."
                value={newStop.address || ""}
                onChange={(e) =>
                  setNewStop({ ...newStop, address: e.target.value })
                }
                disabled={!!newStop.clientAddressId}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ciudad *</label>
                <Input
                  placeholder="Ciudad"
                  value={newStop.city || ""}
                  onChange={(e) =>
                    setNewStop({ ...newStop, city: e.target.value })
                  }
                  disabled={!!newStop.clientAddressId}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <Input
                  placeholder="Estado"
                  value={newStop.state || ""}
                  onChange={(e) =>
                    setNewStop({ ...newStop, state: e.target.value })
                  }
                  disabled={!!newStop.clientAddressId}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre Contacto</label>
                <Input
                  placeholder="Nombre del contacto"
                  value={newStop.contactName || ""}
                  onChange={(e) =>
                    setNewStop({ ...newStop, contactName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Teléfono Contacto</label>
                <Input
                  placeholder="Teléfono"
                  value={newStop.contactPhone || ""}
                  onChange={(e) =>
                    setNewStop({ ...newStop, contactPhone: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notas</label>
              <Textarea
                placeholder="Instrucciones especiales..."
                value={newStop.notes || ""}
                onChange={(e) =>
                  setNewStop({ ...newStop, notes: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetNewStopForm();
                setIsAddStopDialogOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAddStop}
              disabled={
                !newStop.address ||
                !newStop.city ||
                !newStop.stopCategory ||
                (newStop.stopCategory === "waypoint" &&
                  (!newStop.stopType || newStop.stopType.length === 0))
              }
            >
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
