import { useEffect, useState } from "react";

import { useUpdateTrip } from "@features/trips/application/hooks/trip/useUpdateTrip";
import type { Trip } from "@features/trips/domain";
import { useToast } from "@shared/hooks";
import { Button } from "@shared/ui/button";
import { FieldInlineError, FormFieldShell, getFieldErrorAriaProps } from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { InfoRow } from "@shared/ui/data-display";
import { formatDateTime } from "@shared/utils/dateUtils";
import { utcIsoToLocalInput } from "@shared/utils/dateUtils";

import { buildScheduleUpdateInput, type TripScheduleFormValues } from "../trip-detail-patch";
import {
  formatTripApiValidationForUser,
  validateUpdateTripApiPayload,
} from "../../pages/create/validateTripApiPayload";

export interface TripScheduleInlineEditorProps {
  trip: Trip;
  readOnly: boolean;
}

export function TripScheduleInlineEditor({
  trip,
  readOnly,
}: TripScheduleInlineEditorProps) {
  const { id: tripId, scheduledDeparture, scheduledArrival } = trip;
  const { toast } = useToast();
  const [draft, setDraft] = useState<TripScheduleFormValues>(() => ({
    scheduledDeparture: utcIsoToLocalInput(scheduledDeparture.toISOString()),
    scheduledArrival: scheduledArrival
      ? utcIsoToLocalInput(scheduledArrival.toISOString())
      : "",
  }));
  const [fieldError, setFieldError] = useState<string | null>(null);

  const updateTrip = useUpdateTrip({
    onSuccess: () => {
      toast({ title: "Programación actualizada", variant: "success" });
    },
    onError: (error) => {
      toast({
        title: "No se pudo guardar la programación",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    setDraft({
      scheduledDeparture: utcIsoToLocalInput(scheduledDeparture.toISOString()),
      scheduledArrival: scheduledArrival
        ? utcIsoToLocalInput(scheduledArrival.toISOString())
        : "",
    });
    setFieldError(null);
  }, [trip.updatedAt, scheduledDeparture, scheduledArrival]);

  const persisted: TripScheduleFormValues = {
    scheduledDeparture: utcIsoToLocalInput(scheduledDeparture.toISOString()),
    scheduledArrival: scheduledArrival
      ? utcIsoToLocalInput(scheduledArrival.toISOString())
      : "",
  };

  const isDirty =
    draft.scheduledDeparture !== persisted.scheduledDeparture ||
    draft.scheduledArrival !== persisted.scheduledArrival;

  const handleSave = async () => {
    setFieldError(null);
    if (!draft.scheduledDeparture.trim()) {
      setFieldError("La salida programada es obligatoria.");
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

  if (readOnly) {
    return (
      <>
        <InfoRow
          variant="inline"
          label="Salida"
          value={formatDateTime(scheduledDeparture.toISOString())}
        />
        <InfoRow
          variant="inline"
          label="Llegada estimada"
          value={formatDateTime(scheduledArrival?.toISOString())}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <FormFieldShell
        fieldId="trip-schedule-departure"
        label="Salida programada"
        required
        errorMessage={fieldError ?? undefined}
      >
        <Input
          id="trip-schedule-departure"
          type="datetime-local"
          value={draft.scheduledDeparture}
          onChange={(event) =>
            setDraft((prev) => ({ ...prev, scheduledDeparture: event.target.value }))
          }
          disabled={updateTrip.isPending}
          error={Boolean(fieldError)}
          {...getFieldErrorAriaProps("trip-schedule-departure", fieldError ?? undefined)}
        />
      </FormFieldShell>
      <FormFieldShell fieldId="trip-schedule-arrival" label="Llegada estimada">
        <Input
          id="trip-schedule-arrival"
          type="datetime-local"
          value={draft.scheduledArrival}
          onChange={(event) =>
            setDraft((prev) => ({ ...prev, scheduledArrival: event.target.value }))
          }
          disabled={updateTrip.isPending}
        />
      </FormFieldShell>
      {fieldError ? <FieldInlineError>{fieldError}</FieldInlineError> : null}
      {isDirty ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => void handleSave()}
            disabled={updateTrip.isPending}
          >
            {updateTrip.isPending ? "Guardando…" : "Guardar programación"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={updateTrip.isPending}
          >
            Cancelar
          </Button>
        </div>
      ) : null}
    </div>
  );
}
