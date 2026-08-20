import { type ReactNode, useState } from "react";
import { Flag, MapPin, Navigation, Plus } from "lucide-react";

import type { AddressSearchListItem } from "@shared/ui/address-picker/types";
import { AddressPicker } from "@shared/ui/address-picker";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
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

import { tripDetailCopy } from "../../copy";
import { ownerTypesForRouteSlot, isAllowedRoutePickerItem } from "./routeAddressPickerOwnerTypes";
import {
  getStopOperationalVisitLabel,
  getStopOperationalVisitState,
  isStopDomicilioComplete,
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
  const visitLabel =
    showVisitState && row.stop != null
      ? getStopOperationalVisitLabel(
          getStopOperationalVisitState(row.stop, row.category, tripTimes),
          row.category,
        )
      : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(row.id)}
      aria-pressed={selected}
      aria-label={`${title}. ${subtitle}`}
      className={cn(
        "group w-full rounded-md border p-3 text-left transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-background shadow-sm"
          : "border-transparent bg-card hover:border-border",
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
          <SlotIcon category={row.category} />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-medium">{title}</span>
            {visitLabel ? (
              <Badge variant="secondary" className="font-normal">
                {visitLabel}
              </Badge>
            ) : null}
            {missingDomicilio ? (
              <Badge variant="warning" tone="soft" className="text-xs font-normal">
                {copy.chip.missingAddress}
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
  selectedLabel?: string | null;
  cityHint?: string | null;
  disabled?: boolean;
  onPick: (category: RouteStopCategory, item: AddressSearchListItem) => void;
  onCompleteLabel: (category: RouteStopCategory, locationName: string) => void;
}

export function TripRouteSlotCapture({
  category,
  selectedLabel,
  cityHint,
  disabled,
  onPick,
  onCompleteLabel,
}: TripRouteSlotCaptureProps) {
  const [labelDraft, setLabelDraft] = useState("");
  const [hatchOpen, setHatchOpen] = useState(false);
  const [labelError, setLabelError] = useState<string | undefined>();
  const title = slotTitle(category);
  const pickerLabel = `${title}: ${copy.composer.pickerLabel}`;
  const labelId = `trip-route-composer-${category}-label`;
  const trimmed = labelDraft.trim();
  const hint = cityHint?.trim();

  const handleCompleteLabel = () => {
    if (!trimmed) {
      setLabelError(copy.composer.labelHint);
      return;
    }
    setLabelError(undefined);
    onCompleteLabel(category, trimmed);
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
      <AddressPicker
        onSelect={(item) => onPick(category, item)}
        label={pickerLabel}
        disabled={disabled}
        defaultOwnerTypes={ownerTypesForRouteSlot(category)}
        filterItem={isAllowedRoutePickerItem}
      />
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
  showVisitState = false,
  corridor,
}: TripRouteComposerProps) {
  return (
    <div className="flex flex-col gap-1.5 md:max-h-[640px] md:overflow-y-auto md:border-r md:p-2">
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
      {readOnly ? null : (
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
      )}
    </div>
  );
}
