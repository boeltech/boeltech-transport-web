/**
 * TripRevenueSplitSheet — alta/edición/consulta de reparto del flete (ADR-0081 / Capa 3 D2).
 * Patrón homologado a InvoiceConceptLineSheet (header fijo / body scroll / footer).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@shared/lib/utils/cn";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
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
import { Badge } from "@shared/ui/badge";
import { Checkbox } from "@shared/ui/checkbox";
import { Input } from "@shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import {
  FormFieldShell,
  FormValidationSummary,
  RHFMoneyField,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { useActiveClients } from "@features/clients/application";
import type { Trip, TripRevenueSplit } from "@features/trips/domain";
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
      setEditorOpen(nextSplit.status !== "active" && upsertEligibility.allowed);
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

  const isActive = split?.status === "active";
  const showEditor =
    canUpdate &&
    !isActive &&
    upsertEligibility.allowed &&
    (editorOpen || split != null);
  const showStartCta =
    canUpdate &&
    !isActive &&
    !showEditor &&
    !split &&
    upsertEligibility.allowed;
  const showDraftReadOnly =
    split != null && split.status !== "active" && !upsertEligibility.allowed;
  const canCancelActive =
    canUpdate &&
    isActive &&
    split.legs.every((leg) => !leg.invoiceId);
  const canCancelDraft =
    canUpdate &&
    split != null &&
    split.status !== "active" &&
    split.legs.every((leg) => !leg.invoiceId);

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

  function renderSplitLegListReadOnly() {
    if (!split) return null;
    return (
      <ul className="space-y-2">
        {split.legs.map((leg) => {
          const label = leg.clientLegalName || leg.clientId.slice(0, 8);
          const statusLabel = leg.invoiceId
            ? splitCopy.statusInvoiced
            : splitCopy.statusPending;
          return (
            <li
              key={leg.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background/60 px-2.5 py-2 text-sm"
            >
              <div className="min-w-0 space-y-0.5">
                <div className="truncate font-medium">{label}</div>
                <div className="text-xs text-muted-foreground">
                  {leg.sharePercent}% · {statusLabel}
                  {leg.clientRfc
                    ? ` · ${splitCopy.legRfcSubtitle(leg.clientRfc)}`
                    : ""}
                  {leg.suggestedCartaPorte
                    ? trip.invoicing.cartaPorteAttached && !leg.invoiceId
                      ? ` · ${splitCopy.cpAttachedElsewhere}`
                      : ` · ${splitCopy.cpSuggested}`
                    : ""}
                </div>
              </div>
              {leg.invoiceId ? (
                <Button asChild size="sm" variant="ghost">
                  <Link to={`/invoices/${leg.invoiceId}`}>
                    {splitCopy.viewInvoice}
                  </Link>
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
    );
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
      </SheetHeader>      <div className={REVENUE_SPLIT_SHEET_BODY_CLASS}>
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
          <Badge variant={isActive ? "default" : "outline"}>
            {isActive ? sectionCopy.splitLabel : splitCopy.draftChip}
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

        {isActive && split ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {splitCopy.activeReadOnlyTitle}
            </p>
            {renderSplitLegListReadOnly()}
          </div>
        ) : null}
        {showDraftReadOnly ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {splitCopy.draftReadOnlyTitle}
            </p>
            {renderSplitLegListReadOnly()}
          </div>
        ) : null}

        {showEditor ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={applyPreset6040}
              >
                {splitCopy.preset6040}
              </Button>
              {!split ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditorOpen(false)}
                >
                  {splitCopy.cancelEditor}
                </Button>
              ) : null}
            </div>

            <section className="space-y-3 rounded-md border border-border/80 bg-muted/20 p-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  {splitCopy.whoSectionTitle}
                </p>
                <p className="text-xs text-muted-foreground">
                  {splitCopy.whoSectionDescription}
                </p>
              </div>
              <Controller
                control={control}
                name="tripClientId"
                render={({ field, fieldState }) => (
                  <FormFieldShell
                    fieldId="split-trip-client"
                    label={splitCopy.tripClientLabel}
                    required={activateOnSave}
                    description={splitCopy.tripClientHint}
                    errorMessage={fieldState.error?.message}
                  >
                    <Select
                      value={field.value || undefined}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSessionDirty(true);
                      }}
                    >
                      <SelectTrigger
                        id="split-trip-client"
                        error={Boolean(fieldState.error)}
                        {...getFieldErrorAriaProps(
                          "split-trip-client",
                          fieldState.error?.message,
                        )}
                      >
                        <SelectValue
                          placeholder={splitCopy.tripClientPlaceholder}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {tripClientOptions.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.tradeName || client.legalName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormFieldShell>
                )}
              />
            </section>

            <section className="space-y-3 rounded-md border border-border/80 bg-muted/20 p-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  {splitCopy.howSectionTitle}
                </p>
                <p className="text-xs text-muted-foreground">
                  {splitCopy.howSectionDescription}
                </p>
              </div>

              <RHFMoneyField
                control={control}
                name="basisAmount"
                fieldId="split-basis"
                label={splitCopy.basisLabel}
                currencyCode="MXN"
              />

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-3 rounded-md border bg-background/60 p-3 sm:grid-cols-[1fr_120px_auto]"
                >
                  <Controller
                    control={control}
                    name={`legs.${index}.clientId`}
                    render={({ field: legField, fieldState }) => (
                      <FormFieldShell
                        fieldId={`split-leg-client-${index}`}
                        label={splitCopy.legClientLabel(index)}
                        required
                        errorMessage={fieldState.error?.message}
                      >
                        <Select
                          value={legField.value || undefined}
                          onValueChange={(value) => {
                            const previous = legField.value;
                            legField.onChange(value);
                            setSessionDirty(true);
                            const currentTripClient = getValues("tripClientId");
                            if (
                              !currentTripClient ||
                              currentTripClient === previous
                            ) {
                              setValue("tripClientId", value, {
                                shouldDirty: true,
                              });
                            }
                          }}
                        >
                          <SelectTrigger
                            id={`split-leg-client-${index}`}
                            error={Boolean(fieldState.error)}
                            {...getFieldErrorAriaProps(
                              `split-leg-client-${index}`,
                              fieldState.error?.message,
                            )}
                          >
                            <SelectValue
                              placeholder={splitCopy.legClientPlaceholder(
                                index,
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.tradeName || client.legalName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormFieldShell>
                    )}
                  />
                  <Controller
                    control={control}
                    name={`legs.${index}.sharePercent`}
                    render={({ field: shareField, fieldState }) => (
                      <FormFieldShell
                        fieldId={`split-leg-share-${index}`}
                        label={splitCopy.shareLabel(index)}
                        required
                        errorMessage={fieldState.error?.message}
                      >
                        <Input
                          id={`split-leg-share-${index}`}
                          type="number"
                          min={0.01}
                          max={100}
                          step="0.01"
                          value={
                            Number.isFinite(shareField.value)
                              ? shareField.value
                              : ""
                          }
                          onChange={(event) => {
                            const raw = event.target.value;
                            shareField.onChange(
                              raw === "" ? Number.NaN : Number(raw),
                            );
                            setSessionDirty(true);
                          }}
                          onBlur={shareField.onBlur}
                          error={Boolean(fieldState.error)}
                          aria-label={splitCopy.shareAria(index)}
                          {...getFieldErrorAriaProps(
                            `split-leg-share-${index}`,
                            fieldState.error?.message,
                          )}
                        />
                      </FormFieldShell>
                    )}
                  />
                  {fields.length > 2 ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="mt-7"
                      aria-label={splitCopy.removeLegAria(index)}
                      onClick={() => {
                        removeLeg(index);
                        const currentCarrier = getValues("cpCarrier");
                        if (currentCarrier === String(index)) {
                          setValue("cpCarrier", "none", { shouldDirty: true });
                        } else if (
                          currentCarrier !== "none" &&
                          Number(currentCarrier) > index
                        ) {
                          setValue(
                            "cpCarrier",
                            String(Number(currentCarrier) - 1),
                            { shouldDirty: true },
                          );
                        }
                        setSessionDirty(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <span className="hidden sm:block" />
                  )}
                </div>
              ))}

              <div
                className={cn(
                  "flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm",
                  shareSumComplete
                    ? "border-success/30 bg-success-soft text-success-soft-foreground"
                    : "border-border/80 bg-background/80 text-muted-foreground",
                )}
                aria-live="polite"
              >
                <span className="text-xs">
                  {shareSumComplete
                    ? splitCopy.shareSumReady
                    : splitCopy.shareSumPending}
                </span>
                <span className="font-medium tabular-nums">
                  {splitCopy.shareSum(shareSum.toFixed(2))}
                </span>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={fields.length >= 10}
                onClick={() => {
                  append({ clientId: "", sharePercent: 0 });
                  setSessionDirty(true);
                }}
              >
                <Plus className="mr-1 h-4 w-4" />
                {splitCopy.addLeg}
              </Button>
            </section>

            <section className="space-y-3 rounded-md border border-border/80 bg-muted/20 p-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{splitCopy.cpSectionTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {splitCopy.cpSectionDescription}
                </p>
              </div>
              <div
                role="radiogroup"
                aria-label={splitCopy.cpCarrierLabel}
                className="space-y-2"
              >
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="split-cp-carrier"
                    className="size-4 accent-primary"
                    checked={cpCarrier === "none"}
                    onChange={() => {
                      setValue("cpCarrier", "none", { shouldDirty: true });
                      setSessionDirty(true);
                    }}
                  />
                  {splitCopy.cpNone}
                </label>
                {watchedLegs.map((leg, index) => (
                  <label
                    key={`cp-${index}`}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="split-cp-carrier"
                      className="size-4 accent-primary"
                      checked={cpCarrier === String(index)}
                      onChange={() => {
                        setValue("cpCarrier", String(index), {
                          shouldDirty: true,
                        });
                        setSessionDirty(true);
                      }}
                    />
                    {splitCopy.cpLeg(
                      index,
                      leg?.clientId ? clientLabel(leg.clientId) : "",
                    )}
                  </label>
                ))}
              </div>
            </section>

            <section className="space-y-3 rounded-md border border-border/80 bg-muted/20 p-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  {splitCopy.saveSectionTitle}
                </p>
                <p className="text-xs text-muted-foreground">
                  {splitCopy.saveSectionDescription}
                </p>
              </div>

              <Controller
                control={control}
                name="activateOnSave"
                render={({ field }) => (
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked === true);
                        }}
                      />
                      {splitCopy.activateOnSave}
                    </label>
                    <p className="pl-6 text-xs text-muted-foreground">
                      {splitCopy.activateOnSaveHint}
                    </p>
                  </div>
                )}
              />

              {activateOnSave ? (
                <div className="space-y-1 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
                  <p className="font-medium">{splitCopy.confirmTitle}</p>
                  <p>
                    {splitCopy.confirmTripClient(
                      tripClientId ? clientLabel(tripClientId) : "—",
                    )}
                  </p>
                  <p>{confirmCpLabel}</p>
                  <p>{splitCopy.confirmShares(confirmSharesLabel)}</p>
                </div>
              ) : null}

              {showSummary && summaryMessages.length > 0 ? (
                <FormValidationSummary
                  className="mb-0"
                  title={splitCopy.validationSummary}
                  messages={summaryMessages}
                />
              ) : null}
            </section>
          </div>
        ) : null}

        {canCancelActive || canCancelDraft ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setCancelDialogOpen(true)}
            disabled={remove.isPending}
          >
            {splitCopy.cancelActive}
          </Button>
        ) : null}

        {isActive ? (
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
            {activateOnSave
              ? splitCopy.saveAndConfirm
              : splitCopy.saveDraft}
          </Button>
        </SheetFooter>
      ) : null}
    
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{splitCopy.cancelConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {splitCopy.cancelConfirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>
              {splitCopy.cancelConfirmDismiss}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={remove.isPending}
              onClick={(event) => {
                event.preventDefault();
                void onCancel();
              }}
            >
              {splitCopy.cancelConfirmAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
</form>
  );
}
