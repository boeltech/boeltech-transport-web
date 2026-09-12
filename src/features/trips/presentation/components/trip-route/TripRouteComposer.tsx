import { type ReactNode, useState } from "react";
import { Flag, Lock, MapPin, Navigation, Plus } from "lucide-react";

import type { AddressSearchListItem } from "@shared/ui/address-picker/types";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { cn } from "@shared/lib/utils/cn";
import {
  FieldInlineError,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import {
  LocationField,
  locationValueFromInternal,
  locationValueToAddressSearchListItem,
  synthesizeSearchItemFromLocationValue,
  type LocationValue,
} from "@shared/ui/location";
import { STOP_STATUS_LABELS, type StopStatusValue } from "@features/trips/domain";

import { tripDetailCopy } from "../../copy";
import {
  type ComposerWaypointOperations,
} from "./buildReplaceStopsPayload";
import { ownerTypesForRouteSlot, isAllowedRoutePickerItem } from "./routeAddressPickerOwnerTypes";
import {
  getStopOperationalVisitLabel,
  getStopOperationalVisitState,
  isStopDomicilioComplete,
  isStopWaypointOperationComplete,
  type RouteMasterRow,
  type RouteStopCategory,
  type TripScheduleTimes,
} from "./tripRouteDetailHelpers";

const copy = tripDetailCopy.route;

function slotTitle(category: RouteStopCategory): string {
  if (category === "origin") return copy.composer.originSlot;
  if (category === "destination") return copy.composer.destinationSlot;
  return copy.composer.waypointSlot;
}

function SlotIcon({ category }: { category: RouteStopCategory }) {
  if (category === "origin") {
    return <Navigation className="h-4 w-4 text-success" aria-hidden />;
  }
  if (category === "destination") {
    return <Flag className="h-4 w-4 text-destructive" aria-hidden />;
  }
  return <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden />;
}

export interface TripRouteMasterRowProps {
  row: RouteMasterRow;
  selected?: boolean;
  showVisitState?: boolean;
  tripTimes?: TripScheduleTimes;
  onSelect: (id: string) => void;
}

export function TripRouteMasterRow({
  row,
  selected = false,
  showVisitState = false,
  tripTimes,
  onSelect,
}: TripRouteMasterRowProps) {
  const title = slotTitle(row.category);
  const persistedLabel =
    row.stop?.locationName?.trim() ||
    row.stop?.city?.trim() ||
    row.stop?.address?.trim() ||
    "";
  const subtitle =
    persistedLabel ||
    row.draftLabel?.trim() ||
    (row.cityHint ? copy.composer.cityHint(row.cityHint) : copy.composer.emptySlot);
  const missingDomicilio = row.stop ? !isStopDomicilioComplete(row.stop) : false;
  const missingOperation =
    row.stop != null && !isStopWaypointOperationComplete(row.stop);
  const visitLabel =
    showVisitState && row.stop != null
      ? getStopOperationalVisitLabel(
          getStopOperationalVisitState(row.stop, row.category, tripTimes),
          row.category,
        )
      : null;
  const locked = Boolean(row.locked);
  const statusLabel =
    locked && row.stop?.status
      ? (STOP_STATUS_LABELS[row.stop.status as StopStatusValue] ??
        row.stop.status)
      : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(row.id)}
      aria-pressed={selected}
      aria-label={`${title}. ${subtitle}${locked ? `. ${copy.composer.lockedStop}` : ""}`}
      className={cn(
        "group w-full rounded-md border p-3 text-left transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        locked && "bg-muted/60",
        selected
          ? "border-primary bg-background shadow-sm"
          : locked
            ? "border-transparent hover:border-border"
            : "border-transparent bg-card hover:border-border",
        selected && locked && "bg-muted",
      )}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted",
            locked && "text-muted-foreground",
          )}
        >
          {locked ? (
            <Lock className="h-4 w-4" aria-hidden />
          ) : (
            <SlotIcon category={row.category} />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-medium">{title}</span>
            {statusLabel ? (
              <Badge variant="secondary" className="font-normal">
                {statusLabel}
              </Badge>
            ) : null}
            {visitLabel && !locked ? (
              <Badge variant="secondary" className="font-normal">
                {visitLabel}
              </Badge>
            ) : null}
            {!locked && missingDomicilio ? (
              <Badge variant="warning" tone="soft" className="text-xs font-normal">
                {copy.chip.missingAddress}
              </Badge>
            ) : null}
            {!locked && missingOperation ? (
              <Badge variant="warning" tone="soft" className="text-xs font-normal">
                {copy.chip.missingOperation}
              </Badge>
            ) : null}
          </div>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </button>
  );
}

export interface TripRouteSlotCaptureProps {
  category: RouteStopCategory;
  /** Pending catalog pick for this slot (parent must remount via key when slot changes). */
  seedItem?: AddressSearchListItem | null;
  selectedLabel?: string | null;
  cityHint?: string | null;
  disabled?: boolean;
  onPick: (
    category: RouteStopCategory,
    item: AddressSearchListItem,
    waypointOperations?: ComposerWaypointOperations,
  ) => void;
  onCompleteLabel: (category: RouteStopCategory, locationName: string) => void;
}

export function TripRouteSlotCapture({
  category,
  seedItem = null,
  selectedLabel,
  cityHint,
  disabled,
  onPick,
  onCompleteLabel,
}: TripRouteSlotCaptureProps) {
  const [labelDraft, setLabelDraft] = useState("");
  const [hatchOpen, setHatchOpen] = useState(false);
  const [labelError, setLabelError] = useState<string | undefined>();
  const [locationValue, setLocationValue] = useState<LocationValue | null>(() =>
    seedItem ? locationValueFromInternal(seedItem) : null,
  );
  const [pendingWaypointItem, setPendingWaypointItem] =
    useState<AddressSearchListItem | null>(null);
  const [pickup, setPickup] = useState(false);
  const [delivery, setDelivery] = useState(false);
  const [opsError, setOpsError] = useState<string | undefined>();
  const title = slotTitle(category);
  const pickerLabel = `${title}: ${copy.composer.pickerLabel}`;
  const labelId = `trip-route-composer-${category}-label`;
  const opsGroupId = `trip-route-composer-${category}-ops`;
  const trimmed = labelDraft.trim();
  const hint = cityHint?.trim();
  const isWaypoint = category === "waypoint";

  const handleCompleteLabel = () => {
    if (!trimmed) {
      setLabelError(copy.composer.labelHint);
      return;
    }
    setLabelError(undefined);
    onCompleteLabel(category, trimmed);
  };

  const handleLocationChange = (value: LocationValue | null) => {
    setLocationValue(value);
    if (!value) {
      setPendingWaypointItem(null);
      setPickup(false);
      setDelivery(false);
      setOpsError(undefined);
      return;
    }
    const item =
      locationValueToAddressSearchListItem(value) ??
      synthesizeSearchItemFromLocationValue(value);
    if (!isWaypoint) {
      onPick(category, item);
      return;
    }
    setPendingWaypointItem(item);
    setPickup(false);
    setDelivery(false);
    setOpsError(undefined);
  };

  const handleConfirmWaypoint = () => {
    if (!pendingWaypointItem) return;
    if (!pickup && !delivery) {
      setOpsError(copy.composer.waypointOperationRequired);
      return;
    }
    setOpsError(undefined);
    onPick(category, pendingWaypointItem, { pickup, delivery });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">
          {category === "origin"
            ? copy.hint.captureHintOrigin
            : copy.hint.captureHintStop}
        </p>
      </div>
      {hint ? (
        <p className="text-xs text-muted-foreground">{copy.composer.cityHint(hint)}</p>
      ) : null}
      {selectedLabel ? (
        <p className="text-sm">
          {copy.composer.selectedStop}: {selectedLabel}
        </p>
      ) : null}
      <LocationField
        context="tripStop"
        value={locationValue}
        onChange={handleLocationChange}
        label={pickerLabel}
        disabled={disabled}
        ownerTypes={ownerTypesForRouteSlot(category)}
        filterItem={isAllowedRoutePickerItem}
      />
      {isWaypoint && pendingWaypointItem ? (
        <div className="space-y-3 rounded-lg border p-3">
          <p className="text-sm font-medium" id={opsGroupId}>
            {copy.composer.waypointOperationQuestion}
          </p>
          <div
            className="grid grid-cols-2 gap-3"
            role="group"
            aria-labelledby={opsGroupId}
          >
            <label
              htmlFor={`${opsGroupId}-pickup`}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                pickup && "border-primary bg-primary/5",
              )}
            >
              <Checkbox
                id={`${opsGroupId}-pickup`}
                checked={pickup}
                aria-label={copy.composer.waypointOperationPickup}
                disabled={disabled}
                onCheckedChange={(checked) => {
                  setPickup(checked === true);
                  if (opsError) setOpsError(undefined);
                }}
              />
              <span className="text-sm font-medium">
                {copy.composer.waypointOperationPickup}
              </span>
            </label>
            <label
              htmlFor={`${opsGroupId}-delivery`}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                delivery && "border-primary bg-primary/5",
              )}
            >
              <Checkbox
                id={`${opsGroupId}-delivery`}
                checked={delivery}
                aria-label={copy.composer.waypointOperationDelivery}
                disabled={disabled}
                onCheckedChange={(checked) => {
                  setDelivery(checked === true);
                  if (opsError) setOpsError(undefined);
                }}
              />
              <span className="text-sm font-medium">
                {copy.composer.waypointOperationDelivery}
              </span>
            </label>
          </div>
          <FieldInlineError fieldId={opsGroupId} message={opsError} />
          <Button
            type="button"
            size="sm"
            disabled={disabled}
            onClick={handleConfirmWaypoint}
          >
            {copy.composer.waypointOperationConfirm}
          </Button>
        </div>
      ) : null}
      {!selectedLabel ? (
        <Collapsible open={hatchOpen} onOpenChange={setHatchOpen}>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-auto px-0">
              {copy.composer.labelHatchToggle}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1.5 pt-2">
            <Label htmlFor={labelId}>{copy.composer.labelPlaceholder}</Label>
            <Input
              id={labelId}
              value={labelDraft}
              onChange={(event) => {
                setLabelDraft(event.target.value);
                if (labelError) setLabelError(undefined);
              }}
              placeholder={copy.composer.labelPlaceholder}
              disabled={disabled}
              error={Boolean(labelError)}
              {...getFieldErrorAriaProps(labelId, labelError)}
            />
            <FieldInlineError fieldId={labelId} message={labelError} />
            <p className="text-xs text-muted-foreground">{copy.composer.labelHint}</p>
            {trimmed ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={disabled}
                onClick={handleCompleteLabel}
              >
                {copy.action.completeAddress}
              </Button>
            ) : null}
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  );
}

export interface TripRouteComposerProps {
  rows: readonly RouteMasterRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddWaypoint: () => void;
  tripTimes?: TripScheduleTimes;
  disabled?: boolean;
  readOnly?: boolean;
  /**
   * ADR-0093 E1 — `pending-only`: filas locked vía `row.locked`; «Agregar escala» activo.
   * `full`: composer structural (draft/scheduled).
   */
  mode?: "full" | "pending-only";
  showVisitState?: boolean;
  corridor?: ReactNode;
}

export function TripRouteComposer({
  rows,
  selectedId,
  onSelect,
  onAddWaypoint,
  tripTimes,
  disabled = false,
  readOnly = false,
  mode = "full",
  showVisitState = false,
  corridor,
}: TripRouteComposerProps) {
  const showAddWaypoint = !readOnly;
  return (
    <div
      className="flex flex-col gap-1.5 md:max-h-[640px] md:overflow-y-auto md:border-r md:p-2"
      data-route-composer-mode={mode}
    >
      {corridor ? <div className="mb-1 px-0.5 pb-2">{corridor}</div> : null}
      {rows.map((row) => (
        <TripRouteMasterRow
          key={row.id}
          row={row}
          selected={selectedId === row.id}
          showVisitState={showVisitState}
          tripTimes={tripTimes}
          onSelect={onSelect}
        />
      ))}
      {showAddWaypoint ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-1"
          disabled={disabled}
          onClick={onAddWaypoint}
        >
          <Plus className="mr-2 h-4 w-4" />
          {copy.action.addWaypoint}
        </Button>
      ) : null}
    </div>
  );
}
