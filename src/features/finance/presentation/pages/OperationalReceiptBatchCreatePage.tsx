/**
 * Página «Registrar cobro por lote» (PRD D2–D4).
 * Reparto solo vía `@boeltech/cfdi-domain` (HB-T7).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { HandCoins } from "lucide-react";
import {
  allocateOperationalReceiptBatch,
  operationalReceiptReferenceRequired,
  suggestOperationalReceiptAllocation,
  type OperationalPaymentInstrument,
  type OperationalReceiptCandidateTrip,
} from "@boeltech/cfdi-domain";

import { useClient } from "@features/clients/application";
import {
  useCreateOperationalReceiptBatch,
  useOperationalReceiptBatchCandidates,
} from "@features/finance/application";
import type { OperationalReceiptBatchCandidate } from "@features/finance/domain";
import { TripStatusBadge } from "@features/trips/presentation";
import type { TripStatusType } from "@features/trips/domain";
import { isApiError } from "@shared/api/interceptors/error-handler";
import { useToast, useUnsavedChangesGuard } from "@shared/hooks";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import { DetailAlertCard } from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import {
  FormFieldShell,
  FormStickyActions,
  FormValidationSummary,
  MoneyInput,
  RHFDateField,
  RHFSelect,
  RHFTextareaField,
  UnsavedChangesDialog,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import { Skeleton } from "@shared/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { cn } from "@shared/lib/utils/cn";
import {
  getTodayString,
  localInputToUtcIso,
  formatDate,
} from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { useMasterActionFrom } from "@shared/utils/masterWayfinding";

import { operationalReceiptBatchCopy } from "../copy/operationalReceiptBatchCopy";
import { OperationalReceiptBatchSheet } from "../components/OperationalReceiptBatchSheet";

const copy = operationalReceiptBatchCopy;
const MXN_EPS = 0.01;

const INSTRUMENT_OPTIONS = [
  { value: "cash", label: copy.instruments.cash },
  { value: "transfer", label: copy.instruments.transfer },
  { value: "check", label: copy.instruments.check },
  { value: "other", label: copy.instruments.other },
] as const;

function localDateToCollectedAtIso(dateYmd: string): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return localInputToUtcIso(`${dateYmd}T${hh}:${mm}`);
}

function toPackageTrip(
  c: OperationalReceiptBatchCandidate,
  clientId: string,
): OperationalReceiptCandidateTrip {
  return {
    tripId: c.tripId,
    tripCode: c.tripCode,
    clientId,
    cfdiEmissionIntent: "sin_cfdi_efectivo",
    status: c.status,
    scheduledDeparture: c.scheduledDeparture,
    baseRate: c.baseRate,
    collectedTotal: c.collectedTotal,
  };
}

function buildSchema(instrument: OperationalPaymentInstrument) {
  return z
    .object({
      amount: z
        .number({ error: copy.validation.amountRequired })
        .positive(copy.validation.amountPositive),
      paymentInstrument: z.enum(["cash", "transfer", "check", "other"]),
      reference: z.string().max(120, copy.validation.referenceMax).optional(),
      collectedAt: z.string().min(1, copy.validation.collectedAtRequired),
      note: z
        .string()
        .max(250, copy.validation.noteMax)
        .optional()
        .or(z.literal("")),
    })
    .superRefine((values, ctx) => {
      const today = getTodayString();
      if (values.collectedAt > today) {
        ctx.addIssue({
          code: "custom",
          path: ["collectedAt"],
          message: copy.validation.collectedAtFuture,
        });
      }
      const inst = values.paymentInstrument ?? instrument;
      if (operationalReceiptReferenceRequired(inst)) {
        const ref = values.reference?.trim() ?? "";
        if (!ref) {
          ctx.addIssue({
            code: "custom",
            path: ["reference"],
            message:
              inst === "check"
                ? copy.validation.referenceRequiredCheck
                : copy.validation.referenceRequiredTransfer,
          });
        }
      }
    });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export function OperationalReceiptBatchCreatePage() {
  const { id: clientId = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fromState = useMasterActionFrom("/clients");
  const backHref = `/clients/${clientId}`;
  const clientQuery = useClient(clientId);
  const candidatesQuery = useOperationalReceiptBatchCandidates(clientId);
  const idempotencyKeyRef = useRef(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [edited, setEdited] = useState(false);
  const [search, setSearch] = useState("");
  const [balanceAlert, setBalanceAlert] = useState<string | null>(null);
  const [excessAlert, setExcessAlert] = useState<string | null>(null);
  const [disabledTrips, setDisabledTrips] = useState<Set<string>>(new Set());
  const [batchSheetId, setBatchSheetId] = useState<string | null>(null);
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({});

  const candidates = candidatesQuery.data?.data ?? [];

  useEffect(() => {
    if (!candidates.length) return;
    setSelectedIds(new Set(candidates.map((c) => c.tripId)));
    setEdited(false);
    setDisabledTrips(new Set());
  }, [candidatesQuery.dataUpdatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const form = useForm<FormValues>({
    resolver: zodResolver(buildSchema("cash")) as Resolver<FormValues>,
    defaultValues: {
      amount: undefined as unknown as number,
      paymentInstrument: "cash",
      reference: "",
      collectedAt: getTodayString(),
      note: "",
    },
    mode: "onSubmit",
  });

  const amount = form.watch("amount");
  const paymentInstrument = form.watch(
    "paymentInstrument",
  ) as OperationalPaymentInstrument;
  const referenceRequired = operationalReceiptReferenceRequired(
    paymentInstrument ?? "cash",
  );

  const selectedCandidates = useMemo(
    () => candidates.filter((c) => selectedIds.has(c.tripId)),
    [candidates, selectedIds],
  );

  // Modo sugerido: rellenar montos al cambiar monto o selección
  useEffect(() => {
    if (edited) return;
    const amt = typeof amount === "number" && amount > 0 ? amount : 0;
    if (!selectedCandidates.length || amt <= 0) {
      setAmounts({});
      return;
    }
    const plan = suggestOperationalReceiptAllocation(
      amt,
      selectedCandidates.map((c) => toPackageTrip(c, clientId)),
    );
    const next: Record<string, number> = {};
    for (const line of plan.lines) {
      next[line.tripId] = line.amount;
    }
    for (const c of selectedCandidates) {
      if (!(c.tripId in next)) next[c.tripId] = 0;
    }
    setAmounts(next);
  }, [amount, selectedCandidates, edited, clientId]);

  const allocatedTotal = useMemo(
    () =>
      Object.entries(amounts).reduce((sum, [id, v]) => {
        if (!selectedIds.has(id)) return sum;
        return sum + (v > 0 ? v : 0);
      }, 0),
    [amounts, selectedIds],
  );
  const selectedPending = useMemo(
    () => selectedCandidates.reduce((s, c) => s + c.pendingAmount, 0),
    [selectedCandidates],
  );
  const unallocated =
    typeof amount === "number" ? amount - allocatedTotal : 0;
  const liveExcess =
    typeof amount === "number" && amount > selectedPending + MXN_EPS
      ? amount - selectedPending
      : 0;

  useEffect(() => {
    if (liveExcess > MXN_EPS) {
      setExcessAlert(
        copy.excessAlert(
          formatMxCurrency(liveExcess),
          formatMxCurrency(selectedPending),
        ),
      );
    } else {
      setExcessAlert(null);
    }
  }, [liveExcess, selectedPending]);

  const positiveLines = useMemo(
    () =>
      Object.entries(amounts)
        .filter(([id, v]) => selectedIds.has(id) && v > MXN_EPS)
        .map(([tripId, lineAmount]) => ({ tripId, amount: lineAmount })),
    [amounts, selectedIds],
  );

  const isDirty =
    form.formState.isDirty ||
    edited ||
    (typeof amount === "number" && amount > 0);
  const { blocker, allowLeave } = useUnsavedChangesGuard({
    isDirty: isDirty && !form.formState.isSubmitSuccessful,
  });

  const createMutation = useCreateOperationalReceiptBatch(clientId, {
    onSuccess: (batch) => {
      allowLeave();
      toast({
        title: copy.toast.success(batch.receiptCount),
        variant: "success",
        action: {
          label: copy.toast.viewBatch,
          onClick: () => setBatchSheetId(batch.id),
        },
      });
      navigate(backHref, { state: fromState, replace: true });
    },
    onError: (error) => {
      if (!isApiError(error)) {
        toast({ title: copy.toast.error, variant: "error" });
        return;
      }
      const code = error.code ?? "";
      if (
        code === "OPERATIONAL_RECEIPT_BATCH_BALANCE_CHANGED" ||
        code === "OPERATIONAL_RECEIPT_BATCH_TRIP_NOT_ELIGIBLE" ||
        code === "OPERATIONAL_RECEIPT_BATCH_LINE_EXCEEDS_PENDING"
      ) {
        setBalanceAlert(copy.balanceChangedAlert);
        void candidatesQuery.refetch().then((res) => {
          const trips = (
            error.details as {
              trips?: {
                trip_id?: string;
                pending_amount?: number;
              }[];
            } | undefined
          )?.trips;
          if (code === "OPERATIONAL_RECEIPT_BATCH_TRIP_NOT_ELIGIBLE" && trips) {
            setDisabledTrips(new Set(trips.map((t) => t.trip_id ?? "")));
            setAmounts((prev) => {
              const next = { ...prev };
              for (const t of trips) {
                if (t.trip_id) next[t.trip_id] = 0;
              }
              return next;
            });
          }
          if (
            !edited &&
            res.data?.data &&
            typeof amount === "number" &&
            amount > 0
          ) {
            const plan = suggestOperationalReceiptAllocation(
              amount,
              res.data.data
                .filter((c) => selectedIds.has(c.tripId))
                .map((c) => toPackageTrip(c, clientId)),
            );
            const next: Record<string, number> = {};
            for (const line of plan.lines) next[line.tripId] = line.amount;
            setAmounts(next);
          } else if (trips) {
            const errs: Record<string, string> = {};
            for (const t of trips) {
              if (!t.trip_id) continue;
              const pending = t.pending_amount ?? 0;
              const current = amounts[t.trip_id] ?? 0;
              if (current > pending + MXN_EPS) {
                errs[t.trip_id] = copy.validation.lineMax(
                  formatMxCurrency(pending),
                );
              }
            }
            setLineErrors(errs);
          }
        });
        return;
      }
      if (code === "OPERATIONAL_RECEIPT_BATCH_EXCEEDS_PENDING_TOTAL") {
        const excess = Number(
          (error.details as { excess?: number } | undefined)?.excess ?? 0,
        );
        setExcessAlert(
          copy.excessAlert(
            formatMxCurrency(excess),
            formatMxCurrency(selectedPending),
          ),
        );
        return;
      }
      if (
        code === "OPERATIONAL_RECEIPT_REFERENCE_REQUIRED" ||
        code === "OPERATIONAL_RECEIPT_COLLECTED_AT_FUTURE"
      ) {
        if (code === "OPERATIONAL_RECEIPT_REFERENCE_REQUIRED") {
          form.setError("reference", {
            message:
              paymentInstrument === "check"
                ? copy.validation.referenceRequiredCheck
                : copy.validation.referenceRequiredTransfer,
          });
        } else {
          form.setError("collectedAt", {
            message: copy.validation.collectedAtFuture,
          });
        }
        return;
      }
      toast({
        title: copy.toast.error,
        description: error.message,
        variant: "error",
      });
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((c) => c.tripCode.toLowerCase().includes(q));
  }, [candidates, search]);

  const summaryMessages = useMemo(() => {
    const msgs: string[] = [];
    const fe = form.formState.errors;
    for (const key of [
      "amount",
      "paymentInstrument",
      "reference",
      "collectedAt",
      "note",
    ] as const) {
      const m = fe[key]?.message;
      if (m) msgs.push(m);
    }
    if (form.formState.isSubmitted && positiveLines.length === 0) {
      msgs.push(copy.validation.atLeastOne);
    }
    if (
      form.formState.isSubmitted &&
      typeof amount === "number" &&
      Math.abs(unallocated) > MXN_EPS
    ) {
      msgs.push(
        unallocated > 0
          ? copy.validation.unallocatedShort(formatMxCurrency(unallocated))
          : copy.validation.unallocatedOver(formatMxCurrency(-unallocated)),
      );
    }
    for (const err of Object.values(lineErrors)) {
      if (err) msgs.push(err);
    }
    return msgs;
  }, [
    form.formState.errors,
    form.formState.isSubmitted,
    positiveLines.length,
    amount,
    unallocated,
    lineErrors,
  ]);

  const onSubmit = form.handleSubmit((values) => {
    setBalanceAlert(null);
    setLineErrors({});

    if (liveExcess > MXN_EPS) {
      setExcessAlert(
        copy.excessAlert(
          formatMxCurrency(liveExcess),
          formatMxCurrency(selectedPending),
        ),
      );
      return;
    }
    if (positiveLines.length === 0) return;
    if (Math.abs(unallocated) > MXN_EPS) return;

    const packageTrips = selectedCandidates.map((c) =>
      toPackageTrip(c, clientId),
    );
    const validation = allocateOperationalReceiptBatch({
      clientId,
      amount: values.amount,
      trips: packageTrips,
      allocations: positiveLines,
    });
    if (!validation.ok) {
      const first = validation.error[0];
      if (first?.code === "OPERATIONAL_RECEIPT_BATCH_LINE_EXCEEDS_PENDING") {
        const errs: Record<string, string> = {};
        for (const c of selectedCandidates) {
          const lineAmt = amounts[c.tripId] ?? 0;
          if (lineAmt > c.pendingAmount + MXN_EPS) {
            errs[c.tripId] = copy.validation.lineMax(
              formatMxCurrency(c.pendingAmount),
            );
          }
        }
        setLineErrors(errs);
      }
      return;
    }

    const pendingById = new Map(
      candidates.map((c) => [c.tripId, c.pendingAmount]),
    );
    createMutation.mutate({
      amount: values.amount,
      paymentInstrument: values.paymentInstrument,
      reference: values.reference?.trim() || null,
      collectedAt: localDateToCollectedAtIso(values.collectedAt),
      note: values.note?.trim() || null,
      idempotencyKey: idempotencyKeyRef.current,
      allocations: positiveLines.map((line) => ({
        tripId: line.tripId,
        amount: line.amount,
        expectedPendingAmount: pendingById.get(line.tripId) ?? 0,
      })),
    });
  });

  const clientName =
    clientQuery.data?.tradeName?.trim() ||
    clientQuery.data?.legalName?.trim() ||
    "Cliente";
  const isSubmitting = createMutation.isPending;
  const hasCandidates = candidates.length > 0;

  return (
    <>
      <FormPageShell
        isLoading={clientQuery.isLoading}
        notFound={clientQuery.isError || (!clientQuery.isLoading && !clientQuery.data)}
        notFoundConfig={{
          icon: <HandCoins className="h-8 w-8" />,
          title: "Cliente no encontrado",
          description: "No se pudo abrir el cobro por lote para este cliente.",
        }}
        header={{
          backHref,
          title: copy.page.title,
          subtitle: clientName,
          icon: <HandCoins className="h-5 w-5" />,
        }}
      >
        <p className="mb-4 text-sm text-muted-foreground">
          {copy.page.disclaimer}
        </p>

        <form
          id="operational-receipt-batch-form"
          className="space-y-8"
          onSubmit={onSubmit}
          noValidate
        >
          <section className="space-y-4" aria-labelledby="zone-payment">
            <h2 id="zone-payment" className="text-base font-semibold">
              {copy.page.zonePayment}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormFieldShell
                fieldId="batch-amount"
                label={copy.page.amount}
                required
                errorMessage={form.formState.errors.amount?.message}
              >
                <MoneyInput
                  id="batch-amount"
                  value={amount}
                  onValueChange={(v) =>
                    form.setValue("amount", v as number, {
                      shouldDirty: true,
                      shouldValidate: form.formState.isSubmitted,
                    })
                  }
                  disabled={isSubmitting}
                  error={Boolean(form.formState.errors.amount)}
                  {...getFieldErrorAriaProps(
                    "batch-amount",
                    form.formState.errors.amount?.message,
                  )}
                />
              </FormFieldShell>

              <FormFieldShell
                fieldId="batch-instrument"
                label={copy.page.instrument}
                required
                errorMessage={form.formState.errors.paymentInstrument?.message}
              >
                <RHFSelect
                  control={form.control}
                  name="paymentInstrument"
                  triggerId="batch-instrument"
                  options={[...INSTRUMENT_OPTIONS]}
                  allowNone={false}
                  showFieldError={false}
                />
              </FormFieldShell>

              <FormFieldShell
                fieldId="batch-reference"
                label={copy.page.reference}
                required={referenceRequired}
                errorMessage={form.formState.errors.reference?.message}
              >
                <Input
                  id="batch-reference"
                  placeholder={
                    copy.referencePlaceholder[paymentInstrument ?? "cash"]
                  }
                  disabled={isSubmitting}
                  error={Boolean(form.formState.errors.reference)}
                  {...form.register("reference")}
                  {...getFieldErrorAriaProps(
                    "batch-reference",
                    form.formState.errors.reference?.message,
                  )}
                />
              </FormFieldShell>

              <RHFDateField
                control={form.control}
                name="collectedAt"
                label={copy.page.collectedAt}
                required
                disabled={isSubmitting}
                max={getTodayString()}
              />

              <div className="sm:col-span-2">
                <RHFTextareaField
                  control={form.control}
                  name="note"
                  label={copy.page.note}
                  placeholder={copy.page.notePlaceholder}
                  disabled={isSubmitting}
                  rows={2}
                />
              </div>
            </div>
          </section>

          <section className="space-y-3" aria-labelledby="zone-trips">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="zone-trips" className="text-base font-semibold">
                {copy.page.zoneTrips}
              </h2>
              {edited ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">
                    {copy.page.editedBadge}
                  </span>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    onClick={() => setEdited(false)}
                  >
                    {copy.page.resetSuggest}
                  </Button>
                </div>
              ) : null}
            </div>

            {balanceAlert ? (
              <Alert variant="warning">
                <AlertDescription>{balanceAlert}</AlertDescription>
              </Alert>
            ) : null}
            {excessAlert ? (
              <Alert variant="destructive">
                <AlertDescription>{excessAlert}</AlertDescription>
              </Alert>
            ) : null}

            {candidatesQuery.isLoading ? (
              <div className="space-y-2" aria-busy="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : candidatesQuery.isError ? (
              <DetailAlertCard
                severity="critical"
                title={copy.page.loadErrorTitle}
                items={[]}
                action={
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void candidatesQuery.refetch()}
                  >
                    {copy.page.loadErrorRetry}
                  </Button>
                }
              />
            ) : !hasCandidates ? (
              <EmptyState
                icon={<HandCoins className="h-8 w-8" />}
                title={copy.page.emptyTitle}
                description={copy.page.emptyDescription}
                cta={{
                  label: copy.page.emptyBack,
                  onClick: () => navigate(backHref, { state: fromState }),
                  variant: "outline",
                }}
              />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    className="max-w-xs"
                    placeholder={copy.page.searchPlaceholder}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() =>
                      setSelectedIds(new Set(candidates.map((c) => c.tripId)))
                    }
                  >
                    {copy.page.selectAll}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => {
                      setSelectedIds(new Set());
                      setAmounts({});
                    }}
                  >
                    {copy.page.selectNone}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {copy.page.selectedCount(
                      selectedIds.size,
                      candidates.length,
                    )}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10" />
                        <TableHead>{copy.page.columns.trip}</TableHead>
                        <TableHead>{copy.page.columns.departure}</TableHead>
                        <TableHead>{copy.page.columns.status}</TableHead>
                        <TableHead className="text-right">
                          {copy.page.columns.pendingBefore}
                        </TableHead>
                        <TableHead className="text-right">
                          {copy.page.columns.amount}
                        </TableHead>
                        <TableHead className="text-right">
                          {copy.page.columns.pendingAfter}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((trip) => {
                        const checked = selectedIds.has(trip.tripId);
                        const lineAmt = checked
                          ? (amounts[trip.tripId] ?? 0)
                          : 0;
                        const after = Math.max(0, trip.pendingAmount - lineAmt);
                        const disabled =
                          isSubmitting || disabledTrips.has(trip.tripId);
                        const muted = !checked || lineAmt <= MXN_EPS;
                        return (
                          <TableRow
                            key={trip.tripId}
                            className={cn(muted && "opacity-60")}
                          >
                            <TableCell>
                              <Checkbox
                                checked={checked}
                                disabled={disabled}
                                onCheckedChange={(v) => {
                                  setSelectedIds((prev) => {
                                    const next = new Set(prev);
                                    if (v) next.add(trip.tripId);
                                    else {
                                      next.delete(trip.tripId);
                                      setAmounts((a) => ({
                                        ...a,
                                        [trip.tripId]: 0,
                                      }));
                                    }
                                    return next;
                                  });
                                }}
                                aria-label={trip.tripCode}
                              />
                            </TableCell>
                            <TableCell className="font-mono font-medium">
                              {trip.tripCode}
                              {disabledTrips.has(trip.tripId) ? (
                                <span className="mt-0.5 block text-xs text-destructive">
                                  {copy.page.notEligible}
                                </span>
                              ) : null}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {trip.scheduledDeparture
                                ? formatDate(trip.scheduledDeparture)
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <TripStatusBadge
                                status={trip.status as TripStatusType}
                              />
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatMxCurrency(trip.pendingAmount)}
                            </TableCell>
                            <TableCell className="text-right">
                              {checked && !disabledTrips.has(trip.tripId) ? (
                                <MoneyInput
                                  className="ml-auto max-w-[8rem]"
                                  value={lineAmt || undefined}
                                  aria-label={`Abono al viaje ${trip.tripCode}`}
                                  disabled={disabled}
                                  error={Boolean(lineErrors[trip.tripId])}
                                  onValueChange={(v) => {
                                    setEdited(true);
                                    setAmounts((prev) => ({
                                      ...prev,
                                      [trip.tripId]: (v as number) || 0,
                                    }));
                                    setLineErrors((prev) => {
                                      const next = { ...prev };
                                      delete next[trip.tripId];
                                      return next;
                                    });
                                  }}
                                />
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  {copy.page.noAllocation}
                                </span>
                              )}
                              {lineErrors[trip.tripId] ? (
                                <p className="mt-0.5 text-xs text-destructive">
                                  {lineErrors[trip.tripId]}
                                </p>
                              ) : null}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatMxCurrency(after)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div
                  className={cn(
                    "sticky bottom-16 z-10 flex flex-wrap gap-4 rounded-md border bg-card px-3 py-2 text-sm shadow-sm",
                    Math.abs(unallocated) > MXN_EPS && "border-warning",
                  )}
                >
                  <span>
                    {copy.page.footer.selectedPending}:{" "}
                    <strong className="tabular-nums">
                      {formatMxCurrency(selectedPending)}
                    </strong>
                  </span>
                  <span>
                    {copy.page.footer.allocated}:{" "}
                    <strong className="tabular-nums">
                      {formatMxCurrency(allocatedTotal)}
                    </strong>
                  </span>
                  <span
                    className={cn(
                      Math.abs(unallocated) > MXN_EPS && "text-warning-foreground",
                    )}
                  >
                    {copy.page.footer.unallocated}:{" "}
                    <strong className="tabular-nums">
                      {formatMxCurrency(unallocated)}
                    </strong>
                  </span>
                </div>
              </>
            )}
          </section>

          {form.formState.isSubmitted && summaryMessages.length > 0 ? (
            <FormValidationSummary messages={summaryMessages} />
          ) : null}

          <FormStickyActions>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              asChild
            >
              <Link to={backHref} state={fromState}>
                {copy.page.cancel}
              </Link>
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !hasCandidates ||
                !(typeof amount === "number" && amount > 0)
              }
            >
              {isSubmitting
                ? copy.page.submitting
                : copy.page.submit(
                    formatMxCurrency(
                      typeof amount === "number" ? amount : 0,
                    ),
                    positiveLines.length || selectedIds.size,
                  )}
            </Button>
          </FormStickyActions>
        </form>
      </FormPageShell>

      <UnsavedChangesDialog blocker={blocker} />
      <OperationalReceiptBatchSheet
        batchId={batchSheetId}
        open={Boolean(batchSheetId)}
        onOpenChange={(open) => {
          if (!open) setBatchSheetId(null);
        }}
      />
    </>
  );
}
