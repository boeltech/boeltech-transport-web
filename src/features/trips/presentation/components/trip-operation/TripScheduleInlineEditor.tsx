import { useState } from "react";

import { useUpdateTrip } from "@features/trips/application";
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
import { tripScheduleDateTimeFieldProps } from "../../scheduleDateTimeField";

import { buildScheduleUpdateInput, type TripScheduleFormValues } from "../trip-detail-patch";
import {
  formatTripApiValidationForUser,
  validateUpdateTripApiPayload,
} from "../../pages/create/validateTripApiPayload";

export interface TripScheduleInlineEditorProps {
  trip: Trip;
  readOnly: boolean;
}

function tripScheduleSyncKey(trip: Trip): string {
  return [
    trip.updatedAt.getTime(),
    trip.scheduledDeparture.getTime(),
    trip.scheduledArrival?.getTime() ?? "",
  ].join("-");
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
  const [fieldError, setFieldError] = useState<string | null>(null);
  const scheduleFieldProps = tripScheduleDateTimeFieldProps(operationCopy.preset);

  const updateTrip = useUpdateTrip({
    onSuccess: () => {
      toast({ title: operationCopy.toast.scheduleUpdated, variant: "success" });
    },
    onError: (error) => {
      toast({
        title: operationCopy.toast.scheduleUpdateError,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isDirty =
    draft.scheduledDeparture !== persisted.scheduledDeparture ||
    draft.scheduledArrival !== persisted.scheduledArrival;

  const handleSave = async () => {
    setFieldError(null);
    if (!draft.scheduledDeparture.trim()) {
      setFieldError(operationCopy.error.departureRequired);
      return;
    }

    const payload = buildScheduleUpdateInput(trip, draft);
    const validation = validateUpdateTripApiPayload(payload);
    if (!validation.ok) {
      setFieldError(formatTripApiValidationForUser(validation.fieldErrors, 2));
      return;
    }

    try {
      await updateTrip.mutateAsync({ id: tripId, data: payload });
    } catch {
      // Toast en onError del mutation
    }
  };

  const handleCancel = () => {
    setDraft(persisted);
    setFieldError(null);
  };

  return (
    <div className="space-y-4">
      <FormFieldShell
        fieldId="trip-schedule-departure"
        label={operationCopy.label.scheduledDeparture}
        required
        errorMessage={fieldError ?? undefined}
      >
        <DateTimeField
          id="trip-schedule-departure"
          value={draft.scheduledDeparture}
          onChange={(scheduledDeparture) =>
            setDraft((prev) => ({ ...prev, scheduledDeparture }))
          }
          disabled={updateTrip.isPending}
          error={Boolean(fieldError)}
          {...scheduleFieldProps}
          {...getFieldErrorAriaProps("trip-schedule-departure", fieldError ?? undefined)}
        />
      </FormFieldShell>
      <FormFieldShell
        fieldId="trip-schedule-arrival"
        label={operationCopy.label.scheduledArrival}
      >
        <DateTimeField
          id="trip-schedule-arrival"
          value={draft.scheduledArrival}
          onChange={(scheduledArrival) =>
            setDraft((prev) => ({ ...prev, scheduledArrival }))
          }
          disabled={updateTrip.isPending}
          {...scheduleFieldProps}
        />
      </FormFieldShell>
      {fieldError ? (
        <FieldInlineError fieldId="trip-schedule-form" message={fieldError} />
      ) : null}
      {isDirty ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => void handleSave()}
            disabled={updateTrip.isPending}
          >
            {updateTrip.isPending
              ? operationCopy.action.savingSchedule
              : operationCopy.action.saveSchedule}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={updateTrip.isPending}
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
    <TripScheduleInlineEditorEditable
      key={tripScheduleSyncKey(trip)}
      trip={trip}
    />
  );
}
