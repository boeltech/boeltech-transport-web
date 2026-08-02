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

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import type { UseFormReturn, UseFieldArrayReturn } from "react-hook-form";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Input } from "@shared/ui/input";
import {
  MapPin,
  Trash2,
  GripVertical,
  Navigation,
  Flag,
  ChevronUp,
  ChevronDown,
  Plus,
  CircleDashed,
  CircleCheck,
  Loader2,
  Ruler,
} from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import type { TripWizardFormValues, TripStopFormValues } from "./validation";
import { stopHasUnifiedAddressId } from "./validation";
import { LOCATION_CAPTURE_LABELS, ROUTE_CAPTURE_LABELS } from "./wizardCopy";
import { routeCopy as tripRouteCopy, wizardCopy } from "../../../copy";

const copy = wizardCopy.route;
import {
  applySegmentDistanceResultsToStops,
  buildRouteSegmentsForBatch,
  fillMissingDistancesFromCoordinates,
  hasManualSegmentDistances,
  hasMissingStopDistances,
} from "./stopDistanceHelpers";
import { decideSegmentDistanceApply } from "./routeDistanceSync";
import {
  CalculateSegmentsDistanceUseCase,
  createGeoProviderBundle,
} from "@shared/geolocation";
import { useToast } from "@shared/hooks";
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
import { estimateRoadDistanceKm } from "@shared/utils/geoUtils";

// ============================================================================
// TYPES
// ============================================================================

interface RouteStepProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<TripWizardFormValues, any, any>;
  stopsFieldArray: UseFieldArrayReturn<TripWizardFormValues, "stops">;
}

// ============================================================================
// SEGMENT DISTANCE CONNECTOR
// ============================================================================

interface SegmentDistanceConnectorProps {
  currentKm: number | undefined;
  onKmChange: (value: number | undefined) => void;
  onCalculate: () => void;
  calculating?: boolean;
}

function SegmentDistanceConnector({
  currentKm,
  onKmChange,
  onCalculate,
  calculating,
}: SegmentDistanceConnectorProps) {
  const externalValue = currentKm != null ? String(currentKm) : "";
  const [localValue, setLocalValue] = useState(externalValue);
  const [isFocused, setIsFocused] = useState(false);

  const displayValue = isFocused ? localValue : externalValue;

  const handleFocus = () => {
    setLocalValue(externalValue);
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseFloat(localValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onKmChange(parsed);
    } else if (localValue.trim() === "") {
      onKmChange(undefined);
    }
  };

  return (
    <div className="flex items-center gap-2 py-1 pl-10 pr-4">
      <div className="flex-1 flex items-center gap-2">
        <div className="h-px flex-1 border-t border-dashed border-border" />
        <Ruler className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <Input
          type="number"
          min={0}
          step="0.1"
          placeholder={copy.segment.placeholder}
          value={displayValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="h-7 w-20 text-xs text-center"
          aria-label={copy.segment.label}
        />
        <span className="text-xs text-muted-foreground">
          {copy.label.segmentKm}
        </span>
        <div className="h-px flex-1 border-t border-dashed border-border" />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 text-xs px-2"
        disabled={calculating}
        onClick={onCalculate}
      >
        {calculating ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          copy.action.calculateSegment
        )}
      </Button>
    </div>
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
  const originBranchId = form.watch("originBranchId");
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
  const [segmentCalculating, setSegmentCalculating] = useState<number | null>(
    null,
  );
  const routeDistanceSyncGenRef = useRef(0);

  const { toast } = useToast();

  const segmentsDistanceUseCase = useMemo(() => {
    const bundle = createGeoProviderBundle();
    return new CalculateSegmentsDistanceUseCase(bundle.distanceMatrixProvider);
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // REORDENAR ARRAY DE STOPS
  // ══════════════════════════════════════════════════════════════════════════

  const reorderStopsArray = useCallback(() => {
    const currentStops = form.getValues("stops");
    if (currentStops.length === 0) return;

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

    const reorderedStops: TripStopFormValues[] = [];

    if (origin) {
      reorderedStops.push(origin);
    }

    reorderedStops.push(...waypoints);

    if (destination) {
      reorderedStops.push(destination);
    }

    // Una parada sin origen/escala/destino en `stopType` no entra en el reordenamiento;
    // escribir el resultado la borraría sin aviso, así que se conserva el orden actual.
    if (reorderedStops.length !== currentStops.length) {
      console.warn(
        "[RouteStep] Reordenamiento omitido: hay paradas sin categoría reconocible",
      );
      return;
    }

    reorderedStops.forEach((stop, index) => {
      stop.sequenceOrder = index;
    });

    form.setValue("stops", reorderedStops, {
      shouldValidate: false,
      shouldDirty: true,
    });
  }, [form]);

  /**
   * Recalcula todos los tramos consecutivos vía API batch (Mapbox + fallback en servidor);
   * si falla la petición, el use case aplica Haversine local.
   * Generation token: solo la sync más reciente escribe / apaga loading.
   */
  const syncRouteDistancesFromApi = useCallback(
    async (confirmedOverwrite: boolean) => {
      const stops = form.getValues("stops") ?? [];
      if (stops.length < 2) return;

      if (!confirmedOverwrite && hasManualSegmentDistances(stops)) {
        setRouteRecalcLoading(false);
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

      const requestGeneration = ++routeDistanceSyncGenRef.current;
      setRouteRecalcLoading(true);
      try {
        const results = await segmentsDistanceUseCase.execute(segments);
        const latestStops = form.getValues("stops") ?? [];
        const decision = decideSegmentDistanceApply({
          requestGeneration,
          activeGeneration: routeDistanceSyncGenRef.current,
          snapshotStops: stops,
          latestStops,
          confirmedOverwrite,
        });

        if (decision.action === "discard_stale") {
          return;
        }

        if (decision.action === "requeue_geo_changed") {
          // Invalida este request para que `finally` no apague loading/diálogo
          // del sync (o del diálogo manual) que sigue a continuación.
          routeDistanceSyncGenRef.current += 1;
          setRouteRecalcLoading(false);
          void syncRouteDistancesFromApi(confirmedOverwrite);
          return;
        }

        if (decision.action === "discard_manual_changed") {
          toast({
            title: copy.toast.distanceAbortedManualTitle,
            description: copy.toast.distanceAbortedManualBody,
            variant: "warning",
          });
          return;
        }

        const updated = applySegmentDistanceResultsToStops(
          latestStops,
          stopIndices,
          results,
        );
        form.setValue("stops", updated, {
          shouldDirty: true,
          shouldValidate: true,
        });
      } catch {
        if (requestGeneration === routeDistanceSyncGenRef.current) {
          toast({
            title: copy.toast.distanceErrorTitle,
            description: copy.toast.distanceErrorBody,
            variant: "error",
          });
        }
      } finally {
        if (requestGeneration === routeDistanceSyncGenRef.current) {
          setRouteRecalcLoading(false);
          setOverwriteManualDialogOpen(false);
        }
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

    const initialEstimatedArrival =
      category === "destination"
        ? (form.getValues("scheduledArrival") ?? undefined)
        : undefined;

    const initialData: StopFormData = {
      stopCategory: category,
      stopType: defaultOperations as TripStopFormValues["stopType"],
      estimatedArrival: initialEstimatedArrival,
      previousStopLatitude: previousStop?.latitude ?? undefined,
      previousStopLongitude: previousStop?.longitude ?? undefined,
      previousStopLabel: previousStop?.label,
    };

    setDialogInitialData(initialData);
    setEditingStopIndex(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (index: number, category: StopCategory) => {
    const stop = form.getValues(`stops.${index}`);
    if (!stop) return;
    const previousStop =
      index > 0 ? form.getValues(`stops.${index - 1}`) : undefined;

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

    const existingStop =
      editingStopIndex !== null
        ? form.getValues(`stops.${editingStopIndex}`)
        : undefined;

    const stopTypes: TripStopFormValues["stopType"] = [
      data.stopCategory as StopTypeValue,
      ...data.stopType.filter((t) => t !== data.stopCategory),
    ];

    const stopData: TripStopFormValues = {
      ...(existingStop?.id ? { id: existingStop.id } : {}),
      sequenceOrder: existingStop?.sequenceOrder ?? editingStopIndex ?? 999,
      stopType: stopTypes,
      clientId: data.clientId || undefined,
      clientAddressId: data.clientAddressId || undefined,
      addressId: data.addressId?.trim() || undefined,
      locationName: data.locationName ?? "",
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
      form.setValue(`stops.${editingStopIndex}`, stopData, {
        shouldValidate: false,
        shouldDirty: true,
      });
    } else {
      const currentStops = form.getValues("stops") || [];
      form.setValue("stops", [...currentStops, stopData]);
    }

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

      const updatedStops = [...currentStops];
      const temp = updatedStops[currentIndex];
      updatedStops[currentIndex] = updatedStops[targetIndex];
      updatedStops[targetIndex] = temp;

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
  // SEGMENT DISTANCE HANDLER
  // ══════════════════════════════════════════════════════════════════════════

  const handleSegmentKmChange = useCallback(
    (index: number, value: number | undefined) => {
      form.setValue(`stops.${index}.distanceFromPreviousKm`, value, {
        shouldDirty: true,
      });
      if (value != null) {
        form.setValue(`stops.${index}.distanceSource`, "manual", {
          shouldDirty: true,
        });
      }
    },
    [form],
  );

  const handleCalculateSegment = useCallback(
    (index: number) => {
      const stops = form.getValues("stops") ?? [];
      if (index <= 0 || index >= stops.length) return;

      const prev = stops[index - 1];
      const current = stops[index];

      const km = estimateRoadDistanceKm(
        prev.latitude,
        prev.longitude,
        current.latitude,
        current.longitude,
      );

      if (km == null) {
        toast({
          title: copy.toast.insufficientCoordinatesTitle,
          description: copy.toast.insufficientCoordinatesBody,
          variant: "warning",
        });
        return;
      }

      setSegmentCalculating(index);
      form.setValue(`stops.${index}.distanceFromPreviousKm`, km, {
        shouldDirty: true,
      });
      form.setValue(`stops.${index}.distanceSource`, "haversine_fallback", {
        shouldDirty: true,
      });
      setTimeout(() => setSegmentCalculating(null), 300);
    },
    [form, toast],
  );

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
      stopIndex: number,
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
        if (!/^\d{5}$/.test(stop.postalCode?.trim() ?? "")) missing.push("CP");
      }

      if (stop.latitude == null || stop.longitude == null) {
        missing.push(ROUTE_CAPTURE_LABELS.geolocation);
      }

      if (
        stopIndex > 0 &&
        stop.distanceFromPreviousKm === undefined &&
        stop.distanceFromPreviousKm !== 0
      ) {
        missing.push(ROUTE_CAPTURE_LABELS.distanceFromPrevious);
      }

      if (type === "destination" && !stop.estimatedArrival) {
        missing.push("hora llegada");
      }

      return missing;
    },
    [],
  );

  // ══════════════════════════════════════════════════════════════════════════
  // STATUS SUMMARY (D4 compact status line)
  // ══════════════════════════════════════════════════════════════════════════

  const statusSummary = useMemo(() => {
    // Se lee del valor observado: con `getValues` la línea quedaba congelada
    // hasta que cambiaba el número de paradas (p. ej. tras calcular distancias).
    const stops = watchedStops ?? [];

    const getStopStatus = (
      index: number,
      type: "origin" | "waypoint" | "destination",
    ): "listo" | "pendiente" | "vacío" => {
      if (index === -1) return "vacío";
      const stop = stops[index];
      if (!stop) return "vacío";
      const missing = getStopMissingFields(stop, type, index);
      return missing.length === 0 ? "listo" : "pendiente";
    };

    const originStatus = getStopStatus(originIndex, "origin");
    const destinationStatus = getStopStatus(destinationIndex, "destination");

    const incompleteCount = stops.reduce((count, stop, index) => {
      const stopType = stop.stopType ?? [];
      const type = stopType.includes(StopType.ORIGIN)
        ? "origin"
        : stopType.includes(StopType.DESTINATION)
          ? "destination"
          : "waypoint";
      const missing = getStopMissingFields(stop, type, index);
      return missing.length > 0 ? count + 1 : count;
    }, 0);

    return {
      line: copy.format.statusSummary({
        origin: originStatus,
        waypoints: waypointIndices.length,
        destination: destinationStatus,
      }),
      incompleteCount,
      totalStops: stops.length,
    };
  }, [
    watchedStops,
    getStopMissingFields,
    originIndex,
    destinationIndex,
    waypointIndices.length,
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // ORDERED STOPS (for timeline rendering with connectors)
  // ══════════════════════════════════════════════════════════════════════════

  const orderedStopIndices = useMemo(() => {
    const indices: { index: number; type: "origin" | "waypoint" | "destination" }[] = [];
    if (hasOrigin) indices.push({ index: originIndex, type: "origin" });
    for (const wi of waypointIndices) {
      indices.push({ index: wi, type: "waypoint" });
    }
    if (hasDestination) indices.push({ index: destinationIndex, type: "destination" });
    return indices;
  }, [hasOrigin, originIndex, waypointIndices, hasDestination, destinationIndex]);

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

    const {
      streetLine: addressStreetLine,
      localityLine: addressLocalityLine,
      showNoAddress,
    } = formatWizardStopAddressDisplay(stop);
    const linkedCatalog = stopHasUnifiedAddressId(stop);
    const missingFields = getStopMissingFields(stop, type, index);
    const isComplete = missingFields.length === 0;
    const primaryCtaLabel = isComplete ? copy.action.edit : copy.action.complete;

    const operationChips = isWaypoint
      ? stop.stopType.filter(
          (t) =>
            t !== StopType.ORIGIN &&
            t !== StopType.DESTINATION &&
            t !== StopType.WAYPOINT,
        )
      : [];

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
              {/* Badges: operation chips for waypoints only + status + saved address */}
              <div className="flex flex-wrap items-center gap-1">
                {isWaypoint &&
                  operationChips.map((stopType) => {
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
                  {isComplete ? copy.state.ready : copy.state.pending}
                </Badge>

                {linkedCatalog && (
                  <Badge
                    variant="outline"
                    className="text-xs border-success/30 text-success-soft-foreground"
                    title={tripRouteCopy.label.savedAddress}
                  >
                    {tripRouteCopy.label.savedAddress}
                  </Badge>
                )}
              </div>

              {/* Location Name */}
              {stop.locationName && (
                <p className="font-medium truncate mt-1">{stop.locationName}</p>
              )}

              {/* Address Display */}
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
        onClick={() => void openAddDialog(type)}
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

  /** Conector de kilómetros: solo cuando la parada tiene otra antes en el timeline. */
  const renderSegmentConnector = (index: number) => {
    const position = orderedStopIndices.findIndex(
      (entry) => entry.index === index,
    );
    if (position <= 0) return null;
    const stop = watchedStops?.[index];
    if (!stop) return null;

    return (
      <SegmentDistanceConnector
        currentKm={stop.distanceFromPreviousKm}
        onKmChange={(val) => handleSegmentKmChange(index, val)}
        onCalculate={() => handleCalculateSegment(index)}
        calculating={segmentCalculating === index}
      />
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-4">
      {/* D4: Compact status line */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <p className="text-sm text-muted-foreground">{statusSummary.line}</p>
        <div className="flex items-center gap-2">
          {showRecalculateMissingDistances && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={routeRecalcLoading}
              onClick={() => fillMissingDistancesOnly()}
            >
              Calcular tramos faltantes
            </Button>
          )}
          {routeRecalcLoading && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Actualizando distancias…
            </span>
          )}
          {statusSummary.incompleteCount > 0 && (
            <Badge
              variant="outline"
              className="border-warning/30 text-warning-soft-foreground"
            >
              {copy.state.pendingCount(statusSummary.incompleteCount)}
            </Badge>
          )}
        </div>
      </div>

      {/* D4: Timeline layout — Origen */}
      <div>
        <h3 className="flex items-center gap-2 text-sm font-medium mb-2 px-1">
          <Navigation className="h-4 w-4 text-success" />
          {copy.section.origin}
        </h3>
        {hasOrigin
          ? renderStopCard(originIndex, "origin")
          : renderEmptyBlock(
              "origin",
              copy.state.noOriginTitle,
              copy.state.noOriginHint,
              <Navigation className="h-6 w-6 text-success" />,
            )}
      </div>

      {/* D4: Timeline layout — Escalas */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {copy.section.waypoints}
            {hasWaypoints && (
              <span className="text-xs font-normal text-muted-foreground">
                ({waypointIndices.length}{" "}
                {waypointIndices.length === 1 ? "parada" : "paradas"})
              </span>
            )}
          </h3>
          {hasWaypoints && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void openAddDialog("waypoint")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Escala
            </Button>
          )}
        </div>
        {hasWaypoints
          ? waypointIndices.map((index) => (
              <div key={`waypoint-${fields[index]?.id ?? index}`}>
                {renderSegmentConnector(index)}
                {renderStopCard(index, "waypoint")}
              </div>
            ))
          : renderEmptyBlock(
              "waypoint",
              copy.state.noWaypointsTitle,
              copy.state.noWaypointsHint,
              <MapPin className="h-6 w-6 text-muted-foreground" />,
            )}
      </div>

      {/* D4: Timeline layout — Destino */}
      <div>
        <h3 className="flex items-center gap-2 text-sm font-medium mb-2 px-1">
          <Flag className="h-4 w-4 text-destructive" />
          {copy.section.destination}
        </h3>
        {hasDestination ? (
          <>
            {renderSegmentConnector(destinationIndex)}
            {renderStopCard(destinationIndex, "destination")}
          </>
        ) : (
          renderEmptyBlock(
            "destination",
            copy.state.noDestinationTitle,
            copy.state.noDestinationHint,
            <Flag className="h-6 w-6 text-destructive" />,
          )
        )}
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
        originBranchId={originBranchId?.trim() || undefined}
      />

      <AlertDialog
        open={overwriteManualDialogOpen}
        onOpenChange={setOverwriteManualDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.segment.overwriteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.segment.overwriteBody}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.segment.overwriteCancel}</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              onClick={() => void syncRouteDistancesFromApi(true)}
            >
              {copy.segment.overwriteConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default RouteStep;
