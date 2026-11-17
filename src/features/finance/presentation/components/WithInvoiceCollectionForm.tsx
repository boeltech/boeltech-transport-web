/**
 * Formulario «Registrar cobro» — canal Con factura (F1).
 * POST /finance/payments con allocations[]; forma SAT elegible.
 */

import {
  useCallback,
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
import { getTodayMexicoDateString } from "@boeltech/cfdi-domain";
import { AlertTriangle, CheckCircle2, HandCoins } from "lucide-react";

import { useClient } from "@features/clients/application";
import {
  FormaPagoSelect,
} from "@features/catalogs/presentation/components";
import { useFormaPagoLabel } from "@features/catalogs";
import {
  FINANCE_COBROS_PATH,
  useOpenPpdInvoices,
  useRegisterFinancePayment,
} from "@features/finance/application";
import type { FinanceInvoiceListItem } from "@features/finance/domain";
import type { RegisterFinancePaymentPayload } from "@features/finance/infrastructure/financePaymentsApi";
import { ApiError, getErrorMessage } from "@shared/api/interceptors/error-handler";
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
  MoneyInput,
  RHFCatalogField,
  RHFDateField,
  RHFTextField,
  RHFTextareaField,
  UnsavedChangesDialog,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { FormSectionCard } from "@shared/ui/form-section-card";
import { Input } from "@shared/ui/input";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListMoneyEditableValue,
} from "@shared/ui/table";
import { cn } from "@shared/lib/utils/cn";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { useMasterActionFrom } from "@shared/utils/masterWayfinding";

import {
  COBROS_PAYMENT_TIME_DEFAULT,
  normalizeCobrosPaymentTime,
} from "../config/financeCobrosConfig";
import { registerCollectionCopy } from "../copy/registerCollectionCopy";
import { FinanceChainRepairConfirmDialog } from "./FinanceChainRepairConfirmDialog";
import {
  appendCobrosTodayEntry,
  buildCobrosFollowThrough,
  readCobrosTodayTray,
} from "../utils/cobrosFollowThrough";
import { getChainRepairAffectedLabels } from "../utils/chainRepairPlanLabels";
import { resolvePremarkedIds } from "../utils/registerCollectionQuery";
import { suggestInvoiceAllocation } from "../utils/suggestInvoiceAllocation";

const copy = registerCollectionCopy;
const MXN_EPS = 0.01;
const MONEY_LOCALE = "es-MX";
/** Con `client_id` API admite 500; solo `receiver_rfc` máx. 100 (F0b). */
const OPEN_PPD_FORM_LIMIT_CLIENT = 500;
const OPEN_PPD_FORM_LIMIT_RFC = 100;

function formatTableMoney(amount: number): string {
  return formatMoneyAmountOnly(amount, MONEY_LOCALE, 2);
}

function amountsEqual(
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

function invoiceLabel(inv: FinanceInvoiceListItem): string {
  return `${inv.serie}-${inv.folio}`;
}

const schema = z.object({
  amount: z
    .number({ error: copy.validation.amountRequired })
    .positive(copy.validation.amountPositive),
  paymentForm: z.string().min(1, copy.validation.paymentFormRequired),
  reference: z.string().max(100, copy.validation.referenceMax).optional(),
  paymentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, copy.validation.paymentDateFormat),
  paymentTime: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, copy.validation.paymentTimeFormat)
    .optional()
    .or(z.literal("")),
  note: z
    .string()
    .max(500, copy.validation.noteMax)
    .optional()
    .or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

const EMPTY_PREMARKED_IDS: readonly string[] = [];

export interface WithInvoiceCollectionFormProps {
  clientId?: string | null;
  receiverRfc?: string | null;
  from?: string | null;
  premarkedInvoiceIds?: readonly string[];
}

export function WithInvoiceCollectionForm({
  clientId,
  receiverRfc,
  from,
  premarkedInvoiceIds = EMPTY_PREMARKED_IDS,
}: WithInvoiceCollectionFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fromState = useMasterActionFrom(FINANCE_COBROS_PATH);
  const backHref =
    from?.startsWith("/") && !from.startsWith("//")
      ? from
      : clientId
        ? `/clients/${clientId}`
        : FINANCE_COBROS_PATH;

  const clientQuery = useClient(clientId ?? undefined);
  const invoicesQuery = useOpenPpdInvoices({
    clientId: clientId ?? null,
    receiverRfc: clientId ? null : (receiverRfc ?? null),
    page: 1,
    limit: clientId ? OPEN_PPD_FORM_LIMIT_CLIENT : OPEN_PPD_FORM_LIMIT_RFC,
    enabled: Boolean(clientId || receiverRfc),
  });

  const invoices = useMemo(
    () => invoicesQuery.data?.data ?? [],
    [invoicesQuery.data],
  );
  const metaTotal = invoicesQuery.data?.meta?.total;
  const truncated =
    typeof metaTotal === "number" && metaTotal > invoices.length;

  const resolvedRfc =
    receiverRfc?.trim().toUpperCase() ||
    invoices[0]?.receiverRfc ||
    clientQuery.data?.taxId?.trim().toUpperCase() ||
    "";

  const clientName =
    clientQuery.data?.tradeName?.trim() ||
    clientQuery.data?.legalName?.trim() ||
    invoices[0]?.receiverName?.trim() ||
    resolvedRfc ||
    "Cliente";

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [edited, setEdited] = useState(false);
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({});
  const [excessAlert, setExcessAlert] = useState<string | null>(null);
  const [chainRepairOpen, setChainRepairOpen] = useState(false);
  const [chainRepairLabels, setChainRepairLabels] = useState<string[]>([]);
  const [chainRepairError, setChainRepairError] = useState<string | null>(null);
  const [pendingPayload, setPendingPayload] =
    useState<RegisterFinancePaymentPayload | null>(null);
  const snapshotRef = useRef<FinanceInvoiceListItem[]>([]);

  const premarkedKey = premarkedInvoiceIds.join(",");
  useEffect(() => {
    if (!invoices.length) return;
    const allIds = invoices.map((i) => i.id);
    setSelectedIds(resolvePremarkedIds(premarkedInvoiceIds, allIds));
    setEdited(false);
  }, [invoicesQuery.dataUpdatedAt, premarkedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      amount: undefined as unknown as number,
      paymentForm: "03",
      reference: "",
      paymentDate: getTodayMexicoDateString(),
      paymentTime: COBROS_PAYMENT_TIME_DEFAULT,
      note: "",
    },
    mode: "onSubmit",
  });

  const amount = form.watch("amount");
  const paymentForm = form.watch("paymentForm");
  const formaPagoLabelResult = useFormaPagoLabel(paymentForm);
  /** H3: nombre legible de la forma de pago, sin código SAT. */
  const formaPagoName = useMemo(() => {
    const raw = formaPagoLabelResult.label;
    if (!raw) return paymentForm || "—";
    const dashIdx = raw.indexOf(" - ");
    return dashIdx >= 0 ? raw.slice(dashIdx + 3) : raw;
  }, [formaPagoLabelResult.label, paymentForm]);

  const selectedInvoices = useMemo(
    () => invoices.filter((inv) => selectedIds.has(inv.id)),
    [invoices, selectedIds],
  );

  useEffect(() => {
    if (edited || invoicesQuery.isLoading) return;
    const amt = typeof amount === "number" && amount > 0 ? amount : 0;
    if (!selectedInvoices.length || amt <= 0) {
      setAmounts((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      return;
    }
    const next = suggestInvoiceAllocation(
      amt,
      selectedInvoices.map((inv) => ({
        id: inv.id,
        issuedAt: inv.issuedAt,
        balanceDue: inv.balanceDue,
      })),
    );
    setAmounts((prev) => (amountsEqual(prev, next) ? prev : next));
  }, [amount, selectedInvoices, edited, invoicesQuery.isLoading]);

  const allocatedTotal = useMemo(
    () =>
      Object.entries(amounts).reduce((sum, [id, v]) => {
        if (!selectedIds.has(id)) return sum;
        return sum + (v > 0 ? v : 0);
      }, 0),
    [amounts, selectedIds],
  );
  const selectedPending = useMemo(
    () => selectedInvoices.reduce((s, inv) => s + inv.balanceDue, 0),
    [selectedInvoices],
  );
  const hasPaymentAmount = typeof amount === "number" && amount > 0;
  const unallocated = hasPaymentAmount ? amount - allocatedTotal : 0;
  const liveExcess =
    hasPaymentAmount && amount > selectedPending + MXN_EPS
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
        .map(([ingressInvoiceId, lineAmount]) => ({
          ingressInvoiceId,
          amount: lineAmount,
        })),
    [amounts, selectedIds],
  );

  const settledLabels = useMemo(() => {
    const labels: string[] = [];
    for (const inv of selectedInvoices) {
      const abono = amounts[inv.id] ?? 0;
      if (abono > MXN_EPS && inv.balanceDue - abono <= MXN_EPS) {
        labels.push(invoiceLabel(inv));
      }
    }
    return labels;
  }, [selectedInvoices, amounts]);

  const partialLeft = useMemo(() => {
    const rows: { label: string; balance: string }[] = [];
    for (const inv of selectedInvoices) {
      const abono = amounts[inv.id] ?? 0;
      const after = inv.balanceDue - abono;
      if (abono > MXN_EPS && after > MXN_EPS) {
        rows.push({
          label: invoiceLabel(inv),
          balance: formatMxCurrency(after),
        });
      }
    }
    return rows;
  }, [selectedInvoices, amounts]);

  // ── Aside: «Al registrar» + «Saldo del cliente» (H1, H5) ─────────────
  const asideContent = useMemo(() => {
    const effectItems: { icon: "check" | "warning"; text: string; detail?: string }[] = [];

    if (hasPaymentAmount && positiveLines.length > 0) {
      effectItems.push({
        icon: "check",
        text: copy.effects.emitsRep,
        detail: copy.effects.emitsRepDetail,
      });
    }
    if (settledLabels.length > 0) {
      effectItems.push({
        icon: "check",
        text: copy.effects.settled(settledLabels.join(" y ")),
        detail: copy.effects.settledDetail,
      });
    }
    for (const row of partialLeft) {
      effectItems.push({
        icon: "warning",
        text: copy.effects.partialLeft(row.label, row.balance),
        detail: copy.effects.partialLeftDetail,
      });
    }

    const amountNum = typeof amount === "number" && amount > 0 ? amount : 0;
    const remaining = Math.max(0, selectedPending - amountNum);

    return (
      <>
        {/* «Al registrar» */}
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold">{copy.zoneEffects}</h3>
          {effectItems.length > 0 ? (
            <ul className="space-y-3">
              {effectItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  {item.icon === "check" ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  )}
                  <div className="min-w-0">
                    <span className="font-medium">{item.text}</span>
                    {item.detail ? (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {item.detail}
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Captura el monto y selecciona facturas para ver qué pasará.
            </p>
          )}
        </div>

        {/* «Saldo del cliente» */}
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold">{copy.balanceCard.title}</h3>
          <dl className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">{copy.balanceCard.dueToday}</dt>
              <dd className="font-mono tabular-nums">{formatMxCurrency(selectedPending)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">
                {copy.balanceCard.thisCollection}
              </dt>
              <dd className="font-mono tabular-nums">
                − {formatMxCurrency(amountNum)}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t pt-1.5">
              <dt className="font-medium">{copy.balanceCard.remaining}</dt>
              <dd className="font-mono tabular-nums font-medium">
                {formatMxCurrency(remaining)}
              </dd>
            </div>
          </dl>
        </div>
      </>
    );
  }, [
    amount,
    hasPaymentAmount,
    partialLeft,
    positiveLines.length,
    selectedInvoices,
    selectedPending,
    settledLabels,
  ]);

  const submitLabel =
    !hasPaymentAmount || positiveLines.length === 0
      ? copy.submitIdle
      : copy.submit(
          formatMxCurrency(amount),
          positiveLines.length,
          positiveLines.length === 1
            ? copy.docWord.with_invoice.one
            : copy.docWord.with_invoice.many,
        );

  const isDirty =
    form.formState.isDirty ||
    edited ||
    (typeof amount === "number" && amount > 0);
  const { blocker, allowLeave } = useUnsavedChangesGuard({
    isDirty,
  });

  const registerMutation = useRegisterFinancePayment({
    onSuccess: (data, variables) => {
      const snapshot = snapshotRef.current;
      if (snapshot.length > 0) {
        appendCobrosTodayEntry(
          readCobrosTodayTray(),
          buildCobrosFollowThrough(data, variables, snapshot),
        );
      }
      allowLeave();
      toast({
        title: copy.toast.successTitle,
        description: copy.toast.successWithRep(
          formatMxCurrency(variables.amount),
        ),
      });
      navigate(backHref, { state: fromState, replace: true });
    },
  });

  const handleMutationError = useCallback(
    (err: Error, fromChainDialog: boolean) => {
      if (err instanceof ApiError && err.code === "CHAIN_REORDER_REQUIRED") {
        setChainRepairLabels(getChainRepairAffectedLabels(err.details));
        setChainRepairError(null);
        setChainRepairOpen(true);
        return;
      }
      const message =
        err instanceof ApiError && err.code === "REP_CURRENCY_NOT_SUPPORTED"
          ? "Solo se admiten cobros y complementos de pago (REP) en MXN."
          : getErrorMessage(err);
      if (fromChainDialog) {
        setChainRepairError(message);
        return;
      }
      toast({
        variant: "error",
        title: copy.toast.error,
        description: message,
      });
    },
    [toast],
  );

  const summaryMessages = useMemo(() => {
    const msgs: string[] = [];
    const fe = form.formState.errors;
    for (const key of [
      "amount",
      "paymentForm",
      "reference",
      "paymentDate",
      "paymentTime",
      "note",
    ] as const) {
      const m = fe[key]?.message;
      if (m) msgs.push(String(m));
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

  const buildPayload = (
    confirmChainRepair?: boolean,
  ): RegisterFinancePaymentPayload | null => {
    if (!resolvedRfc || positiveLines.length === 0) return null;
    const values = form.getValues();
    return {
      receiverRfc: resolvedRfc,
      amount: values.amount,
      currency: "MXN",
      exchangeRate: 1,
      paymentDate: values.paymentDate,
      paymentTime: normalizeCobrosPaymentTime(values.paymentTime),
      paymentForm: values.paymentForm,
      reference: values.reference?.trim() || undefined,
      notes: values.note?.trim() || undefined,
      allocations: positiveLines,
      confirmChainRepair,
    };
  };

  const submitPayload = (
    payload: RegisterFinancePaymentPayload,
    fromChainDialog = false,
  ) => {
    snapshotRef.current = selectedInvoices;
    setPendingPayload(payload);
    registerMutation.mutate(payload, {
      onError: (err) => handleMutationError(err, fromChainDialog),
    });
  };

  const onSubmit = form.handleSubmit((values) => {
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
    if (Math.abs(values.amount - allocatedTotal) > MXN_EPS) return;

    for (const inv of selectedInvoices) {
      const lineAmt = amounts[inv.id] ?? 0;
      if (lineAmt > inv.balanceDue + MXN_EPS) {
        setLineErrors((prev) => ({
          ...prev,
          [inv.id]: copy.validation.lineMax(formatMxCurrency(inv.balanceDue)),
        }));
        return;
      }
    }

    const payload = buildPayload();
    if (!payload) return;
    submitPayload(payload);
  });

  const isSubmitting = registerMutation.isPending;
  const isLoading =
    (Boolean(clientId) && clientQuery.isLoading) || invoicesQuery.isLoading;
  const notFound =
    Boolean(clientId) &&
    (clientQuery.isError || (!clientQuery.isLoading && !clientQuery.data));

  const columns = useMemo((): EntityListColumnDef<FinanceInvoiceListItem>[] => {
    return [
      {
        id: "select",
        header: "",
        kind: "text",
        className: "w-10",
        headerClassName: "w-10",
        accessor: (inv) => (
          <Checkbox
            checked={selectedIds.has(inv.id)}
            disabled={isSubmitting}
            onCheckedChange={(v) => {
              setSelectedIds((prev) => {
                const next = new Set(prev);
                if (v) next.add(inv.id);
                else {
                  next.delete(inv.id);
                  setAmounts((a) => ({ ...a, [inv.id]: 0 }));
                }
                return next;
              });
            }}
            aria-label={invoiceLabel(inv)}
          />
        ),
      },
      {
        id: "invoice",
        header: copy.columns.invoice,
        kind: "code",
        accessor: (inv) => invoiceLabel(inv),
      },
      {
        id: "issued",
        header: copy.columns.issued,
        kind: "date",
        accessor: (inv) => inv.issuedAt,
      },
      {
        id: "trips",
        header: copy.columns.trips,
        kind: "meta",
        accessor: (inv) =>
          inv.tripCodes.length > 0 ? inv.tripCodes.join(" · ") : null,
      },
      {
        id: "balance",
        header: copy.columns.balance,
        kind: "money",
        accessor: (inv) => formatTableMoney(inv.balanceDue),
      },
      {
        id: "allocation",
        header: copy.columns.allocation,
        kind: "moneyEditable",
        accessor: (inv): EntityListMoneyEditableValue | ReactNode => {
          const checked = selectedIds.has(inv.id);
          const lineAmt = checked ? (amounts[inv.id] ?? 0) : 0;
          if (!checked) {
            return (
              <span className="text-xs text-muted-foreground">
                {copy.noAllocation}
              </span>
            );
          }
          return {
            value: lineAmt || undefined,
            "aria-label": `Abono a ${invoiceLabel(inv)}`,
            disabled: isSubmitting,
            error: Boolean(lineErrors[inv.id]),
            onValueChange: (v) => {
              setEdited(true);
              setAmounts((prev) => ({ ...prev, [inv.id]: v ?? 0 }));
              setLineErrors((prev) => {
                const next = { ...prev };
                delete next[inv.id];
                return next;
              });
            },
          };
        },
      },
      {
        id: "after",
        header: copy.columns.after,
        kind: "money",
        accessor: (inv) => {
          const checked = selectedIds.has(inv.id);
          const lineAmt = checked ? (amounts[inv.id] ?? 0) : 0;
          return formatTableMoney(Math.max(0, inv.balanceDue - lineAmt));
        },
      },
    ];
  }, [amounts, isSubmitting, lineErrors, selectedIds]);

  const coverageFooter = (
    <div
      className={cn(
        "flex flex-wrap gap-4 text-sm text-foreground",
        hasPaymentAmount && Math.abs(unallocated) > MXN_EPS && "text-warning-foreground",
      )}
    >
      <span>
        {copy.footer.selectedPending}:{" "}
        <strong className="font-mono tabular-nums">
          {formatTableMoney(selectedPending)}
        </strong>
      </span>
      <span>
        {copy.footer.allocated}:{" "}
        <strong className="font-mono tabular-nums">
          {formatTableMoney(allocatedTotal)}
        </strong>
      </span>
      {hasPaymentAmount ? (
        <span>
          {copy.footer.unallocated}:{" "}
          <strong className="font-mono tabular-nums">
            {formatTableMoney(unallocated)}
          </strong>
        </span>
      ) : (
        <span className="text-muted-foreground">
          {copy.footer.unallocatedIdle}
        </span>
      )}
    </div>
  );

  return (
    <>
      <FormPageShell
        isLoading={isLoading}
        notFound={notFound}
        notFoundConfig={{
          icon: <HandCoins className="h-8 w-8" />,
          title: "Cliente no encontrado",
          description: copy.missingClientDescription,
        }}
        header={{
          backHref,
          title: copy.title,
          subtitle: resolvedRfc
            ? `${clientName} · ${resolvedRfc}`
            : clientName,
          icon: <HandCoins className="h-5 w-5" />,
          trailing: (
            <Badge variant="secondary">
              {copy.channelChip.with_invoice}
            </Badge>
          ),
        }}
        aside={asideContent}
      >
        <form
          id="register-collection-with-invoice"
          className="space-y-6"
          onSubmit={onSubmit}
          noValidate
        >
          <FormSectionCard
            title={
              <>
                <span className="font-normal text-muted-foreground">{copy.sectionPayment.number}</span>{" "}
                {copy.sectionPayment.title}
              </>
            }
            description={copy.sectionPayment.subtitle}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormFieldShell
                fieldId="collection-amount"
                label={copy.amount}
                required
                errorMessage={form.formState.errors.amount?.message}
              >
                <MoneyInput
                  id="collection-amount"
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
                    "collection-amount",
                    form.formState.errors.amount?.message,
                  )}
                />
              </FormFieldShell>

              <RHFCatalogField
                control={form.control}
                name="paymentForm"
                label={copy.paymentForm}
                required
              >
                {({ field, fieldState, resolvedId, errorMessage }) => (
                  <FormaPagoSelect
                    triggerId={resolvedId}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                    placeholder={copy.paymentFormPlaceholder}
                    error={Boolean(fieldState.error)}
                    {...getFieldErrorAriaProps(resolvedId, errorMessage)}
                  />
                )}
              </RHFCatalogField>

              <RHFTextField
                control={form.control}
                name="reference"
                label={copy.reference}
                placeholder={copy.referenceOptional}
                disabled={isSubmitting}
              />

              <RHFDateField
                control={form.control}
                name="paymentDate"
                label={copy.paymentDate}
                required
                disabled={isSubmitting}
                max={getTodayMexicoDateString()}
              />

              <FormFieldShell
                fieldId="collection-time"
                label={copy.paymentTime}
                description={copy.paymentTimeHint}
                errorMessage={form.formState.errors.paymentTime?.message}
              >
                <Input
                  id="collection-time"
                  type="time"
                  disabled={isSubmitting}
                  error={Boolean(form.formState.errors.paymentTime)}
                  {...form.register("paymentTime")}
                  {...getFieldErrorAriaProps(
                    "collection-time",
                    form.formState.errors.paymentTime?.message,
                  )}
                />
              </FormFieldShell>

              <div className="sm:col-span-2">
                <RHFTextareaField
                  control={form.control}
                  name="note"
                  label={copy.note}
                  placeholder={copy.notePlaceholder}
                  disabled={isSubmitting}
                  rows={2}
                />
              </div>
            </div>
          </FormSectionCard>

          <section className="space-y-3" aria-labelledby="zone-coverage">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 id="zone-coverage" className="text-base font-semibold">
                  <span className="font-normal text-muted-foreground">{copy.sectionCoverage.number}</span>{" "}
                  {copy.sectionCoverage.title}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {copy.sectionCoverage.subtitleWithInvoice}
                </p>
              </div>
              {edited ? (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-sm"
                  onClick={() => setEdited(false)}
                >
                  {copy.resetSuggest}
                </Button>
              ) : null}
            </div>

            {truncated ? (
              <Alert variant="warning">
                <AlertDescription>{copy.truncatedOpenPpd}</AlertDescription>
              </Alert>
            ) : null}
            {excessAlert ? (
              <Alert variant="destructive">
                <AlertDescription>{excessAlert}</AlertDescription>
              </Alert>
            ) : null}

            {invoicesQuery.isError ? (
              <DetailAlertCard
                severity="critical"
                title={copy.loadErrorTitle}
                items={[]}
                action={
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void invoicesQuery.refetch()}
                  >
                    {copy.loadErrorRetry}
                  </Button>
                }
              />
            ) : invoices.length === 0 && !invoicesQuery.isLoading ? (
              <EmptyState
                icon={<HandCoins className="h-8 w-8" />}
                title={copy.emptyInvoicesTitle}
                description={copy.emptyInvoicesDescription}
                cta={{
                  label: copy.cancel,
                  onClick: () => navigate(backHref, { state: fromState }),
                  variant: "outline",
                }}
              />
            ) : (
              <EntityListTable
                framed
                density="compact"
                aria-label={copy.zoneCoverage}
                columns={columns}
                rows={invoices}
                getRowId={(row) => row.id}
                isLoading={invoicesQuery.isLoading}
                getRowClassName={(inv) => {
                  const checked = selectedIds.has(inv.id);
                  const lineAmt = checked ? (amounts[inv.id] ?? 0) : 0;
                  return !checked || lineAmt <= MXN_EPS
                    ? "opacity-60"
                    : undefined;
                }}
                footer={coverageFooter}
              />
            )}
          </section>

{/* «Al registrar» moved to aside (H1) */}

          {form.formState.isSubmitted && summaryMessages.length > 0 ? (
            <FormValidationSummary messages={summaryMessages} />
          ) : null}

          <FormStickyActions>
            <p className="mr-auto hidden text-xs text-muted-foreground sm:block">
              {copy.footer.channelSummary(
                copy.channelChip.with_invoice.toLowerCase(),
                positiveLines.length || selectedInvoices.length,
                (positiveLines.length || selectedInvoices.length) === 1
                  ? copy.docWord.with_invoice.one
                  : copy.docWord.with_invoice.many,
                formaPagoName,
              )}
            </p>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              asChild
            >
              <Link to={backHref} state={fromState}>
                {copy.cancel}
              </Link>
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                invoices.length === 0 ||
                !hasPaymentAmount ||
                liveExcess > MXN_EPS
              }
            >
              {isSubmitting ? copy.submitting : submitLabel}
            </Button>
          </FormStickyActions>
        </form>
      </FormPageShell>

      <UnsavedChangesDialog blocker={blocker} />

      <FinanceChainRepairConfirmDialog
        open={chainRepairOpen}
        onOpenChange={(open) => {
          setChainRepairOpen(open);
          if (!open) setChainRepairError(null);
        }}
        isPending={isSubmitting}
        affectedLabels={chainRepairLabels}
        errorMessage={chainRepairError}
        onConfirm={() => {
          setChainRepairError(null);
          if (!pendingPayload) {
            const payload = buildPayload(true);
            if (payload) submitPayload(payload, true);
            return;
          }
          registerMutation.mutate(
            { ...pendingPayload, confirmChainRepair: true },
            {
              onError: (err) => handleMutationError(err, true),
            },
          );
        }}
      />
    </>
  );
}
