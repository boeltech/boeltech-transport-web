import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Navigation } from "lucide-react";

import { Badge } from "@shared/ui/badge";

import {
  useClientCorridors,
  useReplaceTripStops,
  useReplanTripStops,
} from "@features/trips/application";
import {
  shouldFlagFiscalAttentionAfterTripMutation,
  type ClientCorridor,
  type CreateStopInput,
  type Trip,
  type TripCargo,
  type TripStatusType,
  type TripStop,
} from "@features/trips/domain";
import { useToast } from "@shared/hooks";
import type { AddressSearchListItem } from "@shared/ui/address-picker/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { EmptyState } from "@shared/ui/feedback-states";
import { FormValidationSummary } from "@shared/ui/form";

import {
  addressSearchItemToDialogSlice,
  dialogToStopFormData,
  getEmptyStopDialogValues,
  type StopFormData,
} from "../../pages/create/components/stopDialogAddressMapper";
import { mapStopToReplaceStopInput } from "../trip-detail-patch/mapStopToCreateStopInput";
import { CorridorPicker } from "../corridor/CorridorPicker";
import { filterCorridorsMatchingCityPair } from "./corridorMatchesCityPair";
import { resolveRouteSearchProximity } from "./resolveRouteSearchProximity";
import { TripDetailRouteStopCard } from "./TripDetailRouteStopCard";
import { TripRouteComposer, TripRouteSlotCapture } from "./TripRouteComposer";
import { TripRouteDistancesCard } from "./TripRouteDistancesCard";
import { TripRouteMapPanel } from "./TripRouteMapPanel";
import { TripRouteTimeline } from "./TripRouteTimeline";
import { TripRouteUnsavedBar } from "./TripRouteUnsavedBar";
import { TripStopSearchConfirmSheet } from "./TripStopSearchConfirmSheet";
import {
  buildReplanAfterRemoveWaypoint,
  buildReplanAfterReorderWaypoint,
  toReplanPendingStops,
  type ReplanPendingStopInput,
} from "./buildReplanStopsPayload";
import { isTripStopImmutableMidTrip } from "./isStopImmutableMidTrip";
import {
  buildRouteDistanceSegments,
  buildRouteMasterRows,
  countFillableMissingSegmentDistances,
  countStopsMissingDomicilio,
  countStopsMissingSegmentDistance,
  getRouteStopCategory,
  groupStopsForRouteDetail,
  isDraftWaypointSlotId,
  isStopDomicilioComplete,
  resolveRouteMasterRowId,
  ROUTE_SLOT_DESTINATION_ID,
  ROUTE_SLOT_ORIGIN_ID,
  ROUTE_SLOT_WAYPOINT_PREFIX,
  stopHasLinkedCargoMovements,
  sumRouteSegmentDistanceKm,
  type RouteStopCategory,
} from "./tripRouteDetailHelpers";
import {
  areComposerEndpointDraftsPutReady,
  buildReplaceStopsPayload,
  canPersistComposerStops,
  composerStopTypes,
  type ComposerEndpointDraft,
  type ComposerEndpointPick,
  type ComposerWaypointOperations,
  finalizeReplaceStopsPayload,
  isComposerPickPutReady,
  isDuplicateComposerEndpointAddress,
  mapTripStopToStopFormData,
  mergeComposerEndpointDraft,
  pickerItemLabel,
  removeWaypointFromReplaceStopsPayload,
  replaceStopsFromCorridor,
  stopFormDataToComposerEndpointPick,
  upsertComposerStop,
} from "./buildReplaceStopsPayload";
import { tripDetailCopy } from "../../copy";

const copy = tripDetailCopy.route;

type RemoveWaypointDialog =
  | { kind: "confirm"; stopId: string }
  | { kind: "blocked"; stopId: string };

type CompleteTarget =
  | { kind: "edit"; stopId: string }
  | {
      kind: "create";
      category: RouteStopCategory;
      locationName?: string;
      cityName?: string;
      /** Prefill desde Location create-new / pick incompleto. */
      prefill?: StopFormData;
      /** F9b — Completar / pick → confirm; captura vacía puede abrir en search. */
      initialStep?: "search" | "confirm";
    };

function composerPickToStopFormData(
  category: RouteStopCategory,
  pick: ComposerEndpointPick,
  cityHint?: string,
): StopFormData {
  const slice = addressSearchItemToDialogSlice(pick);
  return {
    ...dialogToStopFormData({
      ...getEmptyStopDialogValues(),
      ...slice,
      stopCategory: category,
      stopType: composerStopTypes(category),
      cityName: cityHint?.trim() || slice.cityName || "",
      locationName:
        pick.locationName?.trim() || slice.locationName || "",
    }),
    stopCategory: category,
    stopType: composerStopTypes(category),
  };
}

export interface TripDetailRouteTabProps {
  trip: Trip;
  tripStatus: TripStatusType;
  orderedStops: TripStop[];
  progress: number;
  canEditStructural: boolean;
  /** ADR-0093 E1 — replan pending mid-trip (`PUT …/stops:replan`). */
  canReplanPendingStops?: boolean;
  /**
   * @deprecated E1 — no usar como gate de Tab Ruta mid-trip.
   */
  canAppendStops?: boolean;
  cargos?: TripCargo[];
  legacyRoute?: {
    originCity?: string | null;
    originState?: string | null;
    destinationCity?: string | null;
    destinationState?: string | null;
  };
  /** D44 — avisa al shell cuando hay edición/panel local abierto. */
  onEditingChange?: (editing: boolean) => void;
}

function getDisplayOrder(stop: TripStop, ordered: readonly TripStop[]): number {
  const index = ordered.findIndex((item) => item.id === stop.id);
  return index >= 0 ? index + 1 : stop.sequenceOrder;
}

function stopDisplayLabel(stop: TripStop): string {
  return stop.locationName?.trim() || stop.city?.trim() || stop.address?.trim() || "";
}

function panelRoleLabel(category: RouteStopCategory): string {
  if (category === "origin") return copy.panel.roleOrigin;
  if (category === "destination") return copy.panel.roleDestination;
  return copy.panel.roleWaypoint;
}

/** Ctx artboard: índice/total de la parada que abre el Sheet de alta/confirmación. */
function resolvePanelStopPosition(args: {
  completeTarget: CompleteTarget;
  ordered: readonly TripStop[];
  editingStop: TripStop | undefined;
  hasOrigin: boolean;
  hasDestination: boolean;
  waypointCount: number;
}): { index: number; total: number; role: string } {
  const {
    completeTarget,
    ordered,
    editingStop,
    hasOrigin,
    hasDestination,
    waypointCount,
  } = args;

  if (completeTarget.kind === "edit") {
    if (editingStop) {
      const category = getRouteStopCategory(editingStop);
      return {
        index: getDisplayOrder(editingStop, ordered),
        total: Math.max(ordered.length, 1),
        role: panelRoleLabel(category),
      };
    }
    return {
      index: 1,
      total: Math.max(ordered.length, 1),
      role: copy.panel.roleDestination,
    };
  }

  const category = completeTarget.category;
  const role = panelRoleLabel(category);
  const countsOrigin = hasOrigin || category === "origin";
  const countsDestination = hasDestination || category === "destination";
  let total =
    (countsOrigin ? 1 : 0) + waypointCount + (countsDestination ? 1 : 0);
  if (category !== "waypoint" && waypointCount === 0) {
    total = Math.max(total, 2);
  }
  total = Math.max(total, 1);

  let index = 1;
  if (category === "origin") {
    index = 1;
  } else if (category === "waypoint") {
    index = (hasOrigin ? 1 : 0) + Math.max(waypointCount, 1);
  } else {
    index = (hasOrigin ? 1 : 0) + waypointCount + 1;
  }
  return { index: Math.min(index, total), total, role };
}

export function TripDetailRouteTab({
  trip,
  tripStatus,
  orderedStops,
  canEditStructural,
  canReplanPendingStops = false,
  cargos,
  legacyRoute,
  onEditingChange,
}: TripDetailRouteTabProps) {
  const { toast } = useToast();
  const replaceStops = useReplaceTripStops(trip.id);
  const replanStops = useReplanTripStops(trip.id);
  const showMidTripReplan = canReplanPendingStops && !canEditStructural;
  const canMutateRoute = canEditStructural || showMidTripReplan;
  const corridorsQuery = useClientCorridors(
    canEditStructural && orderedStops.length === 0
      ? (trip.clientId ?? undefined)
      : undefined,
  );
  const [completeTarget, setCompleteTarget] = useState<CompleteTarget | null>(null);
  const [endpointDraft, setEndpointDraft] = useState<ComposerEndpointDraft>({});
  const [waypointDraftIds, setWaypointDraftIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [removeDialog, setRemoveDialog] = useState<RemoveWaypointDialog | null>(
    null,
  );
  const [fiscalConfirmOpen, setFiscalConfirmOpen] = useState(false);
  const [changingDestination, setChangingDestination] = useState(false);
  const pendingPersistRef = useRef<{
    execute: () => Promise<boolean>;
    syncKey: string;
  } | null>(null);

  const isRouteMutationPending =
    replaceStops.isPending || replanStops.isPending;

  const needsFiscalConfirm = shouldFlagFiscalAttentionAfterTripMutation({
    invoiceStatus: trip.invoicing?.invoiceStatus ?? null,
    mutationKind: "stop_replan",
  });

  const stopsSyncKey = useMemo(
    () => orderedStops.map((stop) => stop.id).join("|"),
    [orderedStops],
  );
  const prevStopsSyncKeyRef = useRef(stopsSyncKey);
  useEffect(() => {
    if (prevStopsSyncKeyRef.current === stopsSyncKey) return;
    prevStopsSyncKeyRef.current = stopsSyncKey;
    setEndpointDraft({});
    setWaypointDraftIds([]);
    setChangingDestination(false);
  }, [stopsSyncKey]);

  const { origin, destination, waypoints, ordered } =
    groupStopsForRouteDetail(orderedStops);

  const originCityHint =
    trip.originCity?.trim() || legacyRoute?.originCity?.trim() || "";
  const destinationCityHint =
    trip.destinationCity?.trim() || legacyRoute?.destinationCity?.trim() || "";

  const composerOriginLabel = origin
    ? stopDisplayLabel(origin)
    : endpointDraft.origin
      ? pickerItemLabel(endpointDraft.origin)
      : null;
  const composerDestinationLabel = destination
    ? stopDisplayLabel(destination)
    : endpointDraft.destination
      ? pickerItemLabel(endpointDraft.destination)
      : null;

  const masterRows = buildRouteMasterRows({
    origin,
    destination,
    waypoints,
    originDraftLabel: composerOriginLabel,
    destinationDraftLabel: composerDestinationLabel,
    originCityHint: originCityHint || null,
    destinationCityHint: destinationCityHint || null,
    waypointDraftIds,
  }).map((row) => ({
    ...row,
    locked:
      showMidTripReplan &&
      row.stop != null &&
      isTripStopImmutableMidTrip(row.stop),
  }));
  const masterRowIds = masterRows.map((row) => row.id).join("|");
  /** D-R1/D-R3 — Operate solo con ambos extremos; composer si falta origen o destino. */
  const hasBothPersistedEndpoints = Boolean(origin && destination);
  const hasAnyPersistedStop = orderedStops.length > 0;
  const resolvedViewId = useMemo(() => {
    // Legacy N=1 / tras capturar un extremo: preferir el slot vacío accionable.
    const preferred =
      selectedId ??
      (origin && !destination
        ? ROUTE_SLOT_DESTINATION_ID
        : !origin && destination
          ? ROUTE_SLOT_ORIGIN_ID
          : null);
    return resolveRouteMasterRowId(masterRows, preferred);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- masterRowIds cubre la identidad de las filas
  }, [masterRowIds, selectedId, origin?.id, destination?.id]);
  const selectedRow =
    masterRows.find((row) => row.id === resolvedViewId) ?? null;
  const selectedLocked = Boolean(selectedRow?.locked);

  const editingStop =
    completeTarget?.kind === "edit"
      ? orderedStops.find((stop) => stop.id === completeTarget.stopId)
      : selectedRow?.stop;
  const previousStop = editingStop
    ? orderedStops[orderedStops.findIndex((stop) => stop.id === editingStop.id) - 1]
    : orderedStops[orderedStops.length - 1];

  const mutableWaypoints = orderedStops.filter(
    (stop) =>
      getRouteStopCategory(stop) === "waypoint" &&
      !isTripStopImmutableMidTrip(stop),
  );

  const hasEndpointDraft = Boolean(
    endpointDraft.origin || endpointDraft.destination,
  );
  const hasWaypointDraft = waypointDraftIds.length > 0;
  const hasLocalDraft = hasEndpointDraft || hasWaypointDraft;
  const isEditingLocally = hasLocalDraft || completeTarget != null;

  useEffect(() => {
    onEditingChange?.(isEditingLocally);
    return () => onEditingChange?.(false);
  }, [isEditingLocally, onEditingChange]);

  const hasOriginEnd = Boolean(origin || endpointDraft.origin);
  const hasDestinationEnd = Boolean(destination || endpointDraft.destination);
  const canAddWaypoint = hasOriginEnd && hasDestinationEnd;

  const unsavedSummary = (() => {
    if (hasEndpointDraft && hasWaypointDraft) {
      return copy.unsaved.draftMixed(waypointDraftIds.length);
    }
    if (hasWaypointDraft) return copy.unsaved.draftWaypoint;
    if (hasEndpointDraft) return copy.unsaved.draftEndpoints;
    return "";
  })();

  const canSaveLocalDraft =
    hasEndpointDraft &&
    canPersistComposerStops(
      mergeComposerEndpointDraft({
        existingStops: orderedStops,
        draft: endpointDraft,
      }),
    ) &&
    areComposerEndpointDraftsPutReady(endpointDraft, orderedStops);

  const handleDiscardLocalDraft = () => {
    setEndpointDraft({});
    setWaypointDraftIds([]);
    setCompleteTarget(null);
    setCaptureError(null);
    setSelectedId(null);
    setChangingDestination(false);
  };

  const runReplace = async (stops: CreateStopInput[]) => {
    if (replaceStops.isPending) return false;
    try {
      // Q17 — distancias vía finalizeReplaceStopsPayload (misma que «Calcular distancias»).
      // Si no se pueden rellenar, la ruta igual queda; el aviso «Faltan distancias» + CTA.
      await replaceStops.mutateAsync(finalizeReplaceStopsPayload(stops));
      toast({ title: copy.toast.stopsSaved, variant: "success" });
      setEndpointDraft({});
      setCaptureError(null);
      return true;
    } catch (error) {
      toast({
        title: copy.toast.stopSaveError,
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
      return false;
    }
  };

  const runReplan = async (
    pendingStops: ReplanPendingStopInput[],
    toastTitle: string = copy.toast.stopsSaved,
  ) => {
    if (replanStops.isPending) return false;
    try {
      await replanStops.mutateAsync(pendingStops);
      toast({ title: toastTitle, variant: "success" });
      setEndpointDraft({});
      setCaptureError(null);
      return true;
    } catch (error) {
      toast({
        title: copy.toast.stopSaveError,
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
      return false;
    }
  };

  const persistRouteChange = async (
    execute: () => Promise<boolean>,
  ): Promise<boolean> => {
    if (showMidTripReplan && needsFiscalConfirm) {
      pendingPersistRef.current = { execute, syncKey: stopsSyncKey };
      setFiscalConfirmOpen(true);
      return false;
    }
    return execute();
  };

  const persistStops = async (
    stops: CreateStopInput[],
    options?: { editingStopId?: string | null },
  ) => {
    if (showMidTripReplan) {
      const pending = toReplanPendingStops({
        next: stops,
        existing: orderedStops,
        editingStopId: options?.editingStopId,
      });
      return persistRouteChange(() => runReplan(pending));
    }
    return runReplace(stops);
  };

  const handleSaveLocalDraft = () => {
    if (!canSaveLocalDraft) return;
    const stops = mergeComposerEndpointDraft({
      existingStops: orderedStops,
      draft: endpointDraft,
    });
    void persistStops(stops).then((ok) => {
      if (ok) {
        setEndpointDraft({});
        setWaypointDraftIds([]);
      }
    });
  };

  const handleCalculateDistances = () => {
    void persistStops(
      finalizeReplaceStopsPayload(
        ordered.map((stop) => mapStopToReplaceStopInput(stop)),
      ),
    );
  };

  const handleSelectRow = (id: string) => {
    setSelectedId(id);
    setCompleteTarget(null);
    setCaptureError(null);
    setChangingDestination(false);
  };

  const handleChangeDestination = (stop: TripStop) => {
    setSelectedId(stop.id);
    setChangingDestination(true);
    setCompleteTarget(null);
    setCaptureError(null);
  };

  const handlePick = (
    category: RouteStopCategory,
    item: AddressSearchListItem,
    waypointOperations?: ComposerWaypointOperations,
  ) => {
    if (category === "origin" || category === "destination") {
      if (
        isDuplicateComposerEndpointAddress({
          category,
          catalogAddressId: item.id,
          existingStops: orderedStops,
          draft: endpointDraft,
        })
      ) {
        setCaptureError(copy.composer.duplicateEndpointAddress);
        return;
      }
    }

    if (category === "waypoint") {
      const withEndpoints = mergeComposerEndpointDraft({
        existingStops: orderedStops,
        draft: endpointDraft,
      });
      if (!canPersistComposerStops(withEndpoints) && orderedStops.length < 2) {
        setCaptureError(copy.composer.needBothEnds);
        return;
      }
      if (!waypointOperations?.pickup && !waypointOperations?.delivery) {
        setCaptureError(copy.composer.waypointOperationRequired);
        return;
      }
      const draftId = selectedRow?.id;
      void persistStops(
        upsertComposerStop({
          existingStops: orderedStops,
          category,
          item,
          waypointOperations,
        }),
      ).then((ok) => {
        if (ok && draftId && isDraftWaypointSlotId(draftId)) {
          setWaypointDraftIds((ids) => ids.filter((id) => id !== draftId));
        }
      });
      return;
    }

    const pick = item as ComposerEndpointPick;
    const nextDraft: ComposerEndpointDraft = {
      ...endpointDraft,
      [category]: pick,
    };
    // H1: always keep draft before any PUT attempt (survives remount / failed mutate).
    setEndpointDraft(nextDraft);
    setCaptureError(null);
    if (category === "destination") {
      setChangingDestination(false);
    }

    const openCompleteFromPick = (targetCategory: "origin" | "destination") => {
      const targetPick =
        targetCategory === "origin" ? nextDraft.origin : nextDraft.destination;
      if (!targetPick) return;
      const cityHint =
        targetCategory === "origin" ? originCityHint : destinationCityHint;
      setCompleteTarget({
        kind: "create",
        category: targetCategory,
        locationName: targetPick.locationName?.trim() || undefined,
        cityName: cityHint || undefined,
        prefill: composerPickToStopFormData(
          targetCategory,
          targetPick,
          cityHint || undefined,
        ),
        initialStep: "confirm",
      });
    };

    // F9b D58/D68 — en alta, todo pick de extremo abre el panel Confirmar
    // (sin LocationSheet ADR-0092 ni PUT directo desde Buscar).
    if (canEditStructural) {
      openCompleteFromPick(category);
      return;
    }

    const pickReady = isComposerPickPutReady(pick);
    const stops = mergeComposerEndpointDraft({
      existingStops: orderedStops,
      draft: nextDraft,
    });

    if (!canPersistComposerStops(stops)) {
      toast({
        title: pickReady
          ? category === "origin"
            ? copy.composer.pendingOriginSaved
            : copy.composer.pendingDestinationSaved
          : category === "origin"
            ? copy.composer.pendingOriginIncomplete
            : copy.composer.pendingDestinationIncomplete,
        variant: "default",
      });
      if (!pickReady) {
        openCompleteFromPick(category);
      } else if (category === "origin") {
        // D-R3 — destino accionable con LocationField; no publicar timeline.
        setSelectedId(ROUTE_SLOT_DESTINATION_ID);
      } else if (category === "destination") {
        setSelectedId(ROUTE_SLOT_ORIGIN_ID);
      }
      return;
    }

    if (!areComposerEndpointDraftsPutReady(nextDraft, orderedStops)) {
      toast({
        title: copy.composer.needCompleteAddressToSave,
        variant: "default",
      });
      const incompleteCategory: "origin" | "destination" = !pickReady
        ? category
        : nextDraft.origin && !isComposerPickPutReady(nextDraft.origin)
          ? "origin"
          : "destination";
      openCompleteFromPick(incompleteCategory);
      return;
    }

    void persistStops(stops);
  };

  const handleCorridorSelect = (corridor: ClientCorridor) => {
    setCaptureError(null);
    void persistStops(replaceStopsFromCorridor(corridor));
  };

  const handleAddWaypoint = () => {
    if (!origin || !destination) {
      setCaptureError(copy.composer.needBothEnds);
      return;
    }
    const id = `${ROUTE_SLOT_WAYPOINT_PREFIX}${crypto.randomUUID()}`;
    // Un solo draft de escala a la vez: evita apilar filas «Sin domicilio»
    // si el usuario reintenta sin confirmar operación/domicilio.
    setWaypointDraftIds([id]);
    setSelectedId(id);
    setCompleteTarget(null);
    setCaptureError(null);
  };

  const handleRemoveDraftWaypoint = (draftId: string) => {
    setWaypointDraftIds((ids) => ids.filter((id) => id !== draftId));
    setSelectedId((prev) => (prev === draftId ? null : prev));
    setCaptureError(null);
  };

  const handleRequestRemoveWaypoint = (stop: TripStop) => {
    if (stopHasLinkedCargoMovements(stop, ordered, cargos)) {
      setRemoveDialog({ kind: "blocked", stopId: stop.id });
      return;
    }
    setRemoveDialog({ kind: "confirm", stopId: stop.id });
  };

  const handleConfirmRemoveWaypoint = async () => {
    if (!removeDialog || removeDialog.kind !== "confirm") return;
    if (isRouteMutationPending) return;
    const stopId = removeDialog.stopId;
    setRemoveDialog(null);

    const execute = async () => {
      if (showMidTripReplan) {
        const pending = buildReplanAfterRemoveWaypoint(orderedStops, stopId);
        const ok = await runReplan(pending, copy.toast.waypointRemoved);
        if (ok) {
          setSelectedId((prev) => (prev === stopId ? null : prev));
          setCompleteTarget(null);
          setCaptureError(null);
        }
        return ok;
      }
      try {
        const stops = removeWaypointFromReplaceStopsPayload(orderedStops, stopId);
        await replaceStops.mutateAsync(stops);
        toast({ title: copy.toast.waypointRemoved, variant: "success" });
        setSelectedId((prev) => (prev === stopId ? null : prev));
        setCompleteTarget(null);
        setCaptureError(null);
        return true;
      } catch (error) {
        toast({
          title: copy.toast.stopSaveError,
          description: error instanceof Error ? error.message : undefined,
          variant: "error",
        });
        return false;
      }
    };

    await persistRouteChange(execute);
  };

  const handleReorderWaypoint = (
    stop: TripStop,
    direction: "up" | "down",
  ) => {
    if (!canReplanPendingStops || isRouteMutationPending) return;
    const pending = buildReplanAfterReorderWaypoint(
      orderedStops,
      stop.id,
      direction,
    );
    if (!pending) return;
    void persistRouteChange(() => runReplan(pending));
  };

  const openStopForm = (stop: TripStop) => {
    if (showMidTripReplan && isTripStopImmutableMidTrip(stop)) return;
    setSelectedId((prev) => prev ?? stop.id);
    setCompleteTarget({ kind: "edit", stopId: stop.id });
  };

  const openCompleteLabel = (category: RouteStopCategory, locationName: string) => {
    const cityHint =
      category === "origin"
        ? originCityHint
        : category === "destination"
          ? destinationCityHint
          : "";
    setCompleteTarget({
      kind: "create",
      category,
      locationName,
      cityName: cityHint || undefined,
      initialStep: "confirm",
    });
  };

  /** F8c — AmbosCiudad / RutaPrecargada: Elegir lugar → Sheet F9c Buscar. */
  const openChoosePlace = (rowId: string) => {
    const row = masterRows.find((item) => item.id === rowId);
    if (!row || row.stop) return;
    if (row.category !== "origin" && row.category !== "destination") return;
    const cityHint =
      row.category === "origin" ? originCityHint : destinationCityHint;
    setSelectedId(rowId);
    setChangingDestination(false);
    setCaptureError(null);
    setCompleteTarget({
      kind: "create",
      category: row.category,
      cityName: cityHint || undefined,
      initialStep: "search",
    });
  };

  const handleSheetSubmit = async (data: StopFormData) => {
    if (isRouteMutationPending) return;
    const editingStopId =
      completeTarget?.kind === "edit" ? completeTarget.stopId : null;
    const createTarget = completeTarget;
    const draftRowId =
      selectedRow && isDraftWaypointSlotId(selectedRow.id)
        ? selectedRow.id
        : null;
    const stops = buildReplaceStopsPayload({
      existingStops: orderedStops,
      submitted: data,
      editingStopId,
      endpointDraft:
        createTarget?.kind === "create" ? endpointDraft : undefined,
      preserveEditedSnapshotAddressId:
        showMidTripReplan && Boolean(editingStopId),
    });

    const finishOk = () => {
      setCompleteTarget(null);
      if (createTarget?.kind === "create") {
        setEndpointDraft({});
      }
      if (createTarget?.kind === "create" && draftRowId) {
        setWaypointDraftIds((ids) => ids.filter((id) => id !== draftRowId));
      }
    };

    // Mismo gate que handlePick: no PUT de ruta incompleta (1 extremo).
    if (
      createTarget?.kind === "create" &&
      !showMidTripReplan &&
      !canPersistComposerStops(stops)
    ) {
      const category = createTarget.category;
      if (category === "waypoint") {
        setCaptureError(copy.composer.needBothEnds);
        setCompleteTarget(null);
        return;
      }
      const seed =
        category === "origin" ? endpointDraft.origin : endpointDraft.destination;
      const pick = stopFormDataToComposerEndpointPick(data, seed);
      setEndpointDraft((prev) => ({ ...prev, [category]: pick }));
      toast({
        title: isComposerPickPutReady(pick)
          ? category === "origin"
            ? copy.composer.pendingOriginSaved
            : copy.composer.pendingDestinationSaved
          : category === "origin"
            ? copy.composer.pendingOriginIncomplete
            : copy.composer.pendingDestinationIncomplete,
        variant: "default",
      });
      setCompleteTarget(null);
      setSelectedId(
        category === "origin"
          ? ROUTE_SLOT_DESTINATION_ID
          : ROUTE_SLOT_ORIGIN_ID,
      );
      return;
    }

    if (showMidTripReplan) {
      const pending = toReplanPendingStops({
        next: stops,
        existing: orderedStops,
        editingStopId,
      });
      if (needsFiscalConfirm) {
        pendingPersistRef.current = {
          execute: async () => {
            const ok = await runReplan(pending);
            if (ok) finishOk();
            return ok;
          },
          syncKey: stopsSyncKey,
        };
        setFiscalConfirmOpen(true);
        return;
      }
      const ok = await runReplan(pending);
      if (!ok) {
        throw new Error(copy.toast.stopSaveError);
      }
      finishOk();
      return;
    }

    const ok = await runReplace(stops);
    if (!ok) {
      throw new Error(copy.toast.stopSaveError);
    }
    finishOk();
  };

  const sheetInitialData: StopFormData | undefined = editingStop
    ? {
        ...mapTripStopToStopFormData(editingStop),
        previousStopLatitude: previousStop?.latitude ?? undefined,
        previousStopLongitude: previousStop?.longitude ?? undefined,
        previousStopLabel:
          previousStop?.locationName || previousStop?.city || undefined,
      }
    : completeTarget?.kind === "create"
      ? {
          ...(completeTarget.prefill ?? {
            stopCategory: completeTarget.category,
            stopType: composerStopTypes(completeTarget.category),
            locationName: completeTarget.locationName,
            cityName: completeTarget.cityName,
          }),
          previousStopLatitude: previousStop?.latitude ?? undefined,
          previousStopLongitude: previousStop?.longitude ?? undefined,
          previousStopLabel:
            previousStop?.locationName || previousStop?.city || undefined,
        }
      : previousStop
        ? {
            previousStopLatitude: previousStop.latitude ?? undefined,
            previousStopLongitude: previousStop.longitude ?? undefined,
            previousStopLabel:
              previousStop.locationName || previousStop.city || undefined,
          }
        : undefined;

  const editingCompleteStop =
    completeTarget?.kind === "edit" &&
    editingStop != null &&
    isStopDomicilioComplete(editingStop);
  const createCategory =
    completeTarget?.kind === "create" ? completeTarget.category : undefined;
  const completeHeading =
    completeTarget?.kind === "edit" && editingStop
      ? editingCompleteStop
        ? copy.format.editStopTitle(getDisplayOrder(editingStop, ordered))
        : copy.format.completeAddressTitle(getDisplayOrder(editingStop, ordered))
      : createCategory === "origin"
        ? copy.panel.chooseOrigin
        : createCategory === "destination"
          ? copy.panel.chooseDestination
          : createCategory === "waypoint"
            ? copy.panel.chooseWaypoint
            : copy.action.completeAddress;
  const completeDescription = editingCompleteStop
    ? copy.hint.sheetDescriptionEdit
    : copy.panel.chooseDescription;

  /** F9c — alta y mid-trip abren el mismo Sheet overlay (no inline). */
  const confirmInitialStep =
    completeTarget?.kind === "create"
      ? (completeTarget.initialStep ?? "confirm")
      : "confirm";
  const consequenceFromLabel =
    createCategory === "destination"
      ? origin
        ? stopDisplayLabel(origin)
        : endpointDraft.origin
          ? pickerItemLabel(endpointDraft.origin)
          : composerOriginLabel
      : createCategory === "origin"
        ? sheetInitialData?.locationName ?? null
        : origin
          ? stopDisplayLabel(origin)
          : null;
  const consequenceToLabel =
    createCategory === "origin"
      ? destination
        ? stopDisplayLabel(destination)
        : endpointDraft.destination
          ? pickerItemLabel(endpointDraft.destination)
          : composerDestinationLabel
      : createCategory === "destination"
        ? sheetInitialData?.locationName ?? null
        : destination
          ? stopDisplayLabel(destination)
          : null;

  const corridors = corridorsQuery.data ?? [];
  const matchingCorridors = filterCorridorsMatchingCityPair(
    corridors,
    originCityHint,
    destinationCityHint,
  );
  // D57 — corredor solo si el par de ciudades coincide.
  const showCorridorPicker =
    canEditStructural &&
    orderedStops.length === 0 &&
    Boolean(trip.clientId) &&
    Boolean(originCityHint && destinationCityHint) &&
    (corridorsQuery.isLoading || matchingCorridors.length > 0);

  const captureProximity = resolveRouteSearchProximity({
    category:
      selectedRow?.category === "origin" ||
      selectedRow?.category === "destination" ||
      selectedRow?.category === "waypoint"
        ? selectedRow.category
        : "destination",
    originStop: origin,
    destinationStop: destination,
    originPick: endpointDraft.origin,
    destinationPick: endpointDraft.destination,
  });
  const plannedKmForConsequences = sumRouteSegmentDistanceKm(ordered);

  const panelCategory: RouteStopCategory | undefined =
    completeTarget?.kind === "create"
      ? completeTarget.category
      : editingStop
        ? getRouteStopCategory(editingStop)
        : undefined;
  const panelPosition =
    completeTarget != null
      ? resolvePanelStopPosition({
          completeTarget,
          ordered,
          editingStop,
          hasOrigin: Boolean(origin) || Boolean(endpointDraft.origin),
          hasDestination:
            Boolean(destination) || Boolean(endpointDraft.destination),
          waypointCount: waypoints.length + waypointDraftIds.length,
        })
      : null;
  const panelContextLine =
    panelPosition != null
      ? copy.panel.contextLine(
          trip.tripCode,
          panelPosition.index,
          panelPosition.total,
          panelPosition.role,
        )
      : null;

  const stopConfirmPanel =
    completeTarget != null ? (
      <TripStopSearchConfirmSheet
        key={
          completeTarget.kind === "edit"
            ? completeTarget.stopId
            : `new-${completeTarget.category}-${confirmInitialStep}`
        }
        open
        onOpenChange={(open) => {
          if (!open) setCompleteTarget(null);
        }}
        onSubmit={handleSheetSubmit}
        initialData={sheetInitialData}
        mode={completeTarget.kind === "edit" ? "edit" : "create"}
        heading={completeHeading}
        description={completeDescription}
        cfdiDocumentIntent={trip.cfdiDocumentIntent}
        tripContractingClientId={trip.clientId ?? undefined}
        originBranchId={trip.originBranchId ?? undefined}
        keepBillingCollapsed
        isPending={isRouteMutationPending}
        initialStep={confirmInitialStep}
        category={panelCategory}
        proximity={captureProximity}
        cityHint={
          completeTarget.kind === "create"
            ? completeTarget.cityName ??
              (completeTarget.category === "origin"
                ? originCityHint
                : completeTarget.category === "destination"
                  ? destinationCityHint
                  : null)
            : null
        }
        clientId={trip.clientId ?? null}
        consequenceFromLabel={consequenceFromLabel}
        consequenceToLabel={consequenceToLabel}
        estimatedDistanceKm={
          plannedKmForConsequences != null && plannedKmForConsequences > 0
            ? plannedKmForConsequences
            : null
        }
        contextLine={panelContextLine}
      />
    ) : null;

  if (orderedStops.length === 0 && !canMutateRoute) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-dashed bg-card">
          <EmptyState
            icon={<Navigation />}
            title={copy.state.emptyTitle}
            description={copy.state.readOnlyEmpty}
            size="md"
          />
        </div>
      </div>
    );
  }

  const tripTimes = {
    scheduledDeparture: trip.scheduledDeparture,
    actualDeparture: trip.actualDeparture,
  };
  const showVisitState = tripStatus === "in_progress";
  const missingDomicilioCount = countStopsMissingDomicilio(ordered);
  const missingDistanceCount = countStopsMissingSegmentDistance(ordered);
  const fillableDistanceCount = countFillableMissingSegmentDistances(ordered);
  const missingDestinationMidTrip =
    showMidTripReplan && hasAnyPersistedStop && !destination;

  const captureLabel =
    selectedRow?.category === "origin"
      ? composerOriginLabel
      : selectedRow?.category === "destination"
        ? composerDestinationLabel
        : null;
  const captureHint =
    selectedRow?.category === "origin"
      ? originCityHint
      : selectedRow?.category === "destination"
        ? destinationCityHint
        : "";

  const emptySlotMessage =
    selectedRow?.category === "origin"
      ? copy.state.noOrigin
      : selectedRow?.category === "destination"
        ? copy.state.noDestination
        : copy.composer.emptySlot;

  const showComposerCapture =
    selectedRow != null &&
    (!selectedRow.stop || changingDestination) &&
    canMutateRoute;

  const detailPanel = (() => {
    // F9c — Confirmar / Completar domicilio vive en Sheet overlay (stopConfirmPanel).
    if (!selectedRow) {
      return (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {copy.hint.selectRow}
        </p>
      );
    }

    if (!selectedRow.stop || changingDestination) {
      if (!canMutateRoute) {
        return (
          <p className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
            {emptySlotMessage}
          </p>
        );
      }
      const captureCategory: RouteStopCategory = changingDestination
        ? "destination"
        : selectedRow.category;
      const isDraftWaypoint =
        selectedRow.category === "waypoint" &&
        isDraftWaypointSlotId(selectedRow.id);
      return (
        <div className="space-y-3">
          <TripRouteSlotCapture
            key={changingDestination ? `change-dest-${selectedRow.id}` : selectedRow.id}
            category={captureCategory}
            seedItem={
              captureCategory === "origin"
                ? endpointDraft.origin
                : captureCategory === "destination"
                  ? endpointDraft.destination
                  : null
            }
            selectedLabel={
              captureCategory === "origin"
                ? composerOriginLabel
                : captureCategory === "destination"
                  ? composerDestinationLabel
                  : captureLabel
            }
            cityHint={
              captureCategory === "origin"
                ? originCityHint || null
                : captureCategory === "destination"
                  ? destinationCityHint || null
                  : captureHint || null
            }
            proximity={captureProximity}
            clientId={trip.clientId ?? null}
            disabled={isRouteMutationPending}
            onPick={handlePick}
            onCompleteLabel={openCompleteLabel}
          />
          {isDraftWaypoint && !hasBothPersistedEndpoints ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              disabled={isRouteMutationPending}
              onClick={() => handleRemoveDraftWaypoint(selectedRow.id)}
            >
              {copy.action.removeDraftWaypoint}
            </Button>
          ) : null}
          {changingDestination ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isRouteMutationPending}
              onClick={() => setChangingDestination(false)}
            >
              {copy.action.cancel}
            </Button>
          ) : null}
        </div>
      );
    }

    if (selectedLocked) {
      return (
        <TripDetailRouteStopCard stop={selectedRow.stop} />
      );
    }

    const canEditSelected = canMutateRoute;
    const wpIndex = mutableWaypoints.findIndex(
      (stop) => stop.id === selectedRow.stop!.id,
    );
    const canReorder =
      canReplanPendingStops &&
      getRouteStopCategory(selectedRow.stop) === "waypoint" &&
      wpIndex >= 0 &&
      mutableWaypoints.length >= 2;

    return (
      <TripDetailRouteStopCard
        stop={selectedRow.stop}
        onCompleteAddress={
          canEditSelected ? () => openStopForm(selectedRow.stop!) : undefined
        }
        onEditStop={
          canEditSelected ? () => openStopForm(selectedRow.stop!) : undefined
        }
        onRemoveWaypoint={
          canEditSelected && getRouteStopCategory(selectedRow.stop) === "waypoint"
            ? () => handleRequestRemoveWaypoint(selectedRow.stop!)
            : undefined
        }
        onReorderUp={
          canReorder ? () => handleReorderWaypoint(selectedRow.stop!, "up") : undefined
        }
        onReorderDown={
          canReorder
            ? () => handleReorderWaypoint(selectedRow.stop!, "down")
            : undefined
        }
        reorderUpDisabled={!canReorder || wpIndex <= 0 || isRouteMutationPending}
        reorderDownDisabled={
          !canReorder ||
          wpIndex < 0 ||
          wpIndex >= mutableWaypoints.length - 1 ||
          isRouteMutationPending
        }
      />
    );
  })();

  const distanceSegments = buildRouteDistanceSegments(ordered);
  const totalPlannedKm = sumRouteSegmentDistanceKm(ordered);
  const cargoCount = cargos?.length ?? 0;
  const footerKm =
    totalPlannedKm != null
      ? totalPlannedKm.toLocaleString("es-MX", { maximumFractionDigits: 1 })
      : null;
  const routeFooterText = copy.format.routeFooter(
    ordered.length,
    footerKm,
    cargoCount,
  );

  const routeAlerts = (
    <>
      {missingDestinationMidTrip ? (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{copy.alert.noDestinationTitle}</AlertTitle>
          <AlertDescription>{copy.alert.noDestinationBody}</AlertDescription>
        </Alert>
      ) : null}

      {hasBothPersistedEndpoints && missingDomicilioCount > 0 ? (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{copy.alert.missingAddressTitle}</AlertTitle>
          <AlertDescription>
            {copy.alert.missingAddressBody(missingDomicilioCount)}
          </AlertDescription>
        </Alert>
      ) : null}

      {hasBothPersistedEndpoints && missingDistanceCount > 0 ? (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{copy.alert.missingDistanceTitle}</AlertTitle>
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {fillableDistanceCount > 0
                ? copy.alert.missingDistanceBody(missingDistanceCount)
                : copy.alert.missingDistanceNeedsCoordsBody}
            </span>
            {fillableDistanceCount > 0 && canMutateRoute ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 border-warning/40 bg-background"
                disabled={isRouteMutationPending}
                onClick={handleCalculateDistances}
              >
                {copy.action.calculateDistances}
              </Button>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}
    </>
  );

  const unsavedAndErrors = (
    <>
      {captureError ? (
        <FormValidationSummary
          title={copy.alert.captureTitle}
          messages={[captureError]}
        />
      ) : null}
      {hasLocalDraft ? (
        <TripRouteUnsavedBar
          summary={unsavedSummary}
          canSave={canSaveLocalDraft}
          isPending={isRouteMutationPending}
          onDiscard={handleDiscardLocalDraft}
          onSave={handleSaveLocalDraft}
        />
      ) : null}
    </>
  );

  const artboardLayout = hasBothPersistedEndpoints ? (
    <div className="space-y-3">
      {unsavedAndErrors}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
        <TripRouteTimeline
          rows={masterRows}
          selectedId={resolvedViewId}
          onSelect={handleSelectRow}
          onAddWaypoint={handleAddWaypoint}
          tripTimes={tripTimes}
          showVisitState={showVisitState}
          showMidTripReplan={showMidTripReplan}
          disabled={isRouteMutationPending}
          readOnly={!canMutateRoute}
          canAddWaypoint={canAddWaypoint}
          addWaypointDisabledReason={copy.composer.needBothEnds}
          editingChip={hasLocalDraft}
          footerText={routeFooterText}
          onEditStop={canMutateRoute ? openStopForm : undefined}
          onCompleteAddress={canMutateRoute ? openStopForm : undefined}
          onChangeDestination={
            canMutateRoute ? handleChangeDestination : undefined
          }
          onRemoveWaypoint={
            canMutateRoute ? handleRequestRemoveWaypoint : undefined
          }
          onRemoveDraftWaypoint={
            canMutateRoute ? handleRemoveDraftWaypoint : undefined
          }
          onReorderUp={
            canReplanPendingStops
              ? (stop) => handleReorderWaypoint(stop, "up")
              : undefined
          }
          onReorderDown={
            canReplanPendingStops
              ? (stop) => handleReorderWaypoint(stop, "down")
              : undefined
          }
          canReorderStop={(stop) => {
            const wpIndex = mutableWaypoints.findIndex(
              (item) => item.id === stop.id,
            );
            const canReorder =
              canReplanPendingStops &&
              getRouteStopCategory(stop) === "waypoint" &&
              wpIndex >= 0 &&
              mutableWaypoints.length >= 2;
            return {
              up: Boolean(canReorder && wpIndex > 0 && !isRouteMutationPending),
              down: Boolean(
                canReorder &&
                  wpIndex >= 0 &&
                  wpIndex < mutableWaypoints.length - 1 &&
                  !isRouteMutationPending,
              ),
            };
          }}
        />
        <div className="space-y-4">
          {showComposerCapture ? (
            <div className="rounded-xl border bg-card p-4">{detailPanel}</div>
          ) : (
            <TripRouteMapPanel stops={ordered} />
          )}
          <TripRouteDistancesCard
            segments={distanceSegments}
            totalKm={totalPlannedKm}
          />
        </div>
      </div>
    </div>
  ) : null;

  const emptyComposerReadyCount = masterRows.filter((row) =>
    Boolean(row.stop),
  ).length;
  const emptyComposerFooter = `${copy.composer.composerFooter(emptyComposerReadyCount)} · ${copy.composer.composerFooterHint}`;

  const emptyComposerLayout = !hasBothPersistedEndpoints ? (
    <div className="space-y-3">
      {showMidTripReplan ? (
        <div>
          <h3 className="flex flex-wrap items-center gap-2 text-base font-semibold">
            {copy.state.emptyMidTripTitle}
            {hasLocalDraft ? (
              <Badge variant="info" tone="soft" className="font-normal">
                {copy.chip.editing}
              </Badge>
            ) : null}
          </h3>
          <p className="text-sm text-muted-foreground">
            {hasLocalDraft ? copy.hint.midTripComposer : copy.hint.stopsMidTrip}
          </p>
        </div>
      ) : null}
      {unsavedAndErrors}
      {/* F8c — AmbosCiudad / RutaPrecargada: panel + mapa/distancias; Elegir lugar → F9c. */}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
        <TripRouteComposer
          rows={masterRows}
          selectedId={resolvedViewId}
          onSelect={handleSelectRow}
          onAddWaypoint={handleAddWaypoint}
          tripTimes={tripTimes}
          disabled={isRouteMutationPending}
          readOnly={!canMutateRoute}
          canAddWaypoint={canAddWaypoint}
          addWaypointDisabledReason={copy.composer.needBothEnds}
          mode={showMidTripReplan ? "pending-only" : "full"}
          showVisitState={showVisitState}
          layout="panel"
          footerText={emptyComposerFooter}
          onChoosePlace={canMutateRoute ? openChoosePlace : undefined}
          corridor={
            showCorridorPicker ? (
              <CorridorPicker
                corridors={matchingCorridors}
                isLoading={corridorsQuery.isLoading}
                disabled={replaceStops.isPending}
                onSelect={handleCorridorSelect}
              />
            ) : null
          }
        />
        <div className="space-y-4">
          {showMidTripReplan && showComposerCapture ? (
            <div className="rounded-xl border bg-card p-4">{detailPanel}</div>
          ) : (
            <TripRouteMapPanel stops={ordered} />
          )}
          <TripRouteDistancesCard
            segments={distanceSegments}
            totalKm={totalPlannedKm}
          />
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-6">
      {routeAlerts}
      {artboardLayout}
      {emptyComposerLayout}

      {/* F9c — alta y mid-trip: mismo Sheet overlay (Buscar→Confirmar). */}
      {stopConfirmPanel}

      <AlertDialog
        open={removeDialog?.kind === "confirm"}
        onOpenChange={(open) => {
          if (!open) setRemoveDialog(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {copy.confirm.removeWaypointTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {copy.confirm.removeWaypointBody}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRouteMutationPending}>
              {copy.action.keepWaypoint}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isRouteMutationPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmRemoveWaypoint();
              }}
            >
              {copy.action.confirmRemoveWaypoint}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={removeDialog?.kind === "blocked"}
        onOpenChange={(open) => {
          if (!open) setRemoveDialog(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {copy.confirm.removeWaypointBlockedTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {copy.confirm.removeWaypointBlockedBody}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" asChild>
              <Link
                to={`?tab=cargo`}
                onClick={() => setRemoveDialog(null)}
              >
                {copy.action.goToCargoTab}
              </Link>
            </Button>
            <AlertDialogAction onClick={() => setRemoveDialog(null)}>
              {copy.action.cancel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={fiscalConfirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFiscalConfirmOpen(false);
            pendingPersistRef.current = null;
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.confirm.replanFiscalTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.confirm.replanFiscalBody}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isRouteMutationPending}
              onClick={() => {
                pendingPersistRef.current = null;
              }}
            >
              {copy.action.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isRouteMutationPending}
              onClick={(event) => {
                event.preventDefault();
                const entry = pendingPersistRef.current;
                pendingPersistRef.current = null;
                setFiscalConfirmOpen(false);
                if (!entry) return;
                if (entry.syncKey !== stopsSyncKey) {
                  toast({
                    title: copy.alert.routeChangedExternally,
                    variant: "warning",
                  });
                  return;
                }
                void entry.execute().then((ok) => {
                  if (ok) setCompleteTarget(null);
                });
              }}
            >
              {copy.action.confirmFiscalReplan}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
