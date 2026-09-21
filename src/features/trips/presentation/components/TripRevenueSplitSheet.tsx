/**
 * TripRevenueSplitSheet — alta/edición/consulta de reparto del flete (ADR-0081 / Capa 3 D2).
 * Patrón homologado a InvoiceConceptLineSheet (header fijo / body scroll / footer).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  useFieldArray,
  useForm,
  useWatch,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { useActiveClients } from "@features/clients/application";
import {
  TripStatus,
  type Trip,
  type TripRevenueSplit,
} from "@features/trips/domain";
import {
  useDeleteTripRevenueSplit,
  useTripRevenueSplit,
  useUpsertTripRevenueSplit,
} from "@features/trips/application";
import { tripFiscalCopy } from "../copy/tripFiscalCopy";
import {
  buildEmptyRevenueSplitFormValues,
  buildRevenueSplitFormValuesFromSplit,
  createTripRevenueSplitFormSchema,
  getSplitHydrationRevision,
  type TripRevenueSplitFormValues,
} from "../helpers/tripRevenueSplitDraft";
import { canUpsertTripRevenueSplit } from "./trip-fiscal/tripFiscalHelpers";
import {
  TripRevenueSplitCancelDialog,
  type TripRevenueSplitCancelDialogMode,
} from "./TripRevenueSplitCancelDialog";
import { TripRevenueSplitEditorSection } from "./TripRevenueSplitEditorSection";
import { TripRevenueSplitLegListReadOnly } from "./TripRevenueSplitLegListReadOnly";
import {
  REVENUE_SPLIT_SHEET_BODY_CLASS,
  REVENUE_SPLIT_SHEET_CONTENT_CLASS,
  REVENUE_SPLIT_SHEET_FOOTER_CLASS,
  REVENUE_SPLIT_SHEET_HEADER_CLASS,
  REVENUE_SPLIT_SHEET_PRIMARY_BUTTON_CLASS,
} from "./tripRevenueSplitSheetLayout";

const splitCopy = tripFiscalCopy.revenueSplit;
const sectionCopy = tripFiscalCopy.invoicesSection;

export interface TripRevenueSplitSheetProps {
  trip: Trip;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TripRevenueSplitSheet({
  trip,
  open,
  onOpenChange,
}: TripRevenueSplitSheetProps) {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("trips", "read");
  const isFalseTrip = trip.operationalOutcome === "false_trip";

  if (isFalseTrip || !canRead) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={REVENUE_SPLIT_SHEET_CONTENT_CLASS}
        side="right"
        onFocusOutside={(e) => e.preventDefault()}
      >
        {open ? (
          <TripRevenueSplitSheetBody
            trip={trip}
            open={open}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function TripRevenueSplitSheetBody({
  trip,
  open,
  onOpenChange,
}: TripRevenueSplitSheetProps) {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const canUpdate = hasPermission("trips", "update");

  const { data: split, isLoading, isFetched } = useTripRevenueSplit(trip.id, {
    enabled: open,
  });
  const upsert = useUpsertTripRevenueSplit(trip.id);
  const remove = useDeleteTripRevenueSplit(trip.id);
  const { data: clients = [] } = useActiveClients({
    enabled: canUpdate && open,
  });

  const [editorOpen, setEditorOpen] = useState(false);
  const [sessionDirty, setSessionDirty] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [mutationError, setMutationError] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const wasOpenRef = useRef(false);
  const hydratedRevisionRef = useRef<string | null>(null);

  const upsertEligibility = useMemo(
    () => canUpsertTripRevenueSplit(trip),
    [trip],
  );

  const formSchema = useMemo(
    () =>
      createTripRevenueSplitFormSchema({
        tripClientRequired: splitCopy.tripClientRequired,
        tripClientNotInLegs: splitCopy.tripClientNotInLegs,
        minLegs: splitCopy.errors.minLegs,
        maxLegs: splitCopy.errors.maxLegs(10),
        clientRequired: splitCopy.errors.clientRequired,
        clientDuplicate: splitCopy.errors.clientDuplicate,
        sharePercentInvalid: splitCopy.errors.sharePercentInvalid,
        sharesInvalid: splitCopy.errors.sharesInvalid,
        multipleCartaPorte: splitCopy.errors.multipleCartaPorte,
        unknown: splitCopy.errors.unknown,
      }),
    [],
  );

  const form = useForm<TripRevenueSplitFormValues>({
    resolver: zodResolver(formSchema) as Resolver<TripRevenueSplitFormValues>,
    defaultValues: buildEmptyRevenueSplitFormValues(
      trip.clientId,
      trip.costs.baseRate ?? 0,
    ),
    mode: "onChange",
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState,
    setFocus,
  } = form;

  const { fields, append, remove: removeLeg, replace } = useFieldArray({
    control,
    name: "legs",
  });

  const watchedLegs = useWatch({ control, name: "legs" }) ?? [];
  const tripClientId = useWatch({ control, name: "tripClientId" }) ?? "";
  const cpCarrier = useWatch({ control, name: "cpCarrier" }) ?? "none";
  const activateOnSave = useWatch({ control, name: "activateOnSave" }) ?? true;

  const dirty = formState.isDirty || sessionDirty;
  const serverRevision = getSplitHydrationRevision(split);

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      hydratedRevisionRef.current = null;
      setSessionDirty(false);
      setShowSummary(false);
      setMutationError(null);
      setCancelDialogOpen(false);
      return;
    }

    if (!isFetched) return;

    const openedNow = !wasOpenRef.current;
    wasOpenRef.current = true;

    const shouldHydrate =
      openedNow ||
      (hydratedRevisionRef.current !== serverRevision && !dirty);

    if (!shouldHydrate) return;

    applyHydrationFromServer(split);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- gate by revision/open/dirty
  }, [open, isFetched, serverRevision, dirty, split]);

  function applyHydrationFromServer(
    nextSplit: TripRevenueSplit | null | undefined,
  ) {
    if (!nextSplit) {
      reset(
        buildEmptyRevenueSplitFormValues(
          trip.clientId,
          trip.costs.baseRate ?? 0,
        ),
      );
      setEditorOpen(false);
    } else {
      reset(buildRevenueSplitFormValuesFromSplit(nextSplit, trip.clientId));
      setEditorOpen(
        nextSplit.status === "draft" &&
          upsertEligibility.allowed &&
          trip.status !== TripStatus.CANCELLED,
      );
    }
    setSessionDirty(false);
    setShowSummary(false);
    setMutationError(null);
    hydratedRevisionRef.current = getSplitHydrationRevision(nextSplit);
  }

  const shareSum = useMemo(
    () =>
      watchedLegs.reduce(
        (acc, leg) => acc + (Number(leg?.sharePercent) || 0),
        0,
      ),
    [watchedLegs],
  );
  const shareSumComplete = Math.abs(shareSum - 100) < 0.005;

  const legClientIds = useMemo(
    () =>
      new Set(
        watchedLegs.map((leg) => leg?.clientId).filter(Boolean) as string[],
      ),
    [watchedLegs],
  );

  const tripClientOptions = useMemo(
    () => clients.filter((client) => legClientIds.has(client.id)),
    [clients, legClientIds],
  );

  const clientLabel = (clientId: string) => {
    const client = clients.find((item) => item.id === clientId);
    return client?.tradeName || client?.legalName || clientId.slice(0, 8);
  };

  const isTripCancelled = trip.status === TripStatus.CANCELLED;
  const isActive = split?.status === "active";
  const isSplitCancelled = split?.status === "cancelled";
  const isDraft = split?.status === "draft";
  const legsWithoutInvoice =
    split?.legs.every((leg) => !leg.invoiceId) ?? false;
  const hasInvoicedLegs =
    split?.legs.some((leg) => Boolean(leg.invoiceId)) ?? false;

  // C7: viaje cancelled → sheet en modo cierre / read-only (sin creates).
  const showEditor =
    canUpdate &&
    !isTripCancelled &&
    !isActive &&
    !isSplitCancelled &&
    upsertEligibility.allowed &&
    (editorOpen || split != null);
  const showStartCta =
    canUpdate &&
    !isTripCancelled &&
    !isActive &&
    !isSplitCancelled &&
    !showEditor &&
    !split &&
    upsertEligibility.allowed;
  const showDraftReadOnly =
    isDraft && !upsertEligibility.allowed && !isTripCancelled;
  const showCancelledReadOnly = isSplitCancelled;
  const showPostCancelActive =
    isTripCancelled && isActive && split != null;

  // DELETE normal (viaje vivo) o escape hatch C7 (cancelled + active sin facturas).
  const canCancelActive =
    canUpdate &&
    !isTripCancelled &&
    isActive &&
    legsWithoutInvoice;
  const canCancelDraft =
    canUpdate &&
    !isTripCancelled &&
    isDraft &&
    legsWithoutInvoice;
  const canEscapeCancelActive =
    canUpdate &&
    isTripCancelled &&
    isActive &&
    legsWithoutInvoice;
  const showCancelButton =
    canCancelActive || canCancelDraft || canEscapeCancelActive;
  const cancelDialogMode: TripRevenueSplitCancelDialogMode =
    canEscapeCancelActive ? "escape" : "default";
  const pendingLegMode =
    isTripCancelled || isSplitCancelled ? "doNotIssue" : "default";

  function applyPreset6040() {
    const current = getValues("legs");
    const next = [...current];
    while (next.length < 2) {
      next.push({ clientId: "", sharePercent: 0 });
    }
    next[0] = { ...next[0]!, sharePercent: 60 };
    next[1] = { ...next[1]!, sharePercent: 40 };
    replace(next.slice(0, Math.max(2, next.length)));
    setSessionDirty(true);
  }

  function openEditor() {
    reset(
      buildEmptyRevenueSplitFormValues(
        trip.clientId,
        trip.costs.baseRate ?? 0,
      ),
    );
    setEditorOpen(true);
    setSessionDirty(true);
    setShowSummary(false);
  }

  function handleRemoveLeg(index: number) {
    removeLeg(index);
    const currentCarrier = getValues("cpCarrier");
    if (currentCarrier === String(index)) {
      setValue("cpCarrier", "none", { shouldDirty: true });
    } else if (
      currentCarrier !== "none" &&
      Number(currentCarrier) > index
    ) {
      setValue("cpCarrier", String(Number(currentCarrier) - 1), {
        shouldDirty: true,
      });
    }
    setSessionDirty(true);
  }

  const summaryMessages = collectFieldErrorMessages(formState.errors);

  const confirmCpLabel =
    cpCarrier === "none"
      ? splitCopy.confirmCpNone
      : splitCopy.confirmCpLeg(
          clientLabel(watchedLegs[Number(cpCarrier)]?.clientId ?? "") ||
            String(Number(cpCarrier) + 1),
        );

  const confirmSharesLabel = watchedLegs
    .map((leg) => `${leg?.sharePercent ?? 0}%`)
    .join(" / ");

  const onValidSave = async (values: TripRevenueSplitFormValues) => {
    try {
      await upsert.mutateAsync({
        basisAmount: values.basisAmount || 0,
        currency: "MXN",
        tripClientId: values.tripClientId || undefined,
        activate: values.activateOnSave,
        legs: values.legs.map((leg, index) => ({
          clientId: leg.clientId,
          sharePercent: Number(leg.sharePercent),
          suggestedCartaPorte: values.cpCarrier === String(index),
        })),
      });
      toast({ title: splitCopy.savedToast });
      setMutationError(null);
      setSessionDirty(false);
      setShowSummary(false);
      setEditorOpen(false);
      if (values.activateOnSave) {
        onOpenChange(false);
      }
    } catch (error) {
      const message = getErrorMessage(error);
      setMutationError({
        title: splitCopy.saveErrorTitle,
        message,
      });
      toast({
        variant: "error",
        title: splitCopy.saveErrorTitle,
        description: message,
      });
    }
  };

  const submitEditor = handleSubmit(onValidSave, (errors) => {
    setShowSummary(true);
    const legErrors = errors.legs;
    if (Array.isArray(legErrors)) {
      const firstLegError = legErrors.findIndex(
        (leg) => leg?.clientId || leg?.sharePercent,
      );
      if (firstLegError >= 0) {
        if (legErrors[firstLegError]?.clientId) {
          setFocus(`legs.${firstLegError}.clientId`);
        } else {
          setFocus(`legs.${firstLegError}.sharePercent`);
        }
        return;
      }
    } else if (legErrors) {
      setFocus("legs.0.sharePercent");
      return;
    }
    if (errors.tripClientId) {
      setFocus("tripClientId");
      return;
    }
    if (errors.basisAmount) {
      setFocus("basisAmount");
    }
  });

  async function onCancel() {
    try {
      await remove.mutateAsync();
      toast({ title: splitCopy.cancelledToast });
      setMutationError(null);
      setCancelDialogOpen(false);
      setSessionDirty(false);
      setEditorOpen(false);
      onOpenChange(false);
    } catch (error) {
      const message = getErrorMessage(error);
      setMutationError({
        title: splitCopy.cancelErrorTitle,
        message,
      });
      setCancelDialogOpen(false);
      toast({
        variant: "error",
        title: splitCopy.cancelErrorTitle,
        description: message,
      });
    }
  }

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (showEditor) void submitEditor();
      }}
      noValidate
    >
      <SheetHeader className={REVENUE_SPLIT_SHEET_HEADER_CLASS}>
        <SheetTitle>{splitCopy.sheetTitle}</SheetTitle>
        <SheetDescription>{splitCopy.sheetDescription}</SheetDescription>
      </SheetHeader>
      <div className={REVENUE_SPLIT_SHEET_BODY_CLASS}>
        {isLoading && !split ? (
          <p className="text-sm text-muted-foreground">{splitCopy.loading}</p>
        ) : null}

        {mutationError ? (
          <Alert variant="destructive">
            <AlertTitle>{mutationError.title}</AlertTitle>
            <AlertDescription className="select-text whitespace-pre-wrap break-words">
              {mutationError.message}
            </AlertDescription>
          </Alert>
        ) : null}

        {split ? (
          <Badge
            variant={
              isActive ? "default" : isSplitCancelled ? "secondary" : "outline"
            }
          >
            {isActive
              ? sectionCopy.splitLabel
              : isSplitCancelled
                ? splitCopy.cancelledChip
                : splitCopy.draftChip}
          </Badge>
        ) : null}

        {showStartCta ? (
          <div className="space-y-2 rounded-md border border-border/80 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">{splitCopy.startHint}</p>
            <Button type="button" size="sm" onClick={openEditor}>
              {splitCopy.startCta}
            </Button>
          </div>
        ) : null}

        {showPostCancelActive && split ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {splitCopy.postCancelActiveTitle}
            </p>
            {hasInvoicedLegs ? (
              <p className="text-xs text-muted-foreground">
                {splitCopy.postCancelActiveHint}
              </p>
            ) : null}
            <TripRevenueSplitLegListReadOnly
              split={split}
              trip={trip}
              pendingLegMode={pendingLegMode}
            />
          </div>
        ) : null}

        {isActive && split && !isTripCancelled ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {splitCopy.activeReadOnlyTitle}
            </p>
            <TripRevenueSplitLegListReadOnly
              split={split}
              trip={trip}
              pendingLegMode={pendingLegMode}
            />
          </div>
        ) : null}
        {showDraftReadOnly && split ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {splitCopy.draftReadOnlyTitle}
            </p>
            <TripRevenueSplitLegListReadOnly
              split={split}
              trip={trip}
              pendingLegMode={pendingLegMode}
            />
          </div>
        ) : null}
        {showCancelledReadOnly && split ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {splitCopy.cancelledReadOnlyTitle}
            </p>
            <TripRevenueSplitLegListReadOnly
              split={split}
              trip={trip}
              pendingLegMode={pendingLegMode}
            />
          </div>
        ) : null}

        {showEditor ? (
          <TripRevenueSplitEditorSection
            control={control}
            fields={fields}
            watchedLegs={watchedLegs}
            tripClientId={tripClientId}
            cpCarrier={cpCarrier}
            activateOnSave={activateOnSave}
            shareSum={shareSum}
            shareSumComplete={shareSumComplete}
            tripClientOptions={tripClientOptions}
            clients={clients}
            hasExistingSplit={split != null}
            showSummary={showSummary}
            summaryMessages={summaryMessages}
            getValues={getValues}
            setValue={setValue}
            setSessionDirty={setSessionDirty}
            onPreset6040={applyPreset6040}
            onCancelEditor={() => setEditorOpen(false)}
            onAppendLeg={() => {
              append({ clientId: "", sharePercent: 0 });
              setSessionDirty(true);
            }}
            onRemoveLeg={handleRemoveLeg}
            clientLabel={clientLabel}
            confirmCpLabel={confirmCpLabel}
            confirmSharesLabel={confirmSharesLabel}
          />
        ) : null}

        {showCancelButton ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setCancelDialogOpen(true)}
            disabled={remove.isPending}
          >
            {canEscapeCancelActive
              ? splitCopy.escapeCancelActive
              : splitCopy.cancelActive}
          </Button>
        ) : null}

        {isActive && !isTripCancelled ? (
          <p className="text-xs text-muted-foreground">
            {tripFiscalCopy.invoiceActions.collectionByReceiverHint}
          </p>
        ) : null}
      </div>

      {showEditor ? (
        <SheetFooter className={REVENUE_SPLIT_SHEET_FOOTER_CLASS}>
          <Button
            type="button"
            variant="outline"
            className={REVENUE_SPLIT_SHEET_PRIMARY_BUTTON_CLASS}
            onClick={() => onOpenChange(false)}
          >
            {splitCopy.close}
          </Button>
          <Button
            type="submit"
            className={REVENUE_SPLIT_SHEET_PRIMARY_BUTTON_CLASS}
            disabled={upsert.isPending}
          >
            {activateOnSave ? splitCopy.saveAndConfirm : splitCopy.saveDraft}
          </Button>
        </SheetFooter>
      ) : null}

      <TripRevenueSplitCancelDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        isPending={remove.isPending}
        mode={cancelDialogMode}
        onConfirm={() => {
          void onCancel();
        }}
      />
    </form>
  );
}
