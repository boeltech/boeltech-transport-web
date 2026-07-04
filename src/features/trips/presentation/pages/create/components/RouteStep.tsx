/**
 * RouteStep - Paso 2 del Wizard
 * Clean Architecture - Presentation Layer
 *
 * Ruta: Paradas del viaje organizadas en bloques (Origen, Escalas, Destino)
 *
 * ACTUALIZADO: Campos de dirección unificados con Carta Porte 3.1
 * - Eliminados campos legacy (address, city, state como texto libre)
 * - Todos los campos usan catálogos fiscales
 * - Display de dirección con datos legibles para operación
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
import type { UseFormReturn, UseFieldArrayReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import {
  MapPin,
  Trash2,
  GripVertical,
  Navigation,
  Flag,
  ChevronUp,
  ChevronDown,
  Plus,
  FileText,
  CircleDashed,
  CircleCheck,
  Loader2,
} from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import type { TripWizardFormValues, TripStopFormValues } from "./validation";
import { stopHasUnifiedAddressId } from "./validation";
import { LOCATION_CAPTURE_LABELS } from "./wizardCopy";
import { routeCopy as tripRouteCopy, wizardCopy } from "../../../copy";
import { formatDistanceSourceLabel } from "../../../components/trip-route/tripRouteDetailHelpers";

const copy = wizardCopy.route;
import {
  applySegmentDistanceResultsToStops,
  buildRouteSegmentsForBatch,
  fillMissingDistancesFromCoordinates,
  hasManualSegmentDistances,
  hasMissingStopDistances,
} from "./stopDistanceHelpers";
import {
  CalculateSegmentsDistanceUseCase,
  createGeoProviderBundle,
} from "@shared/geolocation";
import { useToast } from "@shared/hooks";
import { SectionHeadingWithHint } from "@shared/ui/hint-icon";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog/alert-dialog";
import { StopType, type StopTypeValue } from "@features/trips";
import { getStopTypeBadgeClasses, getStopTypeConfig } from "../../../uiHelpers";
import {
  StopFormSheet,
  type StopFormData,
  type StopCategory,
} from "./StopFormSheet";
import { formatWizardStopAddressDisplay } from "./wizardStopFormat";

// ============================================================================
// TYPES
// ============================================================================

interface RouteStepProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<TripWizardFormValues, any, any>;
  stopsFieldArray: UseFieldArrayReturn<TripWizardFormValues, "stops">;
}

// ============================================================================
// HELPERS
// ============================================================================

function hasManualSatPostalComplete(stop: TripStopFormValues): boolean {
  return !!(
    stop.satCountryCode?.trim() &&
    stop.satStateCode?.trim() &&
    stop.satMunicipalityCode?.trim() &&
    /^\d{5}$/.test(stop.postalCode?.trim() ?? "")
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function RouteStep({ form, stopsFieldArray }: RouteStepProps) {
  const { fields } = stopsFieldArray;
  const scheduledArrival = form.watch("scheduledArrival");
  const tripContractingClientId = form.watch("clientId");
  const cfdiDocumentIntent =
    form.watch("cfdiDocumentIntent") === "traslado" ? "traslado" : "ingreso";
  const watchedStops = form.watch("stops");
  const showRecalculateMissingDistances = useMemo(
    () => hasMissingStopDistances(watchedStops),
    [watchedStops],
  );

  // ══════════════════════════════════════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════════════════════════════════════

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogInitialData, setDialogInitialData] = useState<
    StopFormData | undefined
  >();
  const [editingStopIndex, setEditingStopIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [routeRecalcLoading, setRouteRecalcLoading] = useState(false);
  const [overwriteManualDialogOpen, setOverwriteManualDialogOpen] =
    useState(false);

  const { toast } = useToast();
  const segmentsDistanceUseCase = useMemo(() => {
    const bundle = createGeoProviderBundle();
    return new CalculateSegmentsDistanceUseCase(bundle.distanceMatrixProvider);
  }, []);

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

  /**
   * Recalcula todos los tramos consecutivos vía API batch (Mapbox + fallback en servidor);
   * si falla la petición, el use case aplica Haversine local.
   */
  const syncRouteDistancesFromApi = useCallback(
    async (confirmedOverwrite: boolean) => {
      const stops = form.getValues("stops") ?? [];
      if (stops.length < 2) return;

      if (!confirmedOverwrite && hasManualSegmentDistances(stops)) {
        setOverwriteManualDialogOpen(true);
        return;
      }

      const { segments, stopIndices } = buildRouteSegmentsForBatch(stops);
      const expectedSegmentCount = stops.length - 1;

      if (segments.length === 0) {
        toast({
          title: copy.toast.insufficientCoordinatesTitle,
          description: copy.toast.insufficientCoordinatesBody,
          variant: "warning",
        });
        setOverwriteManualDialogOpen(false);
        return;
      }

      if (segments.length < expectedSegmentCount) {
        toast({
          title: copy.toast.partialDistanceTitle,
          description: copy.toast.partialDistanceBody,
          variant: "warning",
        });
      }

      setRouteRecalcLoading(true);
      try {
        const results = await segmentsDistanceUseCase.execute(segments);
        const updated = applySegmentDistanceResultsToStops(
          stops,
          stopIndices,
          results,
        );
        form.setValue("stops", updated, {
          shouldDirty: true,
          shouldValidate: true,
        });
      } catch {
        toast({
          title: copy.toast.distanceErrorTitle,
          description: copy.toast.distanceErrorBody,
          variant: "error",
        });
      } finally {
        setRouteRecalcLoading(false);
        setOverwriteManualDialogOpen(false);
      }
    },
    [form, segmentsDistanceUseCase, toast],
  );

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
    const stops = form.getValues("stops") || [];
    const getPreviousForNew = () => {
      if (category === "origin") return null;
      if (category === "destination") {
        const destinationIdx = stops.findIndex((stop) =>
          stop.stopType?.includes(StopType.DESTINATION),
        );
        const targetIndex = destinationIdx > 0 ? destinationIdx - 1 : stops.length - 1;
        const previous = stops[targetIndex];
        return previous
          ? {
              latitude: previous.latitude ?? null,
              longitude: previous.longitude ?? null,
              label: previous.locationName || `Parada #${targetIndex + 1}`,
            }
          : null;
      }

      const destinationIdx = stops.findIndex((stop) =>
        stop.stopType?.includes(StopType.DESTINATION),
      );
      const previousIndex = destinationIdx > 0 ? destinationIdx - 1 : stops.length - 1;
      const previous = stops[previousIndex];
      return previous
        ? {
            latitude: previous.latitude ?? null,
            longitude: previous.longitude ?? null,
            label: previous.locationName || `Parada #${previousIndex + 1}`,
          }
        : null;
    };
    const previousStop = getPreviousForNew();
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
      previousStopLatitude: previousStop?.latitude ?? undefined,
      previousStopLongitude: previousStop?.longitude ?? undefined,
      previousStopLabel: previousStop?.label,
    });
    setEditingStopIndex(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (index: number, category: StopCategory) => {
    const stop = form.getValues(`stops.${index}`);
    if (!stop) return;
    const previousStop =
      index > 0 ? form.getValues(`stops.${index - 1}`) : undefined;

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
      satCountryCode: stop.satCountryCode,
      satStateCode: stop.satStateCode,
      satMunicipalityCode: stop.satMunicipalityCode,
      postalCode: stop.postalCode,
      satLocalityCode: stop.satLocalityCode,
      cityName: stop.cityName,
      satNeighborhoodCode: stop.satNeighborhoodCode,
      neighborhoodName: stop.neighborhoodName,
      street: stop.street,
      exteriorNumber: stop.exteriorNumber,
      interiorNumber: stop.interiorNumber,
      reference: stop.reference,
      rfcRemitenteDestinatario: stop.rfcRemitenteDestinatario,
      nombreRemitenteDestinatario: stop.nombreRemitenteDestinatario,
      deliveryRfcRemitenteDestinatario: stop.deliveryRfcRemitenteDestinatario,
      deliveryNombreRemitenteDestinatario: stop.deliveryNombreRemitenteDestinatario,
      remitentePartnerId: stop.remitentePartnerId,
      destinatarioPartnerId: stop.destinatarioPartnerId,
      contactName: stop.contactName,
      contactPhone: stop.contactPhone,
      notes: stop.notes,
      estimatedArrival: stop.estimatedArrival,
      distanceFromPreviousKm: stop.distanceFromPreviousKm,
      distanceSource: stop.distanceSource,
      distanceProvider: stop.distanceProvider,
      distanceConfidence: stop.distanceConfidence,
      distanceComputedAt: stop.distanceComputedAt,
      latitude: stop.latitude,
      longitude: stop.longitude,
      previousStopLatitude: previousStop?.latitude,
      previousStopLongitude: previousStop?.longitude,
      previousStopLabel:
        previousStop?.locationName ||
        (index > 0 ? `Parada #${index}` : undefined),
    });
    setEditingStopIndex(index);
    setIsDialogOpen(true);
  };

  /**
   * Solo rellena tramos vacíos (Haversine local). No pisa manuales ni valores existentes.
   * Útil para el botón "Recalcular distancias faltantes".
   */
  const fillMissingDistancesOnly = useCallback(() => {
    const stops = form.getValues("stops");
    if (!stops || stops.length < 2) return;

    const updated = fillMissingDistancesFromCoordinates(stops);
    if (updated !== stops) {
      form.setValue("stops", updated, { shouldDirty: true });
    }
  }, [form]);

  const handleDialogSubmit = (data: StopFormData) => {
    if (!data.stopCategory || !data.stopType || data.stopType.length === 0) {
      return;
    }

    const wasNewStop = editingStopIndex === null;

    /** Parada ya en el wizard (solo existe en modo edición). */
    const existingStop =
      editingStopIndex !== null
        ? form.getValues(`stops.${editingStopIndex}`)
        : undefined;

    // Construir stopTypes incluyendo la categoría
    const stopTypes: TripStopFormValues["stopType"] = [
      data.stopCategory as StopTypeValue,
      ...data.stopType.filter((t) => t !== data.stopCategory),
    ];

    const stopData: TripStopFormValues = {
      ...(existingStop?.id ? { id: existingStop.id } : {}),
      // En edición conservar `sequenceOrder` persistido; en alta temporal 999 hasta `reorderStopsArray`.
      sequenceOrder: existingStop?.sequenceOrder ?? editingStopIndex ?? 999,
      stopType: stopTypes,
      clientId: data.clientId || undefined,
      clientAddressId: data.clientAddressId || undefined,
      addressId: data.addressId?.trim() || undefined,
      locationName: data.locationName ?? "",
      // Campos Carta Porte (unificados - sin campos legacy)
      satCountryCode: data.satCountryCode || "MEX",
      satStateCode: data.satStateCode || "",
      satMunicipalityCode: data.satMunicipalityCode || "",
      postalCode: data.postalCode || "",
      satLocalityCode: data.satLocalityCode,
      cityName: data.cityName,
      satNeighborhoodCode: data.satNeighborhoodCode,
      neighborhoodName: data.neighborhoodName,
      street: data.street,
      exteriorNumber: data.exteriorNumber,
      interiorNumber: data.interiorNumber,
      reference: data.reference,
      rfcRemitenteDestinatario: data.rfcRemitenteDestinatario,
      nombreRemitenteDestinatario: data.nombreRemitenteDestinatario,
      deliveryRfcRemitenteDestinatario: data.deliveryRfcRemitenteDestinatario,
      deliveryNombreRemitenteDestinatario: data.deliveryNombreRemitenteDestinatario,
      remitentePartnerId: data.remitentePartnerId,
      destinatarioPartnerId: data.destinatarioPartnerId,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      notes: data.notes,
      estimatedArrival: data.estimatedArrival,
      distanceFromPreviousKm: data.distanceFromPreviousKm,
      distanceSource: data.distanceSource,
      distanceProvider: data.distanceProvider,
      distanceConfidence: data.distanceConfidence,
      distanceComputedAt: data.distanceComputedAt,
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
    }

    // Si es la parada de destino, sincronizar estimatedArrival → scheduledArrival
    if (data.stopCategory === "destination") {
      form.setValue("scheduledArrival", stopData.estimatedArrival ?? "", {
        shouldDirty: true,
      });
    }

    requestAnimationFrame(() => {
      if (wasNewStop) {
        reorderStopsArray();
      }
      void syncRouteDistancesFromApi(false);
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
        void syncRouteDistancesFromApi(false);
      });
    },
    [form, reorderStopsArray, syncRouteDistancesFromApi],
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

      requestAnimationFrame(() => {
        void syncRouteDistancesFromApi(false);
      });
    },
    [form, syncRouteDistancesFromApi],
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

      requestAnimationFrame(() => {
        void syncRouteDistancesFromApi(false);
      });

    setDraggedIndex(null);
  };

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // UI HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  const getStopTypeInfo = (type: string) => {
    const typeMap: Record<string, StopTypeValue> = {
      origin: StopType.ORIGIN,
      destination: StopType.DESTINATION,
      waypoint: StopType.WAYPOINT,
      pickup: StopType.PICKUP,
      delivery: StopType.DELIVERY,
    };
    const stopType = typeMap[type];
    if (stopType) {
      const config = getStopTypeConfig(stopType);
      return {
        label: config.label,
        color: getStopTypeBadgeClasses(stopType),
      };
    }
    return {
      label: type,
      color: "bg-muted text-muted-foreground",
    };
  };

  const getStopMissingFields = useCallback(
    (
      stop: TripStopFormValues,
      type: "origin" | "waypoint" | "destination",
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
        if (!stop.satCountryCode?.trim()) missing.push(LOCATION_CAPTURE_LABELS.country);
        if (!stop.satStateCode?.trim()) missing.push(LOCATION_CAPTURE_LABELS.state);
        if (!stop.satMunicipalityCode?.trim()) {
          missing.push(LOCATION_CAPTURE_LABELS.municipality);
        }
        if (!/^\d{5}$/.test(stop.postalCode?.trim() ?? "")) missing.push("CP");
      }

      if (stop.latitude == null || stop.longitude == null) {
        missing.push("geolocalización");
      }

      if (type === "destination" && !stop.estimatedArrival) {
        missing.push("hora llegada");
      }

      return missing;
    },
    [],
  );

  const guidanceSummary = useMemo(() => {
    const stops = form.getValues("stops") || [];
    const pendingActions: string[] = [];

    if (!hasOrigin) pendingActions.push(copy.action.addOrigin);
    if (!hasDestination) pendingActions.push(copy.action.addDestination);
    if (!hasWaypoints) pendingActions.push(copy.action.evaluateWaypoints);

    const incompleteCount = stops.reduce((count, stop, index) => {
      const stopType = stop.stopType ?? [];
      const type = stopType.includes(StopType.ORIGIN)
        ? "origin"
        : stopType.includes(StopType.DESTINATION)
          ? "destination"
          : "waypoint";
      const missing = getStopMissingFields(stop, type);
      if (missing.length > 0) {
        const label = stop.locationName || copy.format.stopHash(index + 1);
        pendingActions.push(copy.format.completeStop(label, missing.join(", ")));
        return count + 1;
      }
      return count;
    }, 0);

    const nextAction =
      pendingActions[0] ?? copy.action.routeReady;

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

    // Formatear dirección usando campos SAT (sin repetir locationName)
    const {
      streetLine: addressStreetLine,
      localityLine: addressLocalityLine,
      showNoAddress,
    } = formatWizardStopAddressDisplay(stop);
    const linkedCatalog = stopHasUnifiedAddressId(stop);
    const hasManualCp = hasManualSatPostalComplete(stop);
    const missingFields = getStopMissingFields(stop, type);
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
            "border-success/30 border-success/30 bg-success-soft/50",
          type === "destination" &&
            "border-destructive/30 border-destructive/30 bg-destructive-soft/50",
          type === "waypoint" && "border-border bg-card",
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
            <Navigation className="h-5 w-5 text-success" />
          )}
          {type === "waypoint" && (
            <MapPin className="h-5 w-5 text-muted-foreground" />
          )}
          {type === "destination" && <Flag className="h-5 w-5 text-destructive" />}
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
                      ? "border-success/30 text-success-soft-foreground"
                      : "border-warning/30 text-warning-soft-foreground",
                  )}
                >
                  {isComplete ? (
                    <CircleCheck className="mr-1 h-3 w-3" />
                  ) : (
                    <CircleDashed className="mr-1 h-3 w-3" />
                  )}
                  {isComplete ? "Completa" : "Pendiente"}
                </Badge>

                {/* Domicilio en catálogo vs captura manual */}
                {linkedCatalog && (
                  <Badge
                    variant="outline"
                    className="text-xs border-success/30 text-success-soft-foreground"
                    title={copy.hint.savedAddress}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Domicilio guardado
                  </Badge>
                )}
                {!linkedCatalog && hasManualCp && (
                  <Badge
                    variant="outline"
                    className="text-xs border-info/30 text-info"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Datos fiscales listos
                  </Badge>
                )}
                {index > 0 && stop.distanceFromPreviousKm != null ? (
                  <Badge variant="outline" className="text-xs font-normal">
                    {tripRouteCopy.format.distanceSegment(
                      formatDistanceSourceLabel(stop.distanceSource ?? null) ??
                        tripRouteCopy.label.distanceFallback,
                      stop.distanceFromPreviousKm.toLocaleString("es-MX"),
                    )}
                  </Badge>
                ) : null}

              </div>

              {/* Location Name */}
              {stop.locationName && (
                <p className="font-medium truncate mt-1">{stop.locationName}</p>
              )}

              {/* Address Display - basado en campos SAT */}
              {addressStreetLine ? (
                <p className="text-sm text-muted-foreground truncate">
                  {addressStreetLine}
                </p>
              ) : null}
              {addressLocalityLine ? (
                <p className="text-sm text-muted-foreground">
                  {addressLocalityLine}
                </p>
              ) : null}
              {showNoAddress ? (
                <p className="text-sm text-muted-foreground truncate">
                  {copy.label.noAddress}
                </p>
              ) : null}

              {/* Identificadores fiscales (manual o precargados desde domicilio guardado) */}
              {(linkedCatalog || hasManualCp) && (
                <p className="text-xs text-info mt-1">
                  Claves: {stop.satStateCode}-{stop.satMunicipalityCode}
                  {stop.postalCode && ` · CP ${stop.postalCode}`}
                </p>
              )}

              {!isComplete && (
                <p className="mt-1 text-xs text-warning-soft-foreground">
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
          "border-success/30 border-success/30 bg-success-soft/30",
        type === "waypoint" &&
          "border-dashed border-border bg-muted/30",
        type === "destination" &&
          "border-destructive/30 border-destructive/30 bg-destructive-soft/30",
      )}
    >
      <div
        className={cn(
          "mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3",
          type === "origin" && "bg-success-soft ",
          type === "waypoint" && "bg-muted",
          type === "destination" && "bg-destructive-soft ",
        )}
      >
        {icon}
      </div>
      <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
      <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => openAddDialog(type)}
        className={cn(
          type === "origin" &&
            "border-success/30 text-success-soft-foreground hover:bg-success-soft",
          type === "waypoint" &&
            "border-border hover:bg-muted",
          type === "destination" &&
            "border-destructive/30 text-destructive-soft-foreground hover:bg-destructive-soft",
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
              <SectionHeadingWithHint
                noTitleWrap
                title={<p className="text-sm font-medium">{copy.section.quickGuide}</p>}
                hintLabel={copy.section.quickGuide}
                hint={
                  <>
                    Resume qué falta para completar la ruta y sugiere la siguiente acción. Usa los botones de la derecha
                    para recalcular distancias o revisar paradas pendientes.
                  </>
                }
              />
              <p className="text-sm text-muted-foreground">
                Siguiente acción: {guidanceSummary.nextAction}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {showRecalculateMissingDistances ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={routeRecalcLoading}
                  onClick={() => fillMissingDistancesOnly()}
                >
                  Recalcular distancias faltantes
                </Button>
              ) : null}
              {routeRecalcLoading ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Actualizando distancias…
                </span>
              ) : null}
              <Badge variant="outline">{guidanceSummary.totalStops} paradas</Badge>
              <Badge
                variant="outline"
                className={cn(
                  guidanceSummary.incompleteCount > 0
                    ? "border-warning/30 text-warning-soft-foreground"
                    : "border-success/30 text-success-soft-foreground",
                )}
              >
                {guidanceSummary.incompleteCount > 0
                  ? copy.state.pendingCount(guidanceSummary.incompleteCount)
                  : copy.state.allComplete}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bloque ORIGEN */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Navigation className="h-5 w-5 text-success" />
            {copy.section.origin}
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
                copy.state.noOriginTitle,
                copy.state.noOriginHint,
                <Navigation className="h-6 w-6 text-success" />,
              )}
        </CardContent>
      </Card>

      {/* Bloque ESCALAS */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-5 w-5 text-muted-foreground" />
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
                copy.state.noWaypointsTitle,
                copy.state.noWaypointsHint,
              <MapPin className="h-6 w-6 text-muted-foreground" />,
            )
          )}
        </CardContent>
      </Card>

      {/* Bloque DESTINO */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Flag className="h-5 w-5 text-destructive" />
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
                copy.state.noDestinationTitle,
                copy.state.noDestinationHint,
                <Flag className="h-6 w-6 text-destructive" />,
              )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs dark:bg-muted/15">
        <SectionHeadingWithHint
          noTitleWrap
          title={
            <span className="font-medium text-muted-foreground">
              {copy.section.routeRules}
            </span>
          }
          hintLabel={copy.section.routeRules}
          hintContentClassName="max-w-sm text-left [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-4"
          hint={
            <>
              <span className="font-medium text-foreground">Resumen</span>
              <ul>
                <li>El viaje debe tener exactamente 1 origen y 1 destino</li>
                <li>Las escalas son opcionales y pueden ser múltiples</li>
                <li>Puede reordenar las escalas arrastrándolas o con los botones</li>
                <li>En el origen solo se permite carga; en el destino solo descarga</li>
                <li>En las escalas puede realizar carga, descarga o ambas</li>
                <li>
                  Los datos de país, estado, municipio y CP son obligatorios en captura manual
                </li>
                <li>
                  {cfdiDocumentIntent === "traslado"
                    ? copy.hint.trasladoFiscal
                    : copy.hint.ingresoFiscal}
                </li>
              </ul>
            </>
          }
        />
      </div>

      {/* Sheet lateral para agregar/editar parada */}
      <StopFormSheet
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
        cfdiDocumentIntent={cfdiDocumentIntent}
        tripContractingClientId={
          tripContractingClientId && tripContractingClientId !== "no-client"
            ? tripContractingClientId
            : undefined
        }
      />

      <AlertDialog
        open={overwriteManualDialogOpen}
        onOpenChange={setOverwriteManualDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sobrescribir distancias manuales</AlertDialogTitle>
            <AlertDialogDescription>
              Al cambiar la ruta, se recalcularán los kilómetros de todos los
              tramos (servidor con Mapbox cuando aplique; si falla, estimación
              local). Las distancias que capturaste manualmente se
              reemplazarán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              onClick={() => void syncRouteDistancesFromApi(true)}
            >
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default RouteStep;
