/**
 * RouteStep - Paso 2 del Wizard
 * Clean Architecture - Presentation Layer
 *
 * Ruta: Paradas del viaje organizadas en bloques (Origen, Escalas, Destino)
 *
 * ACTUALIZADO: Campos de dirección unificados con Carta Porte 3.1
 * - Eliminados campos legacy (address, city, state como texto libre)
 * - Todos los campos usan catálogos SAT
 * - Display de dirección basado en campos SAT
 *
 * Reglas de negocio:
 * - Origen: solo 1 parada, solo operación "carga" (pickup), siempre índice 0
 * - Escalas: N paradas, carga y/o descarga (editable inline), índices 1..N
 * - Destino: solo 1 parada, solo operación "descarga" (delivery), siempre último índice
 * - Drag & drop solo entre escalas (origen y destino son fijos)
 * - El índice del array y sequenceOrder siempre son idénticos
 *
 * Ubicación: src/features/trips/presentation/pages/create/components/RouteStep.tsx
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { estimateRoadDistanceKm } from "@shared/utils/geoUtils";
import type { UseFormReturn, UseFieldArrayReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import { Badge } from "@shared/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/ui/popover";
import {
  MapPin,
  Trash2,
  GripVertical,
  Navigation,
  Flag,
  ChevronUp,
  ChevronDown,
  Pencil,
  Plus,
  FileText,
  CircleDashed,
  CircleCheck,
} from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import type { TripWizardFormValues, TripStopFormValues } from "./validation";
import { stopHasUnifiedAddressId } from "./validation";
import { StopType, type StopTypeValue } from "@features/trips";
import {
  StopFormDialog,
  type StopFormData,
  type StopCategory,
} from "./StopFormDialog";

// ============================================================================
// TYPES
// ============================================================================

interface RouteStepProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<TripWizardFormValues, any, any>;
  stopsFieldArray: UseFieldArrayReturn<TripWizardFormValues, "stops">;
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

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Formatea la dirección para display basándose en campos SAT
 * Orden: Calle NumExt, CP, Municipio, Estado
 */
function formatStopAddress(stop: TripStopFormValues): {
  primary: string;
  secondary: string;
} {
  const parts: string[] = [];

  // Línea primaria: Calle y número
  if (stop.street) {
    let streetLine = stop.street;
    if (stop.exteriorNumber) {
      streetLine += ` #${stop.exteriorNumber}`;
    }
    if (stop.interiorNumber) {
      streetLine += `, Int. ${stop.interiorNumber}`;
    }
    parts.push(streetLine);
  }

  // Línea secundaria: CP, Municipio, Estado (usando códigos SAT)
  const locationParts: string[] = [];

  if (stop.postalCode) {
    locationParts.push(`C.P. ${stop.postalCode}`);
  }

  // Para municipio y estado, mostramos los códigos SAT
  // En un escenario real, podrías tener un lookup para mostrar nombres
  if (stop.satMunicipioCode) {
    locationParts.push(`Mpio. ${stop.satMunicipioCode}`);
  }

  if (stop.satEstadoCode) {
    locationParts.push(`Edo. ${stop.satEstadoCode}`);
  }

  return {
    primary: parts.join(", ") || "Sin dirección especificada",
    secondary: locationParts.join(", "),
  };
}

/** Datos SAT capturados a mano (sin `addressId` de catálogo unificado). */
function hasManualSatPostalComplete(stop: TripStopFormValues): boolean {
  return !!(
    stop.satEstadoCode?.trim() &&
    stop.satMunicipioCode?.trim() &&
    /^\d{5}$/.test(stop.postalCode?.trim() ?? "")
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function RouteStep({ form, stopsFieldArray }: RouteStepProps) {
  const { fields } = stopsFieldArray;
  const scheduledArrival = form.watch("scheduledArrival");

  // ══════════════════════════════════════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════════════════════════════════════

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogInitialData, setDialogInitialData] = useState<
    StopFormData | undefined
  >();
  const [editingStopIndex, setEditingStopIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [operationsPopoverIndex, setOperationsPopoverIndex] = useState<
    number | null
  >(null);

  // ══════════════════════════════════════════════════════════════════════════
  // REORDENAR ARRAY DE STOPS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Reordena físicamente el array de stops para que:
   * - Origen siempre sea el primero (índice 0)
   * - Escalas estén en medio (índices 1..N-1), ordenadas por su sequenceOrder actual
   * - Destino siempre sea el último (índice N)
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

  // ══════════════════════════════════════════════════════════════════════════
  // CLASIFICACIÓN DE PARADAS
  // ══════════════════════════════════════════════════════════════════════════

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

  // Mantener sincronizada la llegada estimada del destino con el valor del Paso 1.
  useEffect(() => {
    if (destinationIndex === -1) return;

    const normalizedScheduledArrival = scheduledArrival?.trim()
      ? scheduledArrival
      : undefined;
    const currentDestinationArrival = form.getValues(
      `stops.${destinationIndex}.estimatedArrival`,
    );

    if (currentDestinationArrival === normalizedScheduledArrival) return;

    form.setValue(
      `stops.${destinationIndex}.estimatedArrival`,
      normalizedScheduledArrival,
      {
        shouldDirty: true,
        shouldValidate: false,
      },
    );
  }, [destinationIndex, form, scheduledArrival]);

  // ══════════════════════════════════════════════════════════════════════════
  // DIALOG HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

  const openAddDialog = (category: StopCategory) => {
    const defaultOperations =
      category === "origin"
        ? ["pickup"]
        : category === "destination"
          ? ["delivery"]
          : [];

    // Pre-cargar scheduledArrival del form como estimatedArrival del destino
    const initialEstimatedArrival =
      category === "destination"
        ? (form.getValues("scheduledArrival") ?? undefined)
        : undefined;

    setDialogInitialData({
      stopCategory: category,
      stopType: defaultOperations as TripStopFormValues["stopType"],
      estimatedArrival: initialEstimatedArrival,
    });
    setEditingStopIndex(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (index: number, category: StopCategory) => {
    const stop = form.getValues(`stops.${index}`);
    if (!stop) return;

      // Extraer operaciones (sin la categoría)
      const operations = stop.stopType.filter(
        (t) =>
          t !== StopType.ORIGIN &&
          t !== StopType.DESTINATION &&
          t !== StopType.WAYPOINT,
      );

      setDialogInitialData({
        stopCategory: category,
        stopType: operations as TripStopFormValues["stopType"],
        clientId: stop.clientId,
        clientAddressId: stop.clientAddressId,
        addressId: stop.addressId,
        locationName: stop.locationName,
        // Campos Carta Porte
        satEstadoCode: stop.satEstadoCode,
        satMunicipioCode: stop.satMunicipioCode,
        postalCode: stop.postalCode,
        satLocalidadCode: stop.satLocalidadCode,
        satColoniaCode: stop.satColoniaCode,
        street: stop.street,
        exteriorNumber: stop.exteriorNumber,
        interiorNumber: stop.interiorNumber,
        reference: stop.reference,
        rfcRemitenteDestinatario: stop.rfcRemitenteDestinatario,
        nombreRemitenteDestinatario: stop.nombreRemitenteDestinatario,
        contactName: stop.contactName,
        contactPhone: stop.contactPhone,
        notes: stop.notes,
        estimatedArrival: stop.estimatedArrival,
        distanceFromPreviousKm: stop.distanceFromPreviousKm,
        latitude: stop.latitude,
        longitude: stop.longitude,
      });
    setEditingStopIndex(index);
    setIsDialogOpen(true);
  };

  /**
   * Recorre las paradas en orden y rellena distanceFromPreviousKm usando Haversine × 1.30
   * cuando dos paradas consecutivas tienen coordenadas y el campo está vacío.
   * Si ya existe un valor manual, lo respeta.
   */
  const recalculateDistances = useCallback(() => {
    const stops = form.getValues("stops");
    if (!stops || stops.length < 2) return;

    let changed = false;
    const updated = stops.map((stop, i) => {
      if (i === 0) return stop; // Origen no tiene parada anterior

      const prev = stops[i - 1];
      const estimated = estimateRoadDistanceKm(
        prev.latitude,
        prev.longitude,
        stop.latitude,
        stop.longitude,
      );

      // Solo prellenar si hay coordenadas y el campo está vacío
      if (estimated !== null && !stop.distanceFromPreviousKm) {
        changed = true;
        return { ...stop, distanceFromPreviousKm: estimated };
      }
      return stop;
    });

    if (changed) {
      form.setValue("stops", updated, { shouldDirty: true });
    }
  }, [form]);

  const handleDialogSubmit = (data: StopFormData) => {
    if (!data.stopCategory || !data.stopType || data.stopType.length === 0) {
      return;
    }

      const previousStop =
        editingStopIndex !== null
          ? form.getValues(`stops.${editingStopIndex}`)
          : undefined;

      // Construir stopTypes incluyendo la categoría
      const stopTypes: TripStopFormValues["stopType"] = [
        data.stopCategory as StopTypeValue,
        ...data.stopType.filter((t) => t !== data.stopCategory),
      ];

      const stopData: TripStopFormValues = {
        ...(previousStop?.id ? { id: previousStop.id } : {}),
        sequenceOrder: editingStopIndex ?? 999, // Se recalculará si es nuevo
        stopType: stopTypes,
        clientId: data.clientId || undefined,
        clientAddressId: data.clientAddressId || undefined,
        addressId: data.addressId?.trim() || "",
        locationName: data.locationName,
        // Campos Carta Porte (unificados - sin campos legacy)
        satEstadoCode: data.satEstadoCode || "",
        satMunicipioCode: data.satMunicipioCode || "",
        postalCode: data.postalCode || "",
        satLocalidadCode: data.satLocalidadCode,
        cityName: data.cityName,
        satColoniaCode: data.satColoniaCode,
        colonia: data.colonia,
        street: data.street,
        exteriorNumber: data.exteriorNumber,
        interiorNumber: data.interiorNumber,
        reference: data.reference,
        rfcRemitenteDestinatario: data.rfcRemitenteDestinatario,
        nombreRemitenteDestinatario: data.nombreRemitenteDestinatario,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        notes: data.notes,
        estimatedArrival: data.estimatedArrival,
        distanceFromPreviousKm: data.distanceFromPreviousKm,
        latitude: data.latitude,
        longitude: data.longitude,
      };

      if (editingStopIndex !== null) {
        // Modo edición: actualizar parada existente
        form.setValue(`stops.${editingStopIndex}`, stopData, {
          shouldValidate: false,
          shouldDirty: true,
        });
      } else {
        // Modo creación: agregar nueva parada
        const currentStops = form.getValues("stops") || [];
        form.setValue("stops", [...currentStops, stopData]);

        // Reordenar
        requestAnimationFrame(() => {
          reorderStopsArray();
        });
      }

      // Si es la parada de destino, sincronizar estimatedArrival → scheduledArrival
      if (data.stopCategory === "destination") {
        form.setValue("scheduledArrival", stopData.estimatedArrival ?? "", {
          shouldDirty: true,
        });
      }

      // Recalcular distancias automáticamente tras reordenar
      requestAnimationFrame(() => {
        recalculateDistances();
      });

    setIsDialogOpen(false);
    setEditingStopIndex(null);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // STOP HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

  const handleRemoveStop = useCallback(
    (index: number) => {
      const currentStops = form.getValues("stops") || [];
      const updatedStops = currentStops.filter((_, i) => i !== index);
      form.setValue("stops", updatedStops);

      requestAnimationFrame(() => {
        reorderStopsArray();
        recalculateDistances();
      });
    },
    [form, reorderStopsArray, recalculateDistances],
  );

  const handleMoveWaypoint = useCallback(
    (currentIndex: number, direction: "up" | "down") => {
      const currentStops = form.getValues("stops") || [];
      const currentStop = currentStops[currentIndex];

      if (
        !currentStop?.stopType?.includes(StopType.WAYPOINT) ||
        currentStop?.stopType?.includes(StopType.ORIGIN) ||
        currentStop?.stopType?.includes(StopType.DESTINATION)
      ) {
        return;
      }

      let targetIndex: number;

      if (direction === "up") {
        targetIndex = currentIndex - 1;
        const targetStop = currentStops[targetIndex];
        if (targetStop?.stopType?.includes(StopType.ORIGIN)) {
          return;
        }
      } else {
        targetIndex = currentIndex + 1;
        const targetStop = currentStops[targetIndex];
        if (targetStop?.stopType?.includes(StopType.DESTINATION)) {
          return;
        }
      }

      if (targetIndex < 0 || targetIndex >= currentStops.length) {
        return;
      }

      // Intercambiar posiciones
      const updatedStops = [...currentStops];
      const temp = updatedStops[currentIndex];
      updatedStops[currentIndex] = updatedStops[targetIndex];
      updatedStops[targetIndex] = temp;

      // Actualizar sequenceOrder
      updatedStops.forEach((stop, idx) => {
        stop.sequenceOrder = idx;
      });

      form.setValue("stops", updatedStops, {
        shouldValidate: false,
        shouldDirty: true,
      });
    },
    [form],
  );

  // ══════════════════════════════════════════════════════════════════════════
  // DRAG & DROP
  // ══════════════════════════════════════════════════════════════════════════

  const handleDragStart = (index: number) => {
    if (waypointIndices.includes(index)) {
      setDraggedIndex(index);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

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
      const updatedStops = [...currentStops];
      const temp = updatedStops[draggedIndex];
      updatedStops[draggedIndex] = updatedStops[dropIndex];
      updatedStops[dropIndex] = temp;

      updatedStops.forEach((stop, idx) => {
        stop.sequenceOrder = idx;
      });

      form.setValue("stops", updatedStops, {
        shouldValidate: false,
        shouldDirty: true,
      });

    setDraggedIndex(null);
  };

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // EDITAR OPERACIONES DE ESCALA
  // ══════════════════════════════════════════════════════════════════════════

  const handleWaypointOperationChange = useCallback(
    (stopIndex: number, operation: string, checked: boolean) => {
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
    },
    [form],
  );

  // ══════════════════════════════════════════════════════════════════════════
  // UI HELPERS
  // ══════════════════════════════════════════════════════════════════════════

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

  const getStopMissingFields = useCallback(
    (
      stop: TripStopFormValues,
      type: "origin" | "waypoint" | "destination",
      index: number,
    ): string[] => {
      const missing: string[] = [];

      if (
        type === "waypoint" &&
        !(
          stop.stopType.includes(StopType.PICKUP) ||
          stop.stopType.includes(StopType.DELIVERY)
        )
      ) {
        missing.push("operacion");
      }

      if (!stopHasUnifiedAddressId(stop)) {
        if (!stop.satEstadoCode?.trim()) missing.push("estado SAT");
        if (!stop.satMunicipioCode?.trim()) missing.push("municipio SAT");
        if (!/^\d{5}$/.test(stop.postalCode?.trim() ?? "")) missing.push("CP");
      }

      if (type === "destination" && !stop.estimatedArrival) {
        missing.push("hora llegada");
      }

      if (index > 0 && (stop.distanceFromPreviousKm ?? null) === null) {
        missing.push("distancia");
      }

      return missing;
    },
    [],
  );

  const guidanceSummary = useMemo(() => {
    const stops = form.getValues("stops") || [];
    const pendingActions: string[] = [];

    if (!hasOrigin) pendingActions.push("Agregar origen");
    if (!hasDestination) pendingActions.push("Agregar destino");
    if (!hasWaypoints) pendingActions.push("Evaluar si requiere escalas");

    const incompleteCount = stops.reduce((count, stop, index) => {
      const stopType = stop.stopType ?? [];
      const type = stopType.includes(StopType.ORIGIN)
        ? "origin"
        : stopType.includes(StopType.DESTINATION)
          ? "destination"
          : "waypoint";
      const missing = getStopMissingFields(stop, type, index);
      if (missing.length > 0) {
        const label = stop.locationName || `Parada #${index + 1}`;
        pendingActions.push(`Completar ${label} (${missing.join(", ")})`);
        return count + 1;
      }
      return count;
    }, 0);

    const nextAction =
      pendingActions[0] ?? "Ruta lista. Ya puedes avanzar a Cargas.";

    return {
      totalStops: stops.length,
      incompleteCount,
      nextAction,
    };
  }, [form, getStopMissingFields, hasDestination, hasOrigin, hasWaypoints]);

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER STOP CARD
  // ══════════════════════════════════════════════════════════════════════════

  const renderStopCard = (
    index: number,
    type: "origin" | "waypoint" | "destination",
  ) => {
    const stop = form.watch(`stops.${index}`);
    if (!stop || !stop.stopType) return null;

    const isWaypoint = type === "waypoint";
    const canDrag = isWaypoint && waypointIndices.length > 1;
    const isFirstWaypoint = isWaypoint && index === waypointIndices[0];
    const isLastWaypoint =
      isWaypoint && index === waypointIndices[waypointIndices.length - 1];
    const displayOrder = index + 1;

    // Formatear dirección usando campos SAT
    const { primary: addressPrimary, secondary: addressSecondary } =
      formatStopAddress(stop);
    const linkedCatalog = stopHasUnifiedAddressId(stop);
    const hasManualCp = hasManualSatPostalComplete(stop);
    const missingFields = getStopMissingFields(stop, type, index);
    const isComplete = missingFields.length === 0;
    const primaryCtaLabel = isComplete ? "Editar" : "Completar";

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
          type === "origin" &&
            "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/50",
          type === "destination" &&
            "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/50",
          type === "waypoint" && "border-gray-200 bg-white dark:bg-gray-900",
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
              {/* Stop Types Badges */}
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
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    isComplete
                      ? "border-emerald-300 text-emerald-700"
                      : "border-amber-300 text-amber-700",
                  )}
                >
                  {isComplete ? (
                    <CircleCheck className="mr-1 h-3 w-3" />
                  ) : (
                    <CircleDashed className="mr-1 h-3 w-3" />
                  )}
                  {isComplete ? "Completa" : "Pendiente"}
                </Badge>

                {/* Carta Porte: domicilio en catálogo vs captura manual */}
                {linkedCatalog && (
                  <Badge
                    variant="outline"
                    className="text-xs border-emerald-300 text-emerald-800 dark:border-emerald-700 dark:text-emerald-200"
                    title="Ubicación ligada a un domicilio guardado; el SAT se resuelve desde ese registro."
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Domicilio guardado
                  </Badge>
                )}
                {!linkedCatalog && hasManualCp && (
                  <Badge
                    variant="outline"
                    className="text-xs border-blue-300 text-blue-600"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    CP
                  </Badge>
                )}

                {/* Botón editar operaciones - solo para escalas */}
                {isWaypoint && (
                  <Popover
                    open={operationsPopoverIndex === index}
                    onOpenChange={(open) =>
                      setOperationsPopoverIndex(open ? index : null)
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
                              option.value as StopTypeValue,
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

              {/* Location Name */}
              {stop.locationName && (
                <p className="font-medium truncate mt-1">{stop.locationName}</p>
              )}

              {/* Address Display - basado en campos SAT */}
              <p className="text-sm text-muted-foreground truncate">
                {addressPrimary}
              </p>
              {addressSecondary && (
                <p className="text-sm text-muted-foreground">
                  {addressSecondary}
                </p>
              )}

              {/* Códigos SAT (manual o precargados desde domicilio guardado) */}
              {(linkedCatalog || hasManualCp) && (
                <p className="text-xs text-blue-600 mt-1">
                  SAT: {stop.satEstadoCode}-{stop.satMunicipioCode}
                  {stop.postalCode && ` · CP ${stop.postalCode}`}
                </p>
              )}

              {/* Distancia desde parada anterior (solo para escalas y destino) */}
              {index > 0 && stop.distanceFromPreviousKm != null && stop.distanceFromPreviousKm > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  📍 {stop.distanceFromPreviousKm} km desde parada anterior
                </p>
              )}
              {!isComplete && (
                <p className="mt-1 text-xs text-amber-700">
                  Falta: {missingFields.join(", ")}.
                </p>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant={isComplete ? "outline" : "default"}
                size="sm"
                className="h-8"
                onClick={() => openEditDialog(index, type)}
              >
                {primaryCtaLabel}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => openEditDialog(index, type)}
                title="Editar parada"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Contact Info */}
          {stop.contactName && (
            <p className="text-xs text-muted-foreground mt-2">
              Contacto: {stop.contactName}
              {stop.contactPhone && ` · ${stop.contactPhone}`}
            </p>
          )}

          {/* Notes */}
          {stop.notes && (
            <p className="text-xs text-muted-foreground mt-2 italic">
              {stop.notes}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1">
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

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER EMPTY BLOCK
  // ══════════════════════════════════════════════════════════════════════════

  const renderEmptyBlock = (
    type: "origin" | "waypoint" | "destination",
    title: string,
    description: string,
    icon: React.ReactNode,
  ) => (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center",
        type === "origin" &&
          "border-green-300 bg-green-50/30 dark:border-green-700 dark:bg-green-950/30",
        type === "waypoint" &&
          "border-gray-300 bg-gray-50/30 dark:border-gray-600 dark:bg-gray-900/30",
        type === "destination" &&
          "border-red-300 bg-red-50/30 dark:border-red-700 dark:bg-red-950/30",
      )}
    >
      <div
        className={cn(
          "mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3",
          type === "origin" && "bg-green-100 dark:bg-green-900",
          type === "waypoint" && "bg-gray-100 dark:bg-gray-800",
          type === "destination" && "bg-red-100 dark:bg-red-900",
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
        onClick={() => openAddDialog(type)}
        className={cn(
          type === "origin" &&
            "border-green-300 text-green-700 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-950",
          type === "waypoint" &&
            "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-900",
          type === "destination" &&
            "border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-950",
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

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-4">
      <Card className="border-dashed">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">Guía rápida de ruta</p>
              <p className="text-sm text-muted-foreground">
                Siguiente acción: {guidanceSummary.nextAction}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{guidanceSummary.totalStops} paradas</Badge>
              <Badge
                variant="outline"
                className={cn(
                  guidanceSummary.incompleteCount > 0
                    ? "border-amber-300 text-amber-700"
                    : "border-emerald-300 text-emerald-700",
                )}
              >
                {guidanceSummary.incompleteCount > 0
                  ? `${guidanceSummary.incompleteCount} pendientes`
                  : "Todo completo"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

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
                onClick={() => openAddDialog("waypoint")}
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
          <li>
            Los campos de Estado, Municipio y CP son obligatorios para Carta
            Porte
          </li>
        </ul>
      </div>

      {/* Dialog para agregar/editar parada */}
      <StopFormDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingStopIndex(null);
          }
        }}
        onSubmit={handleDialogSubmit}
        initialData={dialogInitialData}
        mode={editingStopIndex !== null ? "edit" : "create"}
      />
    </div>
  );
}

export default RouteStep;
