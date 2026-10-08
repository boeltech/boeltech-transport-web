import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import {
  FormValidationSummary,
  RHFSelectField,
  RHFTextareaField,
} from "@shared/ui/form";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { useToast } from "@shared/hooks";
import { useDeleteVehicle } from "../../application";
import {
  VehicleDeactivationReason,
  VEHICLE_DEACTIVATION_REASON_LABELS,
  isBillableMotrizNow,
  type VehicleDeactivationReasonCode,
} from "../../domain";
import { vehiclesCopy } from "../copy";
import {
  toDeactivateErrorView,
  type DeactivateErrorView,
} from "../utils/vehicleLifecycleErrors";
import { VehicleBillingPolicyNote } from "./VehicleBillingPolicyNote";
import type { VehicleLifecycleTarget } from "./vehicleLifecycleTarget";

const copy = vehiclesCopy.deactivate;
const MAX_TRIP_LINKS = 5;
const NOTE_MAX = 500;

const REASON_CODES = Object.values(VehicleDeactivationReason) as [
  VehicleDeactivationReasonCode,
  ...VehicleDeactivationReasonCode[],
];

const REASON_OPTIONS = REASON_CODES.map((code) => ({
  value: code,
  label: VEHICLE_DEACTIVATION_REASON_LABELS[code],
}));

const schema = z
  .object({
    reasonCode: z
      .string()
      .refine(
        (value) => (REASON_CODES as string[]).includes(value),
        copy.reasonRequired,
      ),
    reasonNote: z.string().max(NOTE_MAX, copy.noteMax),
  })
  .superRefine((data, ctx) => {
    if (
      data.reasonCode === VehicleDeactivationReason.OTHER &&
      data.reasonNote.trim() === ""
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reasonNote"],
        message: copy.noteRequired,
      });
    }
  });

type FormValues = z.infer<typeof schema>;

const EMPTY_VALUES: FormValues = { reasonCode: "", reasonNote: "" };

interface VehicleDeactivateDialogProps {
  vehicle: VehicleLifecycleTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeactivated?: () => void;
}

/** PRD D2/D3 — «Dar de baja» con motivo; errores de la API dentro del diálogo. */
export function VehicleDeactivateDialog({
  vehicle,
  open,
  onOpenChange,
  onDeactivated,
}: VehicleDeactivateDialogProps) {
  const { toast } = useToast();
  const [errorView, setErrorView] = useState<DeactivateErrorView | null>(null);
  const [showValidationSummary, setShowValidationSummary] = useState(false);

  const form = useForm<FormValues, unknown, FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: EMPTY_VALUES,
    mode: "onChange",
  });
  const { control } = form;
  const reasonCode = useWatch({ control, name: "reasonCode" });

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset(EMPTY_VALUES);
      setErrorView(null);
      setShowValidationSummary(false);
    }
    onOpenChange(next);
  };

  const unitNumber = vehicle?.unitNumber ?? "";

  const mutation = useDeleteVehicle({
    onSuccess: () => {
      toast({ title: copy.successToast(unitNumber), variant: "success" });
      handleOpenChange(false);
      onDeactivated?.();
    },
    onError: (error) => {
      setErrorView(toDeactivateErrorView(error));
    },
  });

  const handleSubmit = form.handleSubmit(
    (values) => {
      if (!vehicle) return;
      setShowValidationSummary(false);
      setErrorView(null);
      const note = values.reasonNote.trim();
      mutation.mutate({
        id: vehicle.id,
        payload: {
          reasonCode: values.reasonCode as VehicleDeactivationReasonCode,
          ...(note ? { reasonNote: note } : {}),
        },
      });
    },
    () => setShowValidationSummary(true),
  );

  const billable = vehicle
    ? isBillableMotrizNow({
        type: vehicle.type,
        status: vehicle.status,
        isActive: vehicle.isActive,
      })
    : false;
  const noteRequired = reasonCode === VehicleDeactivationReason.OTHER;
  const validationMessages = collectFieldErrorMessages(form.formState.errors);
  const closeDialog = () => handleOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-md">
        <DialogHeader className="shrink-0 space-y-1.5 px-6 pt-6 text-left">
          <DialogTitle>{copy.title(unitNumber)}</DialogTitle>
          <DialogDescription>
            {copy.description}
            {billable ? (
              <>
                {" "}
                <VehicleBillingPolicyNote kind="remove" />
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <p className="text-sm text-muted-foreground">{copy.outOfServiceHint}</p>

            {errorView ? (
              <DeactivateErrorAlert view={errorView} onNavigate={closeDialog} />
            ) : null}

            <RHFSelectField
              control={control}
              name="reasonCode"
              fieldId="vehicle-deactivation-reason"
              label={copy.reasonLabel}
              required
              placeholder={copy.reasonPlaceholder}
              options={REASON_OPTIONS}
            />

            <RHFTextareaField
              control={control}
              name="reasonNote"
              fieldId="vehicle-deactivation-note"
              label={copy.noteLabel}
              required={noteRequired}
              description={noteRequired ? copy.noteRequiredHint : copy.noteOptionalHint}
              placeholder={copy.notePlaceholder}
              maxLength={NOTE_MAX}
              rows={3}
            />

            {showValidationSummary && validationMessages.length > 0 ? (
              <FormValidationSummary
                title={copy.validationSummary}
                messages={validationMessages}
              />
            ) : null}
          </div>

          <DialogFooter className="shrink-0 border-t px-6 py-4 sm:space-x-2">
            <Button type="button" variant="outline" onClick={closeDialog}>
              {copy.cancel}
            </Button>
            <Button type="submit" variant="destructive" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {copy.submitting}
                </>
              ) : (
                copy.confirm
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeactivateErrorAlert({
  view,
  onNavigate,
}: {
  view: DeactivateErrorView;
  onNavigate: () => void;
}) {
  if (view.kind === "generic") {
    return (
      <Alert variant="destructive">
        <AlertTitle>{copy.errorTitle}</AlertTitle>
        <AlertDescription className="select-text whitespace-pre-wrap break-words">
          {view.message}
        </AlertDescription>
      </Alert>
    );
  }

  const shown = view.trips.slice(0, MAX_TRIP_LINKS);
  const remaining = view.total - shown.length;

  return (
    <Alert variant="destructive">
      <AlertTitle>{copy.activeTrips.title}</AlertTitle>
      <AlertDescription className="select-text break-words">
        {shown.length > 0 ? (
          <>
            {copy.activeTrips.lead}{" "}
            {shown.map((trip, index) => (
              <span key={trip.id}>
                {index > 0 ? ", " : null}
                <Link
                  to={`/trips/${trip.id}`}
                  onClick={onNavigate}
                  className="font-medium underline underline-offset-2"
                >
                  {trip.tripCode}
                </Link>
              </span>
            ))}
            {remaining > 0 ? ` ${copy.activeTrips.more(remaining)}` : null}.
          </>
        ) : (
          <>
            {view.message}{" "}
            <Link
              to="/trips"
              onClick={onNavigate}
              className="font-medium underline underline-offset-2"
            >
              {copy.activeTrips.goToTrips}
            </Link>
          </>
        )}
      </AlertDescription>
    </Alert>
  );
}
