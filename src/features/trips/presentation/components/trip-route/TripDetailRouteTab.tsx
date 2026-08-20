import { useMemo, useState } from "react";
import { AlertCircle, Navigation } from "lucide-react";

import { useClientCorridors, useReplaceTripStops } from "@features/trips/application";
import {
  type ClientCorridor,
  type Trip,
  type TripCargo,
  type TripStatusType,
  type TripStop,
} from "@features/trips/domain";
import { useToast } from "@shared/hooks";
import type { AddressSearchListItem } from "@shared/ui/address-picker/types";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { EmptyState } from "@shared/ui/feedback-states";
import { FormValidationSummary } from "@shared/ui/form";

import { StopFormSheet } from "../../pages/create/components/StopFormSheet";
import type { StopFormData } from "../../pages/create/components/stopDialogAddressMapper";
import { mapStopToReplaceStopInput } from "../trip-detail-patch/mapStopToCreateStopInput";
import { CorridorPicker } from "../corridor/CorridorPicker";
import { TripDetailRouteStopCard } from "./TripDetailRouteStopCard";
import { TripRouteComposer, TripRouteSlotCapture } from "./TripRouteComposer";
import {
  buildRouteMasterRows,
  countFillableMissingSegmentDistances,
  countStopsMissingDomicilio,
  countStopsMissingSegmentDistance,
  groupStopsForRouteDetail,
  isDraftWaypointSlotId,
  isStopDomicilioComplete,
  resolveRouteMasterRowId,
  ROUTE_SLOT_WAYPOINT_PREFIX,
  type RouteStopCategory,
} from "./tripRouteDetailHelpers";
import {
  buildReplaceStopsPayload,
  canPersistComposerStops,
  composerStopTypes,
  type ComposerEndpointDraft,
  finalizeReplaceStopsPayload,
  isDuplicateComposerEndpointAddress,
  mapTripStopToStopFormData,
  mergeComposerEndpointDraft,
  pickerItemLabel,
  replaceStopsFromCorridor,
  upsertComposerStop,
} from "./buildReplaceStopsPayload";
import { tripDetailCopy } from "../../copy";

const copy = tripDetailCopy.route;

export interface TripDetailRouteTabProps {
  trip: Trip;
  tripStatus: TripStatusType;
  orderedStops: TripStop[];
  progress: number;
  canEditStructural: boolean;
  cargos?: TripCargo[];
  legacyRoute?: {
    originCity?: string | null;
    originState?: string | null;
    destinationCity?: string | null;
    destinationState?: string | null;
  };
}

type CompleteTarget =
  | { kind: "edit"; stopId: string }
  | {
      kind: "create";
      category: RouteStopCategory;
      locationName?: string;
      cityName?: string;
    };

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
  legacyRoute,
}: TripDetailRouteTabProps) {
  const { toast } = useToast();
  const replaceStops = useReplaceTripStops(trip.id);
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
  });
  const masterRowIds = masterRows.map((row) => row.id).join("|");
  const resolvedViewId = useMemo(
    () => resolveRouteMasterRowId(masterRows, selectedId),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- masterRowIds cubre la identidad de las filas
    [masterRowIds, selectedId],
  );
  const selectedRow =
    masterRows.find((row) => row.id === resolvedViewId) ?? null;

  const editingStop =
    completeTarget?.kind === "edit"
      ? orderedStops.find((stop) => stop.id === completeTarget.stopId)
      : selectedRow?.stop;
  const previousStop = editingStop
    ? orderedStops[orderedStops.findIndex((stop) => stop.id === editingStop.id) - 1]
    : orderedStops[orderedStops.length - 1];

  const persistStops = async (stops: ReturnType<typeof upsertComposerStop>) => {
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

  const handlePick = (category: RouteStopCategory, item: AddressSearchListItem) => {
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
      const draftId = selectedRow?.id;
      void persistStops(
        upsertComposerStop({
          existingStops: orderedStops,
          category,
          item,
        }),
      ).then((ok) => {
        if (ok && draftId && isDraftWaypointSlotId(draftId)) {
          setWaypointDraftIds((ids) => ids.filter((id) => id !== draftId));
        }
      });
      return;
    }

    const nextDraft: ComposerEndpointDraft = {
      ...endpointDraft,
      [category]: item,
    };
    const stops = mergeComposerEndpointDraft({
      existingStops: orderedStops,
      draft: nextDraft,
    });

    if (canPersistComposerStops(stops)) {
      void persistStops(stops);
      return;
    }

    setEndpointDraft(nextDraft);
    setCaptureError(null);
    toast({
      title:
        category === "origin"
          ? copy.composer.pendingOriginSaved
          : copy.composer.pendingDestinationSaved,
      variant: "default",
    });
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
    setWaypointDraftIds((ids) => [...ids, id]);
    setSelectedId(id);
    setCompleteTarget(null);
    setCaptureError(null);
  };

  const openStopForm = (stop: TripStop) => {
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
    if (replaceStops.isPending) return;
    try {
      const stops = buildReplaceStopsPayload({
        existingStops: orderedStops,
        submitted: data,
        editingStopId: completeTarget?.kind === "edit" ? completeTarget.stopId : null,
        endpointDraft:
          completeTarget?.kind === "create" ? endpointDraft : undefined,
      });
      await replaceStops.mutateAsync(stops);
      toast({ title: copy.toast.stopsSaved, variant: "success" });
      setCompleteTarget(null);
      if (completeTarget?.kind === "create") {
        setEndpointDraft({});
      }
      if (completeTarget?.kind === "create" && selectedRow && isDraftWaypointSlotId(selectedRow.id)) {
        setWaypointDraftIds((ids) => ids.filter((id) => id !== selectedRow.id));
      }
    } catch (error) {
      // Errores API: Alert inline + toast breve los muestra StopFormSheet.
      throw error;
    }
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
          stopCategory: completeTarget.category,
          stopType: composerStopTypes(completeTarget.category),
          locationName: completeTarget.locationName,
          cityName: completeTarget.cityName,
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
        isPending={replaceStops.isPending}
      />
    ) : null;

  const corridors = corridorsQuery.data ?? [];
  const showCorridorPicker =
    canEditStructural &&
    orderedStops.length === 0 &&
    Boolean(trip.clientId) &&
    (corridorsQuery.isLoading || corridors.length > 0);

  if (orderedStops.length === 0 && !canEditStructural) {
    return (
      <div className="rounded-xl border border-dashed bg-card">
        <EmptyState
          icon={<Navigation />}
          title={copy.state.emptyTitle}
          description={copy.state.readOnlyEmpty}
          size="md"
        />
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
      if (!canEditStructural) {
        return (
          <p className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
            {emptySlotMessage}
          </p>
        );
      }
      return (
        <TripRouteSlotCapture
          category={selectedRow.category}
          selectedLabel={captureLabel}
          cityHint={captureHint || null}
          disabled={replaceStops.isPending}
          onPick={handlePick}
          onCompleteLabel={openCompleteLabel}
        />
      );
    }

    return (
      <TripDetailRouteStopCard
        stop={selectedRow.stop}
        onCompleteAddress={
          canEditStructural ? () => openStopForm(selectedRow.stop!) : undefined
        }
        onEditStop={
          canEditStructural ? () => openStopForm(selectedRow.stop!) : undefined
        }
      />
    );
  })();

  return (
    <div className="space-y-6">
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
            {fillableDistanceCount > 0 && canEditStructural ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 border-warning/40 bg-background"
                disabled={replaceStops.isPending}
                onClick={handleCalculateDistances}
              >
                {copy.action.calculateDistances}
              </Button>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-3">
        <div>
          <h3 className="text-base font-semibold">
            {hasPersistedStops ? copy.section.stops : copy.composer.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {hasPersistedStops ? copy.hint.stops : copy.composer.description}
          </p>
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
            disabled={replaceStops.isPending}
            readOnly={!canEditStructural}
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
    </div>
  );
}
