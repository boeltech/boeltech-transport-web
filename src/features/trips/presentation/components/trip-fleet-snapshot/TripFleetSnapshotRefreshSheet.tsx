import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Controller, useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import type {
  Trip,
  TripFleetSnapshotBlock,
  TripFleetSnapshotView,
  TripFleetWarningCode,
} from "@features/trips/domain";
import {
  useRefreshTripFleetSnapshot,
  useTripFleetSnapshot,
} from "@features/trips/application";
import { useOverlayMutationFeedback, useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { formatDate } from "@shared/utils/dateUtils";
import { Alert, AlertDescription, AlertTitle, AlertWithIcon } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import {
  FieldInlineError,
  FormFieldShell,
  FormValidationSummary,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { Label } from "@shared/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { Skeleton } from "@shared/ui/skeleton";
import { Switch } from "@shared/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Textarea } from "@shared/ui/text-area";

import { tripDetailCopy } from "../../copy";
import {
  FISCAL_CORRECTION_SHEET_BODY_CLASS,
  FISCAL_CORRECTION_SHEET_CONTENT_CLASS,
  FISCAL_CORRECTION_SHEET_FOOTER_CLASS,
  FISCAL_CORRECTION_SHEET_HEADER_CLASS,
  FISCAL_CORRECTION_SHEET_PRIMARY_BUTTON_CLASS,
} from "../trip-fiscal/fiscalCorrectionSheetLayout";
import {
  DRIVER_FLEET_FIELDS,
  VEHICLE_FLEET_FIELDS,
  classifyFleetRefreshError,
  describeBlockDisabledReason,
  diffFieldSet,
  formatCpInvoiceFolio,
  formatFleetValue,
  validateFleetRefreshReason,
  type FleetCatalogLabels,
} from "./tripFleetSnapshotHelpers";

const copy = tripDetailCopy.fleetSnapshot.sheet;
const cardCopy = tripDetailCopy.fleetSnapshot.card;
const toastCopy = tripDetailCopy.fleetSnapshot.toast;

const BLOCKS: readonly TripFleetSnapshotBlock[] = ["vehicle", "driver"];
const REASON_FIELD_ID = "fleet-refresh-reason";
const BLOCKS_FIELD_ID = "fleet-refresh-blocks";

const refreshFormSchema = z
  .object({
    blocks: z.object({ vehicle: z.boolean(), driver: z.boolean() }),
    reason: z.string(),
  })
  .superRefine((values, ctx) => {
    if (!values.blocks.vehicle && !values.blocks.driver) {
      ctx.addIssue({ code: "custom", path: ["blocks"], message: copy.noBlockSelected });
    }
    const reasonError = validateFleetRefreshReason(values.reason);
    if (reasonError) {
      ctx.addIssue({ code: "custom", path: ["reason"], message: reasonError });
    }
  });

type RefreshFormValues = z.infer<typeof refreshFormSchema>;

type PreviewState = "loading" | "ready" | "error";
type InlineErrorKind = "forbidden" | "stale" | null;

export interface TripFleetSnapshotRefreshSheetProps {
  trip: Trip;
  labels: FleetCatalogLabels;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function allowedBlocks(view: TripFleetSnapshotView | undefined) {
  return {
    vehicle: Boolean(view?.refresh.vehicle.allowed),
    driver: Boolean(view?.refresh.driver.allowed),
  };
}

function ComparisonTable({
  view,
  block,
  labels,
  showUnchanged,
}: {
  view: TripFleetSnapshotView;
  block: TripFleetSnapshotBlock;
  labels: FleetCatalogLabels;
  showUnchanged: boolean;
}) {
  if (!view.snapshot || !view.master) return null;
  const diff = diffFieldSet(view, block);
  const frozen = view.snapshot[block] as unknown as Record<string, unknown>;
  const master = view.master[block] as unknown as Record<string, unknown>;
  const fields = block === "vehicle" ? VEHICLE_FLEET_FIELDS : DRIVER_FLEET_FIELDS;
  const rows = fields.filter((field) => showUnchanged || diff.has(field.key));
  if (rows.length === 0) return null;

  const format = (kind: (typeof fields)[number]["kind"], value: unknown) =>
    formatFleetValue(kind, value as string | number | null, labels) ?? cardCopy.value.empty;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {cardCopy.block[block]}
      </p>
      <div className="overflow-x-auto rounded-md border">
        <Table aria-label={cardCopy.block[block]}>
          <TableHeader>
            <TableRow>
              <TableHead>{copy.table.field}</TableHead>
              <TableHead>{copy.table.frozen}</TableHead>
              <TableHead>{copy.table.master}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((field) => (
              <TableRow key={field.key} data-changed={diff.has(field.key) || undefined}>
                <TableCell className="text-muted-foreground">{field.label}</TableCell>
                <TableCell>{format(field.kind, frozen[field.prop])}</TableCell>
                <TableCell className={diff.has(field.key) ? "font-medium" : undefined}>
                  {format(field.kind, master[field.prop])}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function InvalidMasterAlert({
  view,
  block,
  tripId,
  onReloadPreview,
}: {
  view: TripFleetSnapshotView;
  block: TripFleetSnapshotBlock;
  tripId: string;
  onReloadPreview: () => void;
}) {
  const issues = view.masterValidation?.[block] ?? [];
  if (issues.length === 0) return null;
  const isVehicle = block === "vehicle";
  const entityId = isVehicle ? view.master?.vehicle.vehicleId : view.master?.driver.driverId;
  const href = entityId ? `${isVehicle ? "/vehicles" : "/drivers"}/${entityId}` : null;

  return (
    <Alert variant="destructive" data-testid={`fleet-refresh-invalid-${block}`}>
      <AlertTitle>
        {isVehicle ? copy.invalidVehicle.title : copy.invalidDriver.title}
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <ul className="list-inside list-disc space-y-0.5">
          {issues.map((issue, index) => (
            <li key={`${issue.code}-${issue.path ?? index}`}>{issue.message}</li>
          ))}
        </ul>
        <p>{copy.invalid.after}</p>
        <div className="flex flex-wrap gap-2">
          {href ? (
            <Button type="button" size="sm" variant="outline" asChild>
              <Link to={href} state={{ from: `/trips/${tripId}` }}>
                {isVehicle ? copy.invalid.fixVehicle : copy.invalid.fixDriver}
              </Link>
            </Button>
          ) : null}
          <Button type="button" size="sm" variant="outline" onClick={onReloadPreview}>
            {copy.refreshPreview}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

function ConfirmWarnings({ view }: { view: TripFleetSnapshotView }) {
  const codes = new Set<TripFleetWarningCode>();
  for (const block of BLOCKS) {
    for (const warning of view.warnings?.[block] ?? []) codes.add(warning.code);
  }
  if (codes.size === 0) return null;
  return (
    <AlertWithIcon variant="warning" title={copy.warnings.title}>
      <ul className="list-inside list-disc space-y-0.5">
        {[...codes].map((code) => (
          <li key={code}>{copy.warnings[code]}</li>
        ))}
      </ul>
    </AlertWithIcon>
  );
}

function DeactivatedNotices({ view, trip }: { view: TripFleetSnapshotView; trip: Trip }) {
  const vehicle = view.master?.vehicle;
  const driver = view.master?.driver;
  const unitNumber = vehicle?.unitNumber ?? trip.vehicle?.unitNumber ?? cardCopy.value.unavailable;
  return (
    <>
      {vehicle && !vehicle.isActive ? (
        <AlertWithIcon variant="info">
          {vehicle.deactivatedAt
            ? copy.deactivated(unitNumber, formatDate(vehicle.deactivatedAt))
            : copy.deactivatedNoDate(unitNumber)}
        </AlertWithIcon>
      ) : null}
      {driver && !driver.isActive ? (
        <AlertWithIcon variant="info">
          {copy.driverDeactivated(
            driver.driverFullName ?? view.snapshot?.driver.driverFullName ?? cardCopy.value.unavailable,
          )}
        </AlertWithIcon>
      ) : null}
    </>
  );
}

function TripFleetSnapshotRefreshForm({
  trip,
  labels,
  onOpenChange,
}: Omit<TripFleetSnapshotRefreshSheetProps, "open">) {
  const { toast } = useToast();
  const { submissionError, showOverlayError, clearOverlayError } = useOverlayMutationFeedback({
    errorTitle: copy.error.title,
    seeInlineCopy: copy.error.seeInline,
    toast,
  });
  const query = useTripFleetSnapshot(trip.id);
  const view = query.data;
  const [previewState, setPreviewState] = useState<PreviewState>("loading");
  const [inlineError, setInlineError] = useState<InlineErrorKind>(null);
  const [showUnchanged, setShowUnchanged] = useState(false);
  const initialLoadRef = useRef(false);

  const form = useForm<RefreshFormValues>({
    resolver: zodResolver(refreshFormSchema),
    defaultValues: { blocks: allowedBlocks(view), reason: "" },
  });
  const { control, handleSubmit, setValue, getValues, formState } = form;

  const { refetch } = query;
  const applyPreview = useCallback(
    (result: { isError: boolean; data?: TripFleetSnapshotView }) => {
      const next = result.data;
      if (result.isError || !next) {
        setPreviewState("error");
        return false;
      }
      if (!initialLoadRef.current) {
        initialLoadRef.current = true;
        setValue("blocks", allowedBlocks(next));
      } else {
        for (const block of BLOCKS) {
          if (!next.refresh[block].allowed && getValues(`blocks.${block}`)) {
            setValue(`blocks.${block}`, false);
          }
        }
      }
      setPreviewState("ready");
      return true;
    },
    [setValue, getValues],
  );

  const reloadPreview = useCallback(async () => {
    setPreviewState("loading");
    return applyPreview(await refetch());
  }, [refetch, applyPreview]);

  // Al abrir, la vista previa siempre se vuelve a pedir: el catálogo pudo cambiar desde que se pintó la tarjeta.
  useEffect(() => {
    void refetch().then(applyPreview);
  }, [refetch, applyPreview]);

  const mutation = useRefreshTripFleetSnapshot(trip.id, {
    onSuccess: (outcome) => {
      const refreshed = outcome.view;
      let description: string | undefined;
      if (refreshed) {
        description =
          refreshed.cpInvoiceOutdated && refreshed.cpInvoice
            ? toastCopy.successWithInvoice(formatCpInvoiceFolio(refreshed.cpInvoice))
            : toastCopy.successNoInvoice;
      }
      toast({ variant: "success", title: toastCopy.successTitle, description });
      onOpenChange(false);
    },
    onError: (error) => {
      const kind = classifyFleetRefreshError(error);
      if (kind === "forbidden" || kind === "stale") {
        setInlineError(kind);
        return;
      }
      if (kind === "invalid") {
        void reloadPreview();
        return;
      }
      showOverlayError(getErrorMessage(error));
      if (kind === "notAllowed") void reloadPreview();
    },
  });

  const handleReloadAfterStale = async () => {
    if (await reloadPreview()) setInlineError(null);
  };

  const onValid = (values: RefreshFormValues) => {
    if (!view?.snapshot) return;
    clearOverlayError();
    setInlineError(null);
    mutation.mutate({
      blocks: values.blocks,
      reason: values.reason,
      expected: {
        snapshotUpdatedAt: view.snapshot.updatedAt,
        masterFingerprint: {
          vehicle: view.masterFingerprint?.vehicle ?? undefined,
          driver: view.masterFingerprint?.driver ?? undefined,
        },
      },
    });
  };

  const onInvalid = (errors: FieldErrors<RefreshFormValues>) => {
    queueMicrotask(() => {
      const firstInvalid = errors.blocks
        ? document.querySelector<HTMLElement>(`button[id^="${BLOCKS_FIELD_ID}-"]:not([disabled])`)
        : document.getElementById(REASON_FIELD_ID);
      firstInvalid?.focus();
    });
  };

  const summaryMessages =
    formState.submitCount > 0
      ? [formState.errors.blocks?.message, formState.errors.reason?.message].filter(
          (message): message is string => Boolean(message),
        )
      : [];

  const isReady = previewState === "ready" && Boolean(view?.snapshot);
  const nothingToRefresh =
    isReady &&
    view!.refresh.vehicle.reasonCode === "FLEET_SNAPSHOT_NO_CHANGES" &&
    view!.refresh.driver.reasonCode === "FLEET_SNAPSHOT_NO_CHANGES";
  const submitDisabled =
    !isReady ||
    !view?.refresh.allowed ||
    mutation.isPending ||
    inlineError !== null;

  const unitNumber =
    view?.master?.vehicle.unitNumber ?? trip.vehicle?.unitNumber ?? cardCopy.value.unavailable;
  const frozenPlate = view?.snapshot?.vehicle.licensePlate ?? cardCopy.value.empty;
  const frozenDriverName = view?.snapshot?.driver.driverFullName ?? cardCopy.value.empty;
  const blockLabels: Record<TripFleetSnapshotBlock, string> = {
    vehicle: copy.blockVehicle(unitNumber, frozenPlate),
    driver: copy.blockDriver(frozenDriverName),
  };

  return (
    <form
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
      noValidate
      onSubmit={handleSubmit(onValid, onInvalid)}
    >
      <SheetHeader className={FISCAL_CORRECTION_SHEET_HEADER_CLASS}>
        <SheetTitle className="pr-8">{copy.title}</SheetTitle>
        <SheetDescription className="text-muted-foreground">
          {copy.description(trip.tripCode)}
        </SheetDescription>
      </SheetHeader>

      <div className={FISCAL_CORRECTION_SHEET_BODY_CLASS}>
        {inlineError === "forbidden" ? (
          <Alert variant="destructive">
            <AlertTitle>{copy.error.title}</AlertTitle>
            <AlertDescription>{copy.error.forbidden}</AlertDescription>
          </Alert>
        ) : null}
        {inlineError === "stale" ? (
          <Alert variant="warning" data-testid="fleet-refresh-stale">
            <AlertTitle>{copy.error.stale.title}</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>{copy.error.stale.body}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void handleReloadAfterStale()}
                disabled={previewState === "loading"}
              >
                {copy.refreshPreview}
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}
        {submissionError ? (
          <Alert variant="destructive">
            <AlertTitle>{copy.error.title}</AlertTitle>
            <AlertDescription className="select-text whitespace-pre-wrap break-words">
              {submissionError}
            </AlertDescription>
          </Alert>
        ) : null}

        <p className="text-sm text-muted-foreground">{copy.guidance}</p>

        {previewState === "loading" ? (
          <div className="space-y-2" aria-busy="true">
            <p className="text-sm text-muted-foreground">{copy.loadingPreview}</p>
            <Skeleton className="h-24 w-full" />
          </div>
        ) : null}

        {previewState === "error" ? (
          <Alert variant="destructive">
            <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
              <span>{copy.previewError}</span>
              <Button type="button" size="sm" variant="outline" onClick={() => void reloadPreview()}>
                {copy.retry}
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {isReady && view ? (
          <>
            {nothingToRefresh ? (
              <AlertWithIcon variant="info">{copy.nothingToRefresh}</AlertWithIcon>
            ) : null}

            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium">{copy.blocksLabel}</legend>
              {BLOCKS.map((block) => {
                const state = view.refresh[block];
                const disabledReason = state.allowed
                  ? null
                  : describeBlockDisabledReason(state.reasonCode);
                const checkboxId = `${BLOCKS_FIELD_ID}-${block}`;
                const reasonId = `${checkboxId}-reason`;
                return (
                  <Controller
                    key={block}
                    control={control}
                    name={`blocks.${block}`}
                    render={({ field }) => (
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id={checkboxId}
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                          disabled={!state.allowed || mutation.isPending}
                          aria-describedby={disabledReason ? reasonId : undefined}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 space-y-0.5">
                          <Label htmlFor={checkboxId} className="font-normal">
                            {blockLabels[block]}
                          </Label>
                          {disabledReason ? (
                            <p id={reasonId} className="text-xs text-muted-foreground">
                              {disabledReason}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    )}
                  />
                );
              })}
              <FieldInlineError
                fieldId={BLOCKS_FIELD_ID}
                message={formState.errors.blocks?.message}
              />
            </fieldset>

            {BLOCKS.map((block) => (
              <InvalidMasterAlert
                key={block}
                view={view}
                block={block}
                tripId={trip.id}
                onReloadPreview={() => void reloadPreview()}
              />
            ))}

            <DeactivatedNotices view={view} trip={trip} />
            <ConfirmWarnings view={view} />

            <Controller
              control={control}
              name="blocks"
              render={({ field }) => (
                <div className="space-y-3">
                  {BLOCKS.filter((block) => field.value[block]).map((block) => (
                    <ComparisonTable
                      key={block}
                      view={view}
                      block={block}
                      labels={labels}
                      showUnchanged={showUnchanged}
                    />
                  ))}
                  {field.value.vehicle || field.value.driver ? (
                    <div className="flex items-center gap-2">
                      <Switch
                        id="fleet-refresh-show-unchanged"
                        checked={showUnchanged}
                        onCheckedChange={setShowUnchanged}
                      />
                      <Label htmlFor="fleet-refresh-show-unchanged" className="font-normal">
                        {copy.showUnchanged}
                      </Label>
                    </div>
                  ) : null}
                </div>
              )}
            />

            <AlertWithIcon variant="warning" title={copy.fiscal.title}>
              {view.cpInvoice
                ? copy.fiscal.bodyWithInvoice(formatCpInvoiceFolio(view.cpInvoice))
                : copy.fiscal.bodyNoInvoice}
            </AlertWithIcon>
          </>
        ) : null}

        <Controller
          control={control}
          name="reason"
          render={({ field, fieldState }) => {
            const message = fieldState.error?.message;
            return (
              <FormFieldShell
                fieldId={REASON_FIELD_ID}
                label={copy.reason.label}
                required
                description={copy.reason.help}
                errorMessage={message}
              >
                <Textarea
                  id={REASON_FIELD_ID}
                  {...field}
                  rows={3}
                  placeholder={copy.reason.placeholder}
                  disabled={mutation.isPending}
                  error={Boolean(message)}
                  {...getFieldErrorAriaProps(REASON_FIELD_ID, message)}
                />
                <p className="text-right text-xs text-muted-foreground" aria-live="polite">
                  {copy.reason.counter(field.value.length)}
                </p>
              </FormFieldShell>
            );
          }}
        />

        <FormValidationSummary title={copy.validationSummary} messages={summaryMessages} />
      </div>

      <SheetFooter className={FISCAL_CORRECTION_SHEET_FOOTER_CLASS}>
        <Button
          type="button"
          variant="outline"
          className={FISCAL_CORRECTION_SHEET_PRIMARY_BUTTON_CLASS}
          onClick={() => onOpenChange(false)}
          disabled={mutation.isPending}
        >
          {copy.cancel}
        </Button>
        <Button
          type="submit"
          className={FISCAL_CORRECTION_SHEET_PRIMARY_BUTTON_CLASS}
          disabled={submitDisabled}
        >
          {mutation.isPending ? copy.submitting : copy.submit}
        </Button>
      </SheetFooter>
    </form>
  );
}

export function TripFleetSnapshotRefreshSheet({
  open,
  ...props
}: TripFleetSnapshotRefreshSheetProps) {
  return (
    <Sheet open={open} onOpenChange={props.onOpenChange}>
      <SheetContent side="right" className={FISCAL_CORRECTION_SHEET_CONTENT_CLASS}>
        {open ? <TripFleetSnapshotRefreshForm {...props} /> : null}
      </SheetContent>
    </Sheet>
  );
}
