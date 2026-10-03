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
import { InfoRow } from "@shared/ui/data-display";
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
}

function resolveRouteType(trip: Trip): TripRouteTypeValue {
  return trip.routeType ?? TripRouteType.LONG_HAUL;
}

function TripRouteTypeInlineEditorEditable({ trip }: { trip: Trip }) {
  const { id: tripId } = trip;
  const persisted = resolveRouteType(trip);
  const { toast } = useToast();
  const [draft, setDraft] = useState<TripRouteTypeValue>(persisted);

  const updateTrip = useUpdateTrip({
    onSuccess: () => {
      toast({ title: copy.toast.routeTypeUpdated, variant: "success" });
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
  };

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
      {isDirty ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => void handleSave()}
            disabled={isPending}
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
      ) : null}
    </div>
  );
}

export function TripRouteTypeInlineEditor({
  trip,
  readOnly,
}: TripRouteTypeInlineEditorProps) {
  if (readOnly) {
    return (
      <InfoRow
        variant="inline"
        label={copy.label.routeType}
        value={TRIP_ROUTE_TYPE_LABELS[resolveRouteType(trip)]}
      />
    );
  }

  return <TripRouteTypeInlineEditorEditable trip={trip} />;
}
