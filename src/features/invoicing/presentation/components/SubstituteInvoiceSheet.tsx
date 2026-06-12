import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { Button } from "@shared/ui/button";
import {
  FormValidationSummary,
  RHFTextareaField,
} from "@shared/ui/form";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import {
  useSubstituteStampedInvoice,
  prefetchInvoiceLinkedTrips,
  buildStopsByIdFromCache,
  findMissingTripCorrectionStopIds,
  useInvoiceLinkedTripsLoading,
} from "@features/invoicing/application";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import type { Invoice } from "@features/invoicing/domain";
import { invoicingCopy } from "../copy/invoicingCopy";
import { SubstitutionAmountCorrectionsSection } from "./SubstitutionAmountCorrectionsSection";
import { SubstitutionCorrectionsSection } from "./SubstitutionCorrectionsSection";
import { SubstitutionTripCorrectionsSection } from "./SubstitutionTripCorrectionsSection";
import {
  SUBSTITUTION_SHEET_BODY_CLASS,
  SUBSTITUTION_SHEET_CONTENT_CLASS,
  SUBSTITUTION_SHEET_FOOTER_CLASS,
  SUBSTITUTION_SHEET_HEADER_CLASS,
  SUBSTITUTION_SHEET_PRIMARY_BUTTON_CLASS,
} from "./substitutionSheetLayout";
import {
  buildSubstitutionCorrectionsDiff,
  defaultSubstituteInvoiceSheetValues,
  hasSubstitutionAmountDirtyFields,
  type SubstitutionCorrectionsDirtyFields,
  substituteInvoiceSheetSchema,
  type SubstituteInvoiceSheetValues,
} from "../validation/substitutionCorrectionsSchema";

const copy = invoicingCopy.detail.substitute;

interface Props {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormProps {
  invoice: Invoice;
  onOpenChange: (open: boolean) => void;
}

function SubstituteInvoiceSheetForm({ invoice, onOpenChange }: FormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [isSubmittingTrips, setIsSubmittingTrips] = useState(false);

  const linkedTripIds = invoice.trips.map((trip) => trip.tripId);
  const isTripsLoading = useInvoiceLinkedTripsLoading(linkedTripIds, true);

  const form = useForm<SubstituteInvoiceSheetValues, unknown, SubstituteInvoiceSheetValues>({
    resolver: zodResolver(
      substituteInvoiceSheetSchema as Parameters<typeof zodResolver>[0],
    ) as unknown as Resolver<SubstituteInvoiceSheetValues>,
    defaultValues: defaultSubstituteInvoiceSheetValues(invoice),
    mode: "onChange",
  });

  const { control, setValue, formState } = form;
  const { dirtyFields } = formState;
  const tripCorrections = useWatch({ control, name: "trip_corrections" }) ?? [];
  const substitutionDirtyFields =
    dirtyFields as SubstitutionCorrectionsDirtyFields;
  const amountsEdited = hasSubstitutionAmountDirtyFields(substitutionDirtyFields);

  const { mutate, isPending } = useSubstituteStampedInvoice(invoice.id, {
    onSuccess: (data) => {
      toast({
        title: copy.successTitle,
        description: copy.successDescription(
          data.replacement.serie,
          data.replacement.folio,
        ),
      });
      form.reset(defaultSubstituteInvoiceSheetValues(invoice));
      onOpenChange(false);
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: copy.errorTitle,
        description: getErrorMessage(err),
      });
    },
  });

  const handleFormSubmit = form.handleSubmit(
    async (values) => {
      setShowValidationSummary(false);

      let stopsById = buildStopsByIdFromCache(queryClient, linkedTripIds);

      if (values.trip_corrections.length > 0) {
        setIsSubmittingTrips(true);
        try {
          await prefetchInvoiceLinkedTrips(queryClient, linkedTripIds);
          stopsById = buildStopsByIdFromCache(queryClient, linkedTripIds);
          const missingStopIds = findMissingTripCorrectionStopIds(
            values.trip_corrections,
            stopsById,
          );
          if (missingStopIds.length > 0) {
            toast({
              variant: "destructive",
              title: copy.tripsStopLoadErrorTitle,
              description: copy.tripsStopLoadErrorDescription,
            });
            return;
          }
        } catch (err) {
          toast({
            variant: "destructive",
            title: copy.errorTitle,
            description: getErrorMessage(err),
          });
          return;
        } finally {
          setIsSubmittingTrips(false);
        }
      }

      const corrections = buildSubstitutionCorrectionsDiff(
        invoice,
        values,
        stopsById,
        substitutionDirtyFields,
      );
      mutate({
        cancellationReason: values.cancellationReason.trim(),
        notes: values.notes?.trim() || undefined,
        corrections,
      });
    },
    () => {
      setShowValidationSummary(true);
    },
  );

  const isSubmitBlocked =
    isPending || isSubmittingTrips || (linkedTripIds.length > 0 && isTripsLoading);

  const validationMessages = collectFieldErrorMessages(form.formState.errors);

  return (
    <>
      <SheetHeader className={SUBSTITUTION_SHEET_HEADER_CLASS}>
        <SheetTitle className="pr-8">{copy.title}</SheetTitle>
        <SheetDescription>
          {copy.descriptionPrefix}{" "}
          <strong>{copy.descriptionNewCfdi}</strong> {copy.descriptionRelation}{" "}
          {copy.descriptionCancel} (
          <strong>
            {invoice.serie}-{invoice.folio}
          </strong>
          ) {copy.descriptionMotivo}{" "}
          <strong>{copy.descriptionMotivoCode}</strong> {copy.descriptionMotivoLabel}.{" "}
          {copy.descriptionRequirement}
        </SheetDescription>
      </SheetHeader>

      <form
        onSubmit={handleFormSubmit}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className={SUBSTITUTION_SHEET_BODY_CLASS}>
          <RHFTextareaField
            control={control}
            name="cancellationReason"
            label={copy.cancellationReasonLabel}
            required
            placeholder={copy.cancellationReasonPlaceholder}
            rows={3}
          />

          <SubstitutionCorrectionsSection control={control} />

          <SubstitutionAmountCorrectionsSection
            control={control}
            setValue={setValue}
            invoiceRetainedTax={invoice.retainedTax ?? 0}
            hasTripCorrections={tripCorrections.length > 0}
            enableAutoSync={amountsEdited}
          />

          <SubstitutionTripCorrectionsSection
            invoice={invoice}
            control={control}
            setValue={setValue}
            sheetOpen
          />

          <RHFTextareaField
            control={control}
            name="notes"
            label={copy.notesLabel}
            placeholder={copy.notesPlaceholder}
            rows={2}
          />

          {showValidationSummary && validationMessages.length > 0 ? (
            <FormValidationSummary
              title={copy.validationSummary}
              messages={validationMessages}
            />
          ) : null}
        </div>

        <SheetFooter className={SUBSTITUTION_SHEET_FOOTER_CLASS}>
          <Button
            type="button"
            variant="outline"
            className={SUBSTITUTION_SHEET_PRIMARY_BUTTON_CLASS}
            onClick={() => onOpenChange(false)}
          >
            {copy.close}
          </Button>
          <Button
            type="submit"
            className={SUBSTITUTION_SHEET_PRIMARY_BUTTON_CLASS}
            disabled={isSubmitBlocked}
          >
            {isPending || isSubmittingTrips
              ? copy.processing
              : isTripsLoading
                ? copy.confirmLoadingTrips
                : copy.confirm}
          </Button>
        </SheetFooter>
      </form>
    </>
  );
}

export function SubstituteInvoiceSheet({ invoice, open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={SUBSTITUTION_SHEET_CONTENT_CLASS}>
        {open ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <SubstituteInvoiceSheetForm
              key={invoice.id}
              invoice={invoice}
              onOpenChange={onOpenChange}
            />
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
