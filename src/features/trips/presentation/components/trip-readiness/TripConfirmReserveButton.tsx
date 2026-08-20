import { useState } from "react";
import { Calendar, Loader2 } from "lucide-react";

import { useClientCreditSummary } from "@features/clients/application";
import { useScheduleTrip, useUpdateTrip } from "@features/trips/application";
import { TripStatus, type Trip, type TripStatusType } from "@features/trips/domain";
import { useToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
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
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { CreditExposureCard } from "@shared/ui/data-display";
import {
  DateTimeField,
  FormFieldShell,
  getFieldErrorAriaProps,
  MoneyInput,
} from "@shared/ui/form";
import { SectionHeadingWithHint } from "@shared/ui/hint-icon";
import { Input } from "@shared/ui/input";
import { localInputToUtcIso, utcIsoToLocalInput } from "@shared/utils/dateUtils";

import { parseStartMileageInput } from "../startTripMileage";
import { tripDetailCopy, wizardCopy } from "../../copy";
import { tripScheduleDateTimeFieldProps } from "../../scheduleDateTimeField";

const copy = tripDetailCopy.shell;
const basic = wizardCopy.basicInfo;
const LONG_ERROR_CHARS = 160;

export interface TripConfirmReserveButtonProps {
  tripId: string;
  tripCode: string;
  status: TripStatusType;
  clientId?: string | null;
  prospectiveAmount?: number;
  cfdiDocumentIntent?: "ingreso" | "traslado" | null;
  scheduledArrival?: Date | null;
  fleetReady?: boolean;
  /** Odómetro ya persistido en el viaje. `null`/`undefined` = falta capturar. `0` es válido. */
  startMileage?: number | null;
  /** Sugerencia desde el odómetro actual de la unidad (incluye 0). */
  suggestedStartMileage?: number | null;
  onActionComplete?: (trip?: Trip) => void;
}

export function TripConfirmReserveButton({
  tripId,
  tripCode,
  status,
  clientId,
  prospectiveAmount,
  cfdiDocumentIntent,
  scheduledArrival,
  fleetReady = true,
  startMileage,
  suggestedStartMileage,
  onActionComplete,
}: TripConfirmReserveButtonProps) {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [open, setOpen] = useState(false);
  const [mileageInput, setMileageInput] = useState("");
  const [arrivalInput, setArrivalInput] = useState("");
  const [rateInput, setRateInput] = useState<number | undefined>(undefined);
  const [mileageError, setMileageError] = useState<string | null>(null);
  const [arrivalError, setArrivalError] = useState<string | null>(null);
  const [rateError, setRateError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const canSchedule =
    status === TripStatus.DRAFT && hasPermission("trips", "update");
  const needsStartMileage = startMileage == null;
  const needsArrival = scheduledArrival == null;
  const needsRate =
    cfdiDocumentIntent !== "traslado" && !(Number(prospectiveAmount) > 0);

  const creditQuery = useClientCreditSummary(
    clientId ?? undefined,
    prospectiveAmount,
    { enabled: open && Boolean(clientId) },
  );

  const updateTrip = useUpdateTrip();

  const scheduleMutation = useScheduleTrip({
    onSuccess: (trip) => {
      toast({
        title: copy.toast.scheduledTitle,
        description: copy.toast.scheduledBody(tripCode),
        variant: "success",
      });
      onActionComplete?.(trip);
      setOpen(false);
      setScheduleError(null);
    },
    onError: (error) => {
      const message = error.message;
      setScheduleError(message);
      if (message.length <= LONG_ERROR_CHARS) {
        toast({
          title: copy.toast.scheduleError,
          description: message,
          variant: "error",
        });
      }
    },
  });

  const isPending = scheduleMutation.isPending || updateTrip.isPending;
  const scheduleFieldProps = tripScheduleDateTimeFieldProps(basic.preset);

  const openDialog = () => {
    setMileageError(null);
    setArrivalError(null);
    setRateError(null);
    setScheduleError(null);
    setMileageInput(
      suggestedStartMileage != null ? String(suggestedStartMileage) : "",
    );
    setArrivalInput(
      scheduledArrival
        ? utcIsoToLocalInput(scheduledArrival.toISOString())
        : "",
    );
    setRateInput(
      Number(prospectiveAmount) > 0 ? prospectiveAmount : undefined,
    );
    setOpen(true);
  };

  const handleConfirm = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setMileageError(null);
    setArrivalError(null);
    setRateError(null);
    setScheduleError(null);

    const patch: {
      startMileage?: number;
      scheduledArrival?: string;
      baseRate?: number;
    } = {};

    if (needsStartMileage) {
      const parsed = parseStartMileageInput(mileageInput);
      if (parsed == null) {
        setMileageError(copy.alert.draftConfirmMileageRequired);
        return;
      }
      patch.startMileage = parsed;
    }

    if (needsArrival) {
      if (!arrivalInput.trim()) {
        setArrivalError(copy.alert.draftConfirmArrivalRequired);
        return;
      }
      patch.scheduledArrival = localInputToUtcIso(arrivalInput);
    }

    if (needsRate) {
      if (rateInput == null || rateInput <= 0) {
        setRateError(copy.alert.draftConfirmRateRequired);
        return;
      }
      patch.baseRate = rateInput;
    }

    try {
      if (Object.keys(patch).length > 0) {
        await updateTrip.mutateAsync({
          id: tripId,
          data: patch,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : copy.alert.draftConfirmMileageRequired;
      setScheduleError(message);
      if (message.length <= LONG_ERROR_CHARS) {
        toast({
          title: copy.toast.scheduleError,
          description: message,
          variant: "error",
        });
      }
      return;
    }
    scheduleMutation.mutate(tripId);
  };

  if (!canSchedule) {
    return null;
  }

  const disabled = isPending || !fleetReady;
  const confirmLabel = !fleetReady
    ? `${copy.action.confirmReserve}. ${copy.alert.draftConfirmFleetBlocked}`
    : copy.action.confirmReserve;

  return (
    <>
      <Button
        size="sm"
        onClick={openDialog}
        disabled={disabled}
        aria-label={confirmLabel}
      >
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Calendar className="mr-2 h-4 w-4" />
        )}
        {copy.action.confirmReserve}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <SectionHeadingWithHint
                noTitleWrap
                title={<span>{copy.alert.draftConfirmTitle}</span>}
                hintLabel={copy.alert.draftConfirmTitle}
                hint={copy.alert.draftConfirmHint}
              />
            </AlertDialogTitle>
            <AlertDialogDescription className="sr-only">
              {copy.alert.draftConfirmHint}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {needsArrival || needsRate || needsStartMileage ? (
            <p className="text-sm text-muted-foreground">
              {copy.alert.draftConfirmMissingTitle}
            </p>
          ) : null}
          {needsArrival ? (
            <FormFieldShell
              fieldId="confirm-scheduled-arrival"
              label={copy.alert.draftConfirmArrivalLabel}
              required
              errorMessage={arrivalError ?? undefined}
            >
              <DateTimeField
                id="confirm-scheduled-arrival"
                value={arrivalInput}
                onChange={setArrivalInput}
                error={Boolean(arrivalError)}
                {...scheduleFieldProps}
                {...getFieldErrorAriaProps(
                  "confirm-scheduled-arrival",
                  arrivalError,
                )}
              />
            </FormFieldShell>
          ) : null}
          {needsRate ? (
            <FormFieldShell
              fieldId="confirm-base-rate"
              label={copy.alert.draftConfirmRateLabel}
              required
              errorMessage={rateError ?? undefined}
            >
              <MoneyInput
                id="confirm-base-rate"
                value={rateInput}
                onValueChange={setRateInput}
                error={Boolean(rateError)}
                {...getFieldErrorAriaProps("confirm-base-rate", rateError)}
              />
            </FormFieldShell>
          ) : null}
          {needsStartMileage ? (
            <FormFieldShell
              fieldId="confirm-start-mileage"
              label={copy.alert.draftConfirmMileageLabel}
              required
              errorMessage={mileageError ?? undefined}
              description={copy.alert.draftConfirmMileageHint}
            >
              <Input
                id="confirm-start-mileage"
                type="number"
                min={0}
                inputMode="numeric"
                value={mileageInput}
                onChange={(e) => {
                  setMileageInput(e.target.value);
                  setMileageError(null);
                }}
                error={Boolean(mileageError)}
                {...getFieldErrorAriaProps(
                  "confirm-start-mileage",
                  mileageError,
                )}
              />
            </FormFieldShell>
          ) : null}
          {scheduleError ? (
            <Alert variant="destructive">
              <AlertDescription>{scheduleError}</AlertDescription>
            </Alert>
          ) : null}
          {clientId ? (
            <CreditExposureCard
              variant="compact"
              summary={creditQuery.data}
              isLoading={creditQuery.isLoading}
              isError={creditQuery.isError}
            />
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.action.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => handleConfirm(event)}
              disabled={isPending}
            >
              {copy.action.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
