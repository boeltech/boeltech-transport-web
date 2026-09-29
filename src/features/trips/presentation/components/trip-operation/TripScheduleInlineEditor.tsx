import { useEffect, useState } from "react";

import { useReplaceTripStops, useUpdateTrip } from "@features/trips/application";
import type { Trip } from "@features/trips/domain";
import { useToast } from "@shared/hooks";
import { Button } from "@shared/ui/button";
import {
  DateTimeField,
  FieldInlineError,
  FormFieldShell,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { InfoRow } from "@shared/ui/data-display";
import { formatDateTime } from "@shared/utils/dateUtils";
import { utcIsoToLocalInput } from "@shared/utils/dateUtils";

import { operationCopy } from "../../copy";
import { showTripDetailErrorToast } from "../../helpers/toastTripDetailError";
import { tripScheduleDateTimeFieldProps } from "../../scheduleDateTimeField";

import {
  buildScheduleDestinationEtaReplaceStops,
  buildScheduleUpdateInput,
  type TripScheduleFormValues,
} from "../trip-detail-patch";
import {
  formatTripApiValidationForUser,
  validateUpdateTripApiPayload,
} from "../../pages/create/validateTripApiPayload";

export interface TripScheduleInlineEditorProps {
  trip: Trip;
  readOnly: boolean;
}

function tripToScheduleFormValues(trip: Trip): TripScheduleFormValues {
  return {
    scheduledDeparture: utcIsoToLocalInput(trip.scheduledDeparture.toISOString()),
    scheduledArrival: trip.scheduledArrival
      ? utcIsoToLocalInput(trip.scheduledArrival.toISOString())
      : "",
  };
}

function TripScheduleInlineEditorEditable({ trip }: { trip: Trip }) {
  const { id: tripId } = trip;
  const persisted = tripToScheduleFormValues(trip);
  const { toast } = useToast();
  const [draft, setDraft] = useState<TripScheduleFormValues>(persisted);
  const [departureError, setDepartureError] = useState<string | null>(null);
  const [arrivalError, setArrivalError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const scheduleFieldProps = tripScheduleDateTimeFieldProps(operationCopy.preset);

  const clearErrors = () => {
    setDepartureError(null);
    setArrivalError(null);
    setFormError(null);
  };

  const updateTrip = useUpdateTrip({
    onError: (error) => {
      showTripDetailErrorToast(
        toast,
        error,
        operationCopy.toast.scheduleUpdateError,
      );
    },
  });

  const replaceStops = useReplaceTripStops(tripId, {
    onError: (error) => {
      showTripDetailErrorToast(
        toast,
        error,
        operationCopy.toast.scheduleUpdateError,
      );
    },
  });

  const isPending = updateTrip.isPending || replaceStops.isPending;

  const isDirty =
    draft.scheduledDeparture !== persisted.scheduledDeparture ||
    draft.scheduledArrival !== persisted.scheduledArrival;

  useEffect(() => {
    if (isDirty) return;
    setDraft(tripToScheduleFormValues(trip));
  }, [
    trip.scheduledDeparture.getTime(),
    trip.scheduledArrival?.getTime(),
    isDirty,
    trip,
  ]);

  const handleSave = async () => {
    clearErrors();
    if (!draft.scheduledDeparture.trim()) {
      setDepartureError(operationCopy.error.departureRequired);
      return;
    }

    const payload = buildScheduleUpdateInput(trip, draft);
    const validation = validateUpdateTripApiPayload(payload);
    if (!validation.ok) {
      const message = formatTripApiValidationForUser(validation.fieldErrors, 2);
      const paths = Object.keys(validation.fieldErrors);
      if (paths.some((path) => /^scheduled_arrival/i.test(path))) {
        setArrivalError(message);
      } else if (paths.some((path) => /^scheduled_departure/i.test(path))) {
        setDepartureError(message);
      } else {
        setFormError(message);
      }
      return;
    }

    try {
      await updateTrip.mutateAsync({ id: tripId, data: payload });

      const replacePayload = buildScheduleDestinationEtaReplaceStops(trip, draft);
      if (replacePayload) {
        await replaceStops.mutateAsync(replacePayload);
      }

      toast({ title: operationCopy.toast.scheduleUpdated, variant: "success" });
    } catch {
      // Toast en onError de las mutaciones
    }
  };

  const handleCancel = () => {
    setDraft(persisted);
    clearErrors();
  };

  return (
    <div className="space-y-4">
      <FormFieldShell
        fieldId="trip-schedule-departure"
        label={operationCopy.label.scheduledDeparture}
        required
        errorMessage={departureError ?? undefined}
      >
        <DateTimeField
          id="trip-schedule-departure"
          value={draft.scheduledDeparture}
          onChange={(scheduledDeparture) =>
            setDraft((prev) => ({ ...prev, scheduledDeparture }))
          }
          disabled={isPending}
          error={Boolean(departureError)}
          {...scheduleFieldProps}
          {...getFieldErrorAriaProps(
            "trip-schedule-departure",
            departureError ?? undefined,
          )}
        />
      </FormFieldShell>
      <FormFieldShell
        fieldId="trip-schedule-arrival"
        label={operationCopy.label.scheduledArrival}
        errorMessage={arrivalError ?? undefined}
      >
        <DateTimeField
          id="trip-schedule-arrival"
          value={draft.scheduledArrival}
          onChange={(scheduledArrival) =>
            setDraft((prev) => ({ ...prev, scheduledArrival }))
          }
          disabled={isPending}
          error={Boolean(arrivalError)}
          {...scheduleFieldProps}
          {...getFieldErrorAriaProps(
            "trip-schedule-arrival",
            arrivalError ?? undefined,
          )}
        />
      </FormFieldShell>
      {formError ? (
        <FieldInlineError fieldId="trip-schedule-form" message={formError} />
      ) : null}
      {isDirty ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => void handleSave()}
            disabled={isPending}
          >
            {isPending
              ? operationCopy.action.savingSchedule
              : operationCopy.action.saveSchedule}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isPending}
          >
            {operationCopy.action.cancelSchedule}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function TripScheduleInlineEditor({
  trip,
  readOnly,
}: TripScheduleInlineEditorProps) {
  const { scheduledDeparture, scheduledArrival } = trip;

  if (readOnly) {
    return (
      <>
        <InfoRow
          variant="inline"
          label={operationCopy.label.scheduledDepartureReadOnly}
          value={formatDateTime(scheduledDeparture.toISOString())}
        />
        <InfoRow
          variant="inline"
          label={operationCopy.label.scheduledArrival}
          value={formatDateTime(scheduledArrival?.toISOString())}
        />
      </>
    );
  }

  return (
    <TripScheduleInlineEditorEditable trip={trip} />
  );
}
