import { useEffect, useState } from "react";

import { useUpdateTrip } from "@features/trips/application";
import {
  TRIP_ROUTE_TYPE_LABELS,
  TripRouteType,
  type Trip,
  type TripRouteTypeValue,
} from "@features/trips/domain";
import { isApiError } from "@shared/api/interceptors/error-handler";
import { useToast } from "@shared/hooks";
import { Button } from "@shared/ui/button";
import { FormFieldShell, getFieldErrorAriaProps } from "@shared/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";

import { operationCopy } from "../../copy";
import { showTripDetailErrorToast } from "../../helpers/toastTripDetailError";

const copy = operationCopy;

const ROUTE_TYPE_OPTIONS = [
  TripRouteType.LONG_HAUL,
  TripRouteType.LOCAL,
  TripRouteType.TRANSFER,
] as const;

export interface TripRouteTypeInlineEditorProps {
  trip: Trip;
  readOnly: boolean;
  /** RP-8: fila clave/valor con «Cambiar» (selector no vive abierto). */
  presentation?: "row" | "form";
}

function resolveRouteType(trip: Trip): TripRouteTypeValue {
  return trip.routeType ?? TripRouteType.LONG_HAUL;
}

function TripRouteTypeInlineEditorEditable({
  trip,
  presentation = "row",
}: {
  trip: Trip;
  presentation?: "row" | "form";
}) {
  const { id: tripId } = trip;
  const persisted = resolveRouteType(trip);
  const { toast } = useToast();
  const [draft, setDraft] = useState<TripRouteTypeValue>(persisted);
  const [editing, setEditing] = useState(false);

  const updateTrip = useUpdateTrip({
    onSuccess: () => {
      toast({ title: copy.toast.routeTypeUpdated, variant: "success" });
      setEditing(false);
    },
    onError: (error) => {
      if (
        isApiError(error) &&
        error.code === "TRIP_ROUTE_TYPE_LOCKED_BY_SETTLEMENT"
      ) {
        toast({
          title: copy.toast.routeTypeUpdateError,
          description: copy.toast.routeTypeLockedBySettlement,
          variant: "error",
        });
        return;
      }
      showTripDetailErrorToast(
        toast,
        error,
        copy.toast.routeTypeUpdateError,
      );
    },
  });

  const isDirty = draft !== persisted;
  const isPending = updateTrip.isPending;

  useEffect(() => {
    if (isDirty) return;
    setDraft(resolveRouteType(trip));
  }, [trip.routeType, isDirty, trip]);

  const handleSave = async () => {
    try {
      await updateTrip.mutateAsync({
        id: tripId,
        data: { routeType: draft },
      });
    } catch {
      // Toast en onError
    }
  };

  const handleCancel = () => {
    setDraft(persisted);
    setEditing(false);
  };

  const label = TRIP_ROUTE_TYPE_LABELS[persisted];

  if (presentation === "row" && !editing) {
    return (
      <div
        className="flex flex-col gap-1 py-1.5 sm:flex-row sm:items-baseline sm:gap-6"
        data-testid="trip-route-type-row"
      >
        <span className="w-40 shrink-0 text-sm text-muted-foreground">
          {copy.label.routeType}
        </span>
        <span className="text-sm">
          {label}
          {" · "}
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => setEditing(true)}
          >
            {copy.action.changeRouteType}
          </button>
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <FormFieldShell
        fieldId="trip-detail-route-type"
        label={copy.label.routeType}
        description={copy.hint.routeType}
      >
        <Select
          value={draft}
          onValueChange={(value) => {
            if (
              value === TripRouteType.LOCAL ||
              value === TripRouteType.LONG_HAUL ||
              value === TripRouteType.TRANSFER
            ) {
              setDraft(value);
            }
          }}
          disabled={isPending}
        >
          <SelectTrigger
            id="trip-detail-route-type"
            {...getFieldErrorAriaProps("trip-detail-route-type")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROUTE_TYPE_OPTIONS.map((value) => (
              <SelectItem key={value} value={value}>
                {TRIP_ROUTE_TYPE_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormFieldShell>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => void handleSave()}
          disabled={isPending || !isDirty}
        >
          {isPending ? copy.action.savingRouteType : copy.action.saveRouteType}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleCancel}
          disabled={isPending}
        >
          {copy.action.cancel}
        </Button>
      </div>
    </div>
  );
}

export function TripRouteTypeInlineEditor({
  trip,
  readOnly,
  presentation = "row",
}: TripRouteTypeInlineEditorProps) {
  if (readOnly) {
    return (
      <div className="flex flex-col gap-1 py-1.5 sm:flex-row sm:items-baseline sm:gap-6">
        <span className="w-40 shrink-0 text-sm text-muted-foreground">
          {copy.label.routeType}
        </span>
        <span className="text-sm">
          {TRIP_ROUTE_TYPE_LABELS[resolveRouteType(trip)]}
        </span>
      </div>
    );
  }

  return (
    <TripRouteTypeInlineEditorEditable
      trip={trip}
      presentation={presentation}
    />
  );
}
