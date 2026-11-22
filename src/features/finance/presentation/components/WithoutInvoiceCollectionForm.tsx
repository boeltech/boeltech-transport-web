/**
 * Formulario «Registrar cobro» — canal Sin factura (F1).
 * Alta siempre vía batch N≥1. Reparto solo vía `@boeltech/cfdi-domain` (HB-T7).
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, HandCoins } from "lucide-react";
import {
  allocateOperationalReceiptBatch,
  operationalReceiptReferenceRequired,
  suggestOperationalReceiptAllocation,
  type OperationalPaymentInstrument,
  type OperationalReceiptCandidateTrip,
} from "@boeltech/cfdi-domain";

import { useClient } from "@features/clients/application";
import {
  buildClientOperationalReceiptBatchHref,
  FINANCE_EFECTIVO_POR_COBRAR_PATH,
  useCreateOperationalReceiptBatch,
  useOperationalReceiptBatchCandidates,
} from "@features/finance/application";
import type { OperationalReceiptBatchCandidate } from "@features/finance/domain";
import { TripStatusBadge } from "@features/trips/presentation";
import type { TripStatusType } from "@features/trips/domain";
import { isApiError } from "@shared/api/interceptors/error-handler";
import { useToast, useUnsavedChangesGuard } from "@shared/hooks";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import { DetailAlertCard } from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import {
  FormFieldShell,
  FormStickyActions,
  FormValidationSummary,
  formatMoneyAmountOnly,
  RHFDateField,
  RHFSelect,
  RHFTextareaField,
  UnsavedChangesDialog,
  getFieldErrorAriaProps,
  MoneyInput,
} from "@shared/ui/form";
import { FormSectionCard } from "@shared/ui/form-section-card";
import { Input } from "@shared/ui/input";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListMoneyEditableValue,
  type EntityListStackedValue,
} from "@shared/ui/table";
import { cn } from "@shared/lib/utils/cn";
import {
  getTodayString,
  localInputToUtcIso,
  formatDate,
} from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import {
  MODULE_LIST_PATH_LABELS,
  useMasterActionFrom,
} from "@shared/utils/masterWayfinding";

import { operationalReceiptBatchCopy } from "../copy/operationalReceiptBatchCopy";
import { registerCollectionCopy } from "../copy/registerCollectionCopy";
import {
  appendCobrosTodayEntry,
  buildWithoutInvoiceCobrosTodayEntry,
  readCobrosTodayTray,
} from "../utils/cobrosFollowThrough";
import {
  resolveOperationalReceiptBatchCreateBackHref,
  resolveOperationalReceiptBatchCreateSuccessHref,
} from "../utils/operationalCashPendingWayfinding";
import { resolvePremarkedIds } from "../utils/registerCollectionQuery";

const copy = operationalReceiptBatchCopy;
const MXN_EPS = 0.01;
const MONEY_LOCALE = "es-MX";

/** Celda money T4: cantidad mono sin `$` / sin sufijo ISO (unidad en header). */
function formatBatchTableMoney(amount: number): string {
  return formatMoneyAmountOnly(amount, MONEY_LOCALE, 2);
}
/** Identidad estable mientras candidatesQuery aún no tiene data (evita loop de renders). */
const EMPTY_CANDIDATES: OperationalReceiptBatchCandidate[] = [];

function amountsRecordsEqual(
  a: Record<string, number>,
  b: Record<string, number>,
): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

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

const EMPTY_PREMARKED_IDS: readonly string[] = [];

export interface WithoutInvoiceCollectionFormProps {
  clientId: string;
  /** Retorno seguro (`from` query). */
  from?: string | null;
  /** Viajes premarcados (p. ej. `tripId` / `tripIds` en query). */
  premarkedTripIds?: readonly string[];
}

export function WithoutInvoiceCollectionForm({
  clientId,
  from,
  premarkedTripIds = EMPTY_PREMARKED_IDS,
}: WithoutInvoiceCollectionFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fromState = useMasterActionFrom("/clients");
  const backHref = resolveOperationalReceiptBatchCreateBackHref(
    from ?? undefined,
    clientId,
  );
  const listLabel =
    MODULE_LIST_PATH_LABELS[FINANCE_EFECTIVO_POR_COBRAR_PATH] ??
    "Cobros sin factura";
  const shellCrumbs = [
    { label: listLabel, to: FINANCE_EFECTIVO_POR_COBRAR_PATH },
    { label: copy.page.title },
  ] as const;
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
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({});

  const candidates = candidatesQuery.data?.data ?? EMPTY_CANDIDATES;

  const premarkedKey = premarkedTripIds.join(",");
  useEffect(() => {
    if (!candidates.length) return;
    const allIds = candidates.map((c) => c.tripId);
    setSelectedIds(resolvePremarkedIds(premarkedTripIds, allIds));
    setEdited(false);
    setDisabledTrips(new Set());
    // premarkedKey estabiliza arrays nuevos con el mismo contenido.
  }, [candidatesQuery.dataUpdatedAt, premarkedKey]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (edited || candidatesQuery.isLoading) return;
    const amt = typeof amount === "number" && amount > 0 ? amount : 0;
    if (!selectedCandidates.length || amt <= 0) {
      setAmounts((prev) => (Object.keys(prev).length === 0 ? prev : {}));
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
    setAmounts((prev) => (amountsRecordsEqual(prev, next) ? prev : next));
  }, [
    amount,
    selectedCandidates,
    edited,
    clientId,
    candidatesQuery.isLoading,
  ]);

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
  const hasPaymentAmount = typeof amount === "number" && amount > 0;
  const unallocated = hasPaymentAmount ? amount - allocatedTotal : 0;
  const liveExcess =
    hasPaymentAmount && amount > selectedPending + MXN_EPS
      ? amount - selectedPending
      : 0;
  const showUnallocatedWarning =
    hasPaymentAmount && Math.abs(unallocated) > MXN_EPS;

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

  const submitLabel =
    !hasPaymentAmount || positiveLines.length === 0
      ? copy.page.submitIdle
      : copy.page.submit(formatMxCurrency(amount), positiveLines.length);

  const isDirty =
    form.formState.isDirty ||
    edited ||
    (typeof amount === "number" && amount > 0);
  const { blocker, allowLeave } = useUnsavedChangesGuard({
    isDirty: isDirty && !form.formState.isSubmitSuccessful,
  });

  const createMutation = useCreateOperationalReceiptBatch(clientId, {
    onSuccess: (batch) => {
      const receiverRfc = clientQuery.data?.taxId?.trim() ?? "";
      appendCobrosTodayEntry(
        readCobrosTodayTray(),
        buildWithoutInvoiceCobrosTodayEntry(batch, receiverRfc),
      );
      allowLeave();
      const landingHref = resolveOperationalReceiptBatchCreateSuccessHref(
        from ?? undefined,
        clientId,
        batch.id,
      );
      const batchHref = buildClientOperationalReceiptBatchHref(
        clientId,
        batch.id,
      );
      toast({
        title: copy.toast.success(batch.receiptCount),
        variant: "success",
        action: {
          label: copy.toast.viewBatch,
          onClick: () => navigate(batchHref, { replace: true }),
        },
      });
      navigate(landingHref, { state: fromState, replace: true });
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

  const tripColumns = useMemo((): EntityListColumnDef<OperationalReceiptBatchCandidate>[] => {
    return [
      {
        id: "select",
        header: "",
        kind: "text",
        className: "w-10",
        headerClassName: "w-10",
        accessor: (trip) => {
          const checked = selectedIds.has(trip.tripId);
          const disabled =
            isSubmitting || disabledTrips.has(trip.tripId);
          return (
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
          );
        },
      },
      {
        id: "trip",
        header: copy.page.columns.trip,
        kind: "stacked",
        accessor: (trip): EntityListStackedValue => {
          const notEligible = disabledTrips.has(trip.tripId);
          return {
            primary: (
              <>
                <span className="font-mono">{trip.tripCode}</span>
                {notEligible ? (
                  <span className="mt-0.5 block text-xs font-normal text-destructive">
                    {copy.page.notEligible}
                  </span>
                ) : null}
              </>
            ),
            secondary: trip.scheduledDeparture
              ? `${copy.page.columns.departure} ${formatDate(trip.scheduledDeparture)}`
              : undefined,
          };
        },
      },
      {
        id: "status",
        header: copy.page.columns.status,
        kind: "status",
        accessor: (trip) => (
          <TripStatusBadge status={trip.status as TripStatusType} />
        ),
      },
      {
        id: "pendingBefore",
        header: copy.page.columns.pendingBefore,
        kind: "money",
        // T4: ReactNode amount-only — number iría por formatMxCurrency con `$`.
        accessor: (trip) => formatBatchTableMoney(trip.pendingAmount),
      },
      {
        id: "amount",
        header: copy.page.columns.amount,
        kind: "moneyEditable",
        headerClassName: "text-right",
        accessor: (trip): EntityListMoneyEditableValue | ReactNode => {
          const checked = selectedIds.has(trip.tripId);
          const lineAmt = checked ? (amounts[trip.tripId] ?? 0) : 0;
          const disabled =
            isSubmitting || disabledTrips.has(trip.tripId);
          if (!checked || disabledTrips.has(trip.tripId)) {
            return (
              <>
                <span className="text-xs text-muted-foreground">
                  {copy.page.noAllocation}
                </span>
                {lineErrors[trip.tripId] ? (
                  <p className="mt-0.5 text-xs text-destructive">
                    {lineErrors[trip.tripId]}
                  </p>
                ) : null}
              </>
            );
          }
          return {
            value: lineAmt || undefined,
            "aria-label": `Abono al viaje ${trip.tripCode}`,
            disabled,
            error: Boolean(lineErrors[trip.tripId]),
            onValueChange: (v) => {
              setEdited(true);
              setAmounts((prev) => ({
                ...prev,
                [trip.tripId]: v ?? 0,
              }));
              setLineErrors((prev) => {
                const next = { ...prev };
                delete next[trip.tripId];
                return next;
              });
            },
          };
        },
      },
      {
        id: "pendingAfter",
        header: copy.page.columns.pendingAfter,
        kind: "money",
        accessor: (trip) => {
          const checked = selectedIds.has(trip.tripId);
          const lineAmt = checked ? (amounts[trip.tripId] ?? 0) : 0;
          return formatBatchTableMoney(
            Math.max(0, trip.pendingAmount - lineAmt),
          );
        },
      },
    ];
  }, [
    amounts,
    disabledTrips,
    isSubmitting,
    lineErrors,
    selectedIds,
  ]);

  // ── Aside: «Al registrar» + «Saldo del cliente» (H1) ──────────────────
  const asideContent = useMemo(() => {
    const amountNum = typeof amount === "number" && amount > 0 ? amount : 0;
    const remaining = Math.max(0, selectedPending - amountNum);

    return (
      <>
        {/* «Al registrar» — sin factura: no REP */}
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold">{registerCollectionCopy.zoneEffects}</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <div className="min-w-0">
                <span className="font-medium">{registerCollectionCopy.effects.noRep}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {registerCollectionCopy.effects.noRepDetail}
                </span>
              </div>
            </li>
          </ul>
        </div>

        {/* «Saldo del cliente» */}
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold">{registerCollectionCopy.balanceCard.title}</h3>
          <dl className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">{registerCollectionCopy.balanceCard.dueToday}</dt>
              <dd className="font-mono tabular-nums">{formatMxCurrency(selectedPending)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">
                {registerCollectionCopy.balanceCard.thisCollection}
              </dt>
              <dd className="font-mono tabular-nums">
                − {formatMxCurrency(amountNum)}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t pt-1.5">
              <dt className="font-medium">{registerCollectionCopy.balanceCard.remaining}</dt>
              <dd className="font-mono tabular-nums font-medium">
                {formatMxCurrency(remaining)}
              </dd>
            </div>
          </dl>
        </div>
      </>
    );
  }, [amount, selectedPending]);

  const tripsFooter = (
    <div
      className={cn(
        "flex flex-wrap gap-4 text-sm text-foreground",
        showUnallocatedWarning && "text-warning-foreground",
      )}
    >
      <span>
        {copy.page.footer.selectedPending}:{" "}
        <strong className="font-mono tabular-nums">
          {formatBatchTableMoney(selectedPending)}
        </strong>
      </span>
      <span>
        {copy.page.footer.allocated}:{" "}
        <strong className="font-mono tabular-nums">
          {formatBatchTableMoney(allocatedTotal)}
        </strong>
      </span>
      {hasPaymentAmount ? (
        <span>
          {copy.page.footer.unallocated}:{" "}
          <strong className="font-mono tabular-nums">
            {formatBatchTableMoney(unallocated)}
          </strong>
        </span>
      ) : (
        <span className="text-muted-foreground">
          {copy.page.footer.unallocatedIdle}
        </span>
      )}
    </div>
  );

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
          crumbs: shellCrumbs,
          title: copy.page.title,
          subtitle: clientName,
          trailing: (
            <Badge variant="secondary">
              {registerCollectionCopy.channelChip.without_invoice}
            </Badge>
          ),
        }}
        aside={asideContent}
      >

        <form
          id="operational-receipt-batch-form"
          className="space-y-6"
          onSubmit={onSubmit}
          noValidate
        >
          <FormSectionCard
            title={
              <>
                <span className="font-normal text-muted-foreground">{registerCollectionCopy.sectionPayment.number}</span>{" "}
                {registerCollectionCopy.sectionPayment.title}
              </>
            }
            description={registerCollectionCopy.sectionPayment.subtitle}
          >
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
          </FormSectionCard>

          <section className="space-y-3" aria-labelledby="zone-trips">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 id="zone-trips" className="text-base font-semibold">
                  <span className="font-normal text-muted-foreground">{registerCollectionCopy.sectionCoverage.number}</span>{" "}
                  {registerCollectionCopy.sectionCoverage.title}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {registerCollectionCopy.sectionCoverage.subtitleWithoutInvoice}
                </p>
              </div>
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
              <EntityListTable
                framed
                density="compact"
                  aria-label={registerCollectionCopy.sectionCoverage.title}
                  columns={tripColumns}
                  rows={[]}
                  getRowId={(row) => row.tripId}
                  isLoading
              />
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

                <EntityListTable
                  framed
                  density="compact"
                  aria-label={registerCollectionCopy.sectionCoverage.title}
                  columns={tripColumns}
                  rows={filtered}
                  getRowId={(row) => row.tripId}
                  getRowClassName={(trip) => {
                    const checked = selectedIds.has(trip.tripId);
                    const lineAmt = checked
                      ? (amounts[trip.tripId] ?? 0)
                      : 0;
                    const muted = !checked || lineAmt <= MXN_EPS;
                    return muted ? "opacity-60" : undefined;
                  }}
                  footer={tripsFooter}
                />
              </>
            )}
          </section>

{/* «Al registrar» moved to aside (H1) */}

          {form.formState.isSubmitted && summaryMessages.length > 0 ? (
            <FormValidationSummary messages={summaryMessages} />
          ) : null}

          <FormStickyActions>
            <p className="mr-auto hidden text-xs text-muted-foreground sm:block">
              {registerCollectionCopy.footer.channelSummary(
                registerCollectionCopy.channelChip.without_invoice.toLowerCase(),
                positiveLines.length || selectedCandidates.length,
                (positiveLines.length || selectedCandidates.length) === 1
                  ? registerCollectionCopy.docWord.without_invoice.one
                  : registerCollectionCopy.docWord.without_invoice.many,
                INSTRUMENT_OPTIONS.find((o) => o.value === paymentInstrument)?.label ?? paymentInstrument ?? "—",
              )}
            </p>
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
                !hasPaymentAmount ||
                liveExcess > MXN_EPS
              }
            >
              {isSubmitting ? copy.page.submitting : submitLabel}
            </Button>
          </FormStickyActions>
        </form>
      </FormPageShell>

      <UnsavedChangesDialog blocker={blocker} />
    </>
  );
}
