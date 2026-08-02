import { useEffect, useRef, useState } from "react";
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
import { Alert, AlertDescription, AlertTitle, AlertWithIcon } from "@shared/ui/alert";
import {
  FormValidationSummary,
  RHFTextareaField,
} from "@shared/ui/form";
import { HintIcon } from "@shared/ui/hint-icon";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import {
  useSubstituteStampedInvoice,
  prefetchInvoiceLinkedTrips,
  buildStopsByIdFromCache,
  buildTripsByIdFromCache,
  findMissingTripCorrectionStopIds,
  useInvoiceLinkedTripsLoading,
  useInvoiceReceiverClientType,
} from "@features/invoicing/application";
import { useOverlayMutationFeedback, useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import type { Invoice } from "@features/invoicing/domain";
import { invoicingCopy } from "../copy/invoicingCopy";
import { SubstitutionAmountCorrectionsSection } from "./SubstitutionAmountCorrectionsSection";
import { SubstitutionConceptsSection } from "./SubstitutionConceptsSection";
import { SubstitutionCorrectionsSection } from "./SubstitutionCorrectionsSection";
import { SubstitutionTripCorrectionsSection } from "./SubstitutionTripCorrectionsSection";
import { SubstitutionTripAssignmentSection } from "./SubstitutionTripAssignmentSection";
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
  invoiceHasConcepts,
  type SubstitutionCorrectionsDirtyFields,
  substituteInvoiceSheetSchema,
  type SubstituteInvoiceSheetValues,
  type TripCorrectionFormEntry,
} from "../validation/substitutionCorrectionsSchema";
import {
  formatSubstitutionPreflightMessage,
  runSubstitutionStopsPreflight,
} from "../helpers/substitutionStopRfcPreflight";

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
  const { clientType: receiverClientType, isResolving: isResolvingReceiverClientType } =
    useInvoiceReceiverClientType(invoice);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [preflightMessages, setPreflightMessages] = useState<string[]>([]);
  const [isSubmittingTrips, setIsSubmittingTrips] = useState(false);
  const { submissionError, showOverlayError, clearOverlayError } =
    useOverlayMutationFeedback({
      errorTitle: copy.errorTitle,
      seeInlineCopy: copy.errorSeeInline,
      toast,
    });

  const linkedTripIds = invoice.trips.map((trip) => trip.tripId);
  const isTripsLoading = useInvoiceLinkedTripsLoading(linkedTripIds, true);

  const form = useForm<SubstituteInvoiceSheetValues, unknown, SubstituteInvoiceSheetValues>({
    resolver: zodResolver(
      substituteInvoiceSheetSchema as Parameters<typeof zodResolver>[0],
    ) as unknown as Resolver<SubstituteInvoiceSheetValues>,
    defaultValues: defaultSubstituteInvoiceSheetValues(invoice, {
      clientType: receiverClientType,
    }),
    mode: "onChange",
  });

  const { control, setValue, formState, reset } = form;
  const receiverClientTypeSyncedRef = useRef(false);

  useEffect(() => {
    receiverClientTypeSyncedRef.current = false;
  }, [invoice.id]);

  useEffect(() => {
    if (isResolvingReceiverClientType || receiverClientTypeSyncedRef.current) {
      return;
    }
    receiverClientTypeSyncedRef.current = true;
    reset(
      defaultSubstituteInvoiceSheetValues(invoice, {
        clientType: receiverClientType,
      }),
    );
  }, [
    invoice,
    receiverClientType,
    isResolvingReceiverClientType,
    reset,
  ]);
  const { dirtyFields } = formState;
  const tripCorrections = useWatch({ control, name: "trip_corrections" }) ?? [];

  const upsertTripCorrection = (entry: TripCorrectionFormEntry) => {
    const next = [
      ...tripCorrections.filter((item) => {
        if (item.trip_id !== entry.trip_id) return true;
        if (entry.driver_id || entry.vehicle_id) {
          return !(item.driver_id || item.vehicle_id);
        }
        if (entry.stop_id && item.stop_id === entry.stop_id) {
          if (entry.address_id || entry.stop_address) {
            return !(item.address_id || item.stop_address);
          }
          return !item.rfc_remitente_destinatario;
        }
        return true;
      }),
      entry,
    ];
    setValue("trip_corrections", next, { shouldDirty: true });
  };
  const substitutionDirtyFields =
    dirtyFields as SubstitutionCorrectionsDirtyFields;
  const amountsEdited = hasSubstitutionAmountDirtyFields(substitutionDirtyFields);
  const hasConcepts = invoiceHasConcepts(invoice);
  const retentionRequired = useWatch({ control, name: "retention_required" }) ?? false;
  const conceptsTaxRate =
    invoice.concepts?.find((line) => line.conceptType === "flete")?.ivaRate ??
    invoice.concepts?.[0]?.ivaRate ??
    0.16;

  const { mutate, isPending } = useSubstituteStampedInvoice(invoice.id, {
    onSuccess: (data) => {
      toast({
        title: copy.successTitle,
        description: copy.successDescription(
          data.replacement.serie,
          data.replacement.folio,
        ),
      });
      form.reset(
        defaultSubstituteInvoiceSheetValues(invoice, {
          clientType: receiverClientType,
        }),
      );
      onOpenChange(false);
    },
    onError: (err) => {
      showOverlayError(getErrorMessage(err));
    },
  });

  const handleFormSubmit = form.handleSubmit(
    async (values) => {
      setShowValidationSummary(false);
      setPreflightMessages([]);
      clearOverlayError();

      let stopsById = buildStopsByIdFromCache(queryClient, linkedTripIds);
      let tripsById = buildTripsByIdFromCache(queryClient, linkedTripIds);

      if (values.trip_corrections.length > 0) {
        setIsSubmittingTrips(true);
        try {
          await prefetchInvoiceLinkedTrips(queryClient, linkedTripIds);
          stopsById = buildStopsByIdFromCache(queryClient, linkedTripIds);
          tripsById = buildTripsByIdFromCache(queryClient, linkedTripIds);
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
          showOverlayError(getErrorMessage(err));
          return;
        } finally {
          setIsSubmittingTrips(false);
        }
      }

      const preflight = runSubstitutionStopsPreflight(stopsById, values.trip_corrections);
      if (!preflight.ready) {
        const messages = formatSubstitutionPreflightMessage(preflight, {
          missing: copy.preflight.reasonMissing,
          invalid: copy.preflight.reasonInvalid,
        });
        setPreflightMessages(messages);
        setShowValidationSummary(true);
        return;
      }

      const corrections = buildSubstitutionCorrectionsDiff(
        invoice,
        values,
        stopsById,
        tripsById,
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
  const summaryMessages = [...validationMessages, ...preflightMessages];
  const summaryTitle =
    preflightMessages.length > 0 && validationMessages.length === 0
      ? copy.preflight.summaryTitle
      : copy.validationSummary;
  const clientName = invoice.receiverName?.trim() || "—";

  return (
    <>
      <SheetHeader className={SUBSTITUTION_SHEET_HEADER_CLASS}>
        <div className="flex items-center gap-1 pr-8">
          <SheetTitle>{copy.title}</SheetTitle>
          <HintIcon label={copy.satCodesHintLabel}>{copy.satCodesHint}</HintIcon>
        </div>
        <SheetDescription className="text-muted-foreground">
          {copy.contextLine(invoice.serie, invoice.folio, clientName)}
        </SheetDescription>
      </SheetHeader>

      <form
        onSubmit={handleFormSubmit}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className={SUBSTITUTION_SHEET_BODY_CLASS}>
          {submissionError ? (
            <Alert variant="destructive">
              <AlertTitle>{copy.errorTitle}</AlertTitle>
              <AlertDescription className="select-text whitespace-pre-wrap break-words">
                {submissionError}
              </AlertDescription>
            </Alert>
          ) : null}

          <AlertWithIcon variant="info">
            <AlertTitle>{copy.introTitle}</AlertTitle>
            <AlertDescription>
              <ol className="mt-1 list-decimal space-y-1 pl-4 text-sm">
                <li>{copy.introStepEmit}</li>
                <li>
                  {copy.introStepCancel(invoice.serie, invoice.folio)}
                </li>
              </ol>
              <p className="mt-2 text-xs text-muted-foreground">
                {copy.introFootnote}
              </p>
            </AlertDescription>
          </AlertWithIcon>

          <RHFTextareaField
            control={control}
            name="cancellationReason"
            label={copy.cancellationReasonLabel}
            description={copy.cancellationReasonDescription}
            required
            placeholder={copy.cancellationReasonPlaceholder}
            rows={3}
          />

          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">{copy.optionalSectionHeading}</p>
              <p className="text-xs text-muted-foreground">
                {copy.optionalSectionHint}
              </p>
            </div>

            <SubstitutionCorrectionsSection control={control} />

            {hasConcepts ? (
              <SubstitutionConceptsSection
                control={control}
                setValue={setValue}
                taxRate={conceptsTaxRate}
                retentionRequired={retentionRequired}
              />
            ) : (
              <SubstitutionAmountCorrectionsSection
                control={control}
                setValue={setValue}
                invoiceRetainedTax={invoice.retainedTax ?? 0}
                hasTripCorrections={tripCorrections.length > 0}
                enableAutoSync={amountsEdited}
                retentionRequired={retentionRequired}
              />
            )}

            <SubstitutionTripAssignmentSection
              invoice={invoice}
              tripCorrections={tripCorrections}
              onSaveCorrection={upsertTripCorrection}
              sheetOpen
            />

            <SubstitutionTripCorrectionsSection
              invoice={invoice}
              control={control}
              setValue={setValue}
              sheetOpen
            />
          </div>

          <RHFTextareaField
            control={control}
            name="notes"
            label={copy.notesLabel}
            description={copy.notesDescription}
            placeholder={copy.notesPlaceholder}
            rows={2}
          />

          {showValidationSummary && summaryMessages.length > 0 ? (
            <FormValidationSummary
              title={summaryTitle}
              messages={summaryMessages}
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
