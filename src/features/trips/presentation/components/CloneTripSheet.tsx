/**
 * Sheet — Clonar viaje (Ola 1 F1).
 * POST /trips/:tripId/clone con fechas obligatorias en UX.
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Copy } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import {
  FormValidationSummary,
  RHFDateTimeField,
} from "@shared/ui/form";
import { useOverlayMutationFeedback, useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { formatGroupedWarningDescription } from "@shared/utils/overlayErrorFeedback";
import { localInputToUtcIso } from "@shared/utils/dateUtils";

import { useCloneTrip } from "@features/trips/application";
import { cloneTripCopy } from "../copy/cloneTripCopy";
import { tripScheduleDateTimeFieldProps } from "../scheduleDateTimeField";

const SHEET_CONTENT_CLASS =
  "flex h-full w-full flex-col overflow-hidden sm:max-w-md";
const SHEET_HEADER_CLASS = "shrink-0";
const SHEET_BODY_CLASS = "min-h-0 flex-1 space-y-4 overflow-y-auto py-2";
const SHEET_FOOTER_CLASS =
  "mt-auto shrink-0 flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end sm:space-x-2";

const copy = cloneTripCopy;

const cloneFormSchema = z
  .object({
    scheduledDeparture: z
      .string()
      .trim()
      .min(1, copy.validation.departureRequired),
    scheduledArrival: z
      .string()
      .trim()
      .min(1, copy.validation.arrivalRequired),
  })
  .refine(
    (data) => {
      if (!data.scheduledDeparture || !data.scheduledArrival) return true;
      return (
        localInputToUtcIso(data.scheduledArrival) >=
        localInputToUtcIso(data.scheduledDeparture)
      );
    },
    {
      message: copy.validation.arrivalAfterDeparture,
      path: ["scheduledArrival"],
    },
  );

type CloneFormValues = z.infer<typeof cloneFormSchema>;

export interface CloneTripSheetProps {
  tripId: string;
  tripCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fechas del viaje origen (local input) para precargar el formulario. */
  defaultDepartureLocal?: string;
  defaultArrivalLocal?: string;
}

function CloneTripSheetBody({
  tripId,
  onOpenChange,
  defaultDepartureLocal,
  defaultArrivalLocal,
}: Omit<CloneTripSheetProps, "open" | "tripCode">) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { submissionError, showOverlayError, clearOverlayError } =
    useOverlayMutationFeedback({
      errorTitle: copy.toast.error,
      seeInlineCopy: copy.toast.overlayErrorSeeInline,
      toast,
    });
  const scheduleFieldProps = tripScheduleDateTimeFieldProps(copy.preset);

  const form = useForm<CloneFormValues>({
    resolver: zodResolver(cloneFormSchema) as Resolver<CloneFormValues>,
    defaultValues: {
      scheduledDeparture: defaultDepartureLocal ?? "",
      scheduledArrival: defaultArrivalLocal ?? "",
    },
    mode: "onSubmit",
  });

  useEffect(() => {
    form.reset({
      scheduledDeparture: defaultDepartureLocal ?? "",
      scheduledArrival: defaultArrivalLocal ?? "",
    });
    clearOverlayError();
  }, [tripId, defaultDepartureLocal, defaultArrivalLocal, form, clearOverlayError]);

  const mutation = useCloneTrip();

  const onValid = async (values: CloneFormValues) => {
    clearOverlayError();
    try {
      const result = await mutation.mutateAsync({
        sourceTripId: tripId,
        input: {
          scheduledDeparture: localInputToUtcIso(values.scheduledDeparture),
          scheduledArrival: localInputToUtcIso(values.scheduledArrival),
        },
      });

      toast({
        title: copy.toast.successTitle,
        description: copy.toast.success(result.summary.tripCode),
        variant: "success",
      });

      // D6: máx. 1 toast warning agrupado (no bucle N).
      if (result.warnings?.length) {
        toast({
          title: copy.toast.overlapWarningTitle,
          description: formatGroupedWarningDescription(
            result.warnings.map((w) => w.message),
          ),
          variant: "warning",
        });
      }

      onOpenChange(false);
      navigate(`/trips/${result.trip.id}`);
    } catch (error) {
      showOverlayError(getErrorMessage(error));
    }
  };

  const summaryErrors = collectFieldErrorMessages(form.formState.errors);
  const isPending = mutation.isPending;

  return (
    <>
      <form
        id="clone-trip-form"
        className={SHEET_BODY_CLASS}
        onSubmit={form.handleSubmit(onValid)}
        noValidate
      >
        {submissionError ? (
          <Alert variant="destructive">
            <AlertTitle>{copy.toast.error}</AlertTitle>
            <AlertDescription className="select-text whitespace-pre-wrap break-words">
              {submissionError}
            </AlertDescription>
          </Alert>
        ) : null}

        {form.formState.isSubmitted && summaryErrors.length > 0 ? (
          <FormValidationSummary messages={summaryErrors} />
        ) : null}

        <RHFDateTimeField
          control={form.control}
          name="scheduledDeparture"
          fieldId="clone-scheduled-departure"
          label={copy.label.scheduledDeparture}
          required
          disabled={isPending}
          {...scheduleFieldProps}
        />

        <RHFDateTimeField
          control={form.control}
          name="scheduledArrival"
          fieldId="clone-scheduled-arrival"
          label={copy.label.scheduledArrival}
          required
          disabled={isPending}
          {...scheduleFieldProps}
        />
      </form>

      <SheetFooter className={SHEET_FOOTER_CLASS}>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isPending}
        >
          {copy.action.cancel}
        </Button>
        <Button
          type="submit"
          form="clone-trip-form"
          disabled={isPending}
        >
          {isPending ? copy.action.submitting : copy.action.submit}
        </Button>
      </SheetFooter>
    </>
  );
}

export function CloneTripSheet({
  tripId,
  tripCode,
  open,
  onOpenChange,
  defaultDepartureLocal,
  defaultArrivalLocal,
}: CloneTripSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={SHEET_CONTENT_CLASS}
        side="right"
        onFocusOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className={SHEET_HEADER_CLASS}>
          <SheetTitle className="inline-flex items-center gap-2">
            <Copy className="h-5 w-5 shrink-0" />
            {copy.sheet.title}
          </SheetTitle>
          <SheetDescription>
            {copy.sheet.description(tripCode)}
          </SheetDescription>
        </SheetHeader>
        {open ? (
          <CloneTripSheetBody
            key={tripId}
            tripId={tripId}
            onOpenChange={onOpenChange}
            defaultDepartureLocal={defaultDepartureLocal}
            defaultArrivalLocal={defaultArrivalLocal}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
