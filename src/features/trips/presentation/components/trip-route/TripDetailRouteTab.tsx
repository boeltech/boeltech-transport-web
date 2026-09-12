import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Navigation } from "lucide-react";

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

import { StopFormSheet } from "../../pages/create/components/StopFormSheet";
import {
  addressSearchItemToDialogSlice,
  dialogToStopFormData,
  getEmptyStopDialogValues,
  type StopFormData,
} from "../../pages/create/components/stopDialogAddressMapper";
import { mapStopToReplaceStopInput } from "../trip-detail-patch/mapStopToCreateStopInput";
import { CorridorPicker } from "../corridor/CorridorPicker";
import { TripDetailRouteStopCard } from "./TripDetailRouteStopCard";
import { TripRouteComposer, TripRouteSlotCapture } from "./TripRouteComposer";
import {
  buildReplanAfterRemoveWaypoint,
  buildReplanAfterReorderWaypoint,
  toReplanPendingStops,
  type ReplanPendingStopInput,
} from "./buildReplanStopsPayload";
import { isTripStopImmutableMidTrip } from "./isStopImmutableMidTrip";
import {
  buildRouteMasterRows,
  countFillableMissingSegmentDistances,
  countStopsMissingDomicilio,
  countStopsMissingSegmentDistance,
  getRouteStopCategory,
  groupStopsForRouteDetail,
  isDraftWaypointSlotId,
  isStopDomicilioComplete,
  resolveRouteMasterRowId,
  ROUTE_SLOT_WAYPOINT_PREFIX,
  stopHasLinkedCargoMovements,
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
}

function getDisplayOrder(stop: TripStop, ordered: readonly TripStop[]): number {
  const index = ordered.findIndex((item) => item.id === stop.id);
  return index >= 0 ? index + 1 : stop.sequenceOrder;
}

function stopDisplayLabel(stop: TripStop): string {
  return stop.locationName?.trim() || stop.city?.trim() || stop.address?.trim() || "";
}

export function TripDetailRouteTab({
  trip,
  tripStatus,
  orderedStops,
  canEditStructural,
  canReplanPendingStops = false,
  cargos,
  legacyRoute,
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
  const resolvedViewId = useMemo(
    () => resolveRouteMasterRowId(masterRows, selectedId),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- masterRowIds cubre la identidad de las filas
    [masterRowIds, selectedId],
  );
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

  const runReplace = async (stops: CreateStopInput[]) => {
    if (replaceStops.isPending) return false;
    try {
      await replaceStops.mutateAsync(stops);
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
      });
    };

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
  const completeHeading =
    completeTarget?.kind === "edit" && editingStop
      ? editingCompleteStop
        ? copy.format.editStopTitle(getDisplayOrder(editingStop, ordered))
        : copy.format.completeAddressTitle(getDisplayOrder(editingStop, ordered))
      : copy.action.completeAddress;
  const completeDescription = editingCompleteStop
    ? copy.hint.sheetDescriptionEdit
    : copy.hint.sheetDescriptionComplete;

  const stopForm =
    completeTarget != null ? (
      <StopFormSheet
        key={
          completeTarget.kind === "edit"
            ? completeTarget.stopId
            : `new-${completeTarget.category}`
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
        variant="sheet"
        isPending={isRouteMutationPending}
      />
    ) : null;

  const corridors = corridorsQuery.data ?? [];
  const showCorridorPicker =
    canEditStructural &&
    orderedStops.length === 0 &&
    Boolean(trip.clientId) &&
    (corridorsQuery.isLoading || corridors.length > 0);

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
  const hasPersistedStops = orderedStops.length > 0;
  const missingDestinationMidTrip =
    showMidTripReplan && hasPersistedStops && !destination;

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

  const detailPanel = (() => {
    if (!selectedRow) {
      return (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {copy.hint.selectRow}
        </p>
      );
    }

    if (!selectedRow.stop) {
      if (!canMutateRoute) {
        return (
          <p className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
            {emptySlotMessage}
          </p>
        );
      }
      const isDraftWaypoint =
        selectedRow.category === "waypoint" &&
        isDraftWaypointSlotId(selectedRow.id);
      return (
        <div className="space-y-3">
          <TripRouteSlotCapture
            key={selectedRow.id}
            category={selectedRow.category}
            seedItem={
              selectedRow.category === "origin"
                ? endpointDraft.origin
                : selectedRow.category === "destination"
                  ? endpointDraft.destination
                  : null
            }
            selectedLabel={captureLabel}
            cityHint={captureHint || null}
            disabled={isRouteMutationPending}
            onPick={handlePick}
            onCompleteLabel={openCompleteLabel}
          />
          {isDraftWaypoint ? (
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

  return (
    <div className="space-y-6">
      {missingDestinationMidTrip ? (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{copy.alert.noDestinationTitle}</AlertTitle>
          <AlertDescription>{copy.alert.noDestinationBody}</AlertDescription>
        </Alert>
      ) : null}

      {hasPersistedStops && missingDomicilioCount > 0 ? (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{copy.alert.missingAddressTitle}</AlertTitle>
          <AlertDescription>
            {copy.alert.missingAddressBody(missingDomicilioCount)}
          </AlertDescription>
        </Alert>
      ) : null}

      {hasPersistedStops && missingDistanceCount > 0 ? (
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

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-semibold">
              {hasPersistedStops
                ? copy.section.stops
                : showMidTripReplan
                  ? copy.state.emptyMidTripTitle
                  : copy.composer.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {showMidTripReplan
                ? copy.hint.stopsMidTrip
                : hasPersistedStops
                  ? copy.hint.stops
                  : copy.composer.description}
            </p>
          </div>
        </div>
        {captureError ? (
          <FormValidationSummary
            title={copy.alert.captureTitle}
            messages={[captureError]}
          />
        ) : null}
        <div className="grid gap-4 rounded-md border bg-muted/30 p-2 md:grid-cols-[280px_1fr] md:items-stretch md:gap-0">
          <TripRouteComposer
            rows={masterRows}
            selectedId={resolvedViewId}
            onSelect={handleSelectRow}
            onAddWaypoint={handleAddWaypoint}
            tripTimes={tripTimes}
            disabled={isRouteMutationPending}
            readOnly={!canMutateRoute}
            mode={showMidTripReplan ? "pending-only" : "full"}
            showVisitState={showVisitState}
            corridor={
              showCorridorPicker ? (
                <CorridorPicker
                  corridors={corridors}
                  isLoading={corridorsQuery.isLoading}
                  disabled={replaceStops.isPending}
                  onSelect={handleCorridorSelect}
                />
              ) : null
            }
          />
          <div className="flex min-h-0 flex-col bg-background md:max-h-[640px] md:overflow-hidden md:rounded-r-md md:p-5">
            {detailPanel}
          </div>
        </div>
      </div>

      {stopForm}

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
