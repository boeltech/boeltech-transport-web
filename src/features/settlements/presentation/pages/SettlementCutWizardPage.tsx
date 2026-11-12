/**
 * F6 — Wizard Armar corte (Periodo → Revisar → Enviar).
 * Referencia: Operate-Pagos-Corte.dc.html · CA PRD F6.1–F6.8 · DOM exceso bloquea.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Scissors } from "lucide-react";
import {
  WizardPageShell,
  type WizardFormRef,
  type WizardStepRenderHelpers,
} from "@shared/ui/page-shells/WizardPageShell";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import { Label } from "@shared/ui/label";
import { Input } from "@shared/ui/input";
import { DetailAlertCard } from "@shared/ui/data-display";
import { useToast } from "@shared/hooks";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { cn } from "@shared/lib/utils/cn";
import {
  getErrorMessage,
  isApiError,
} from "@shared/api/interceptors/error-handler";
import { COMPENSATION_TEMPLATES_PATH } from "@features/compensation/application";
import {
  useCreateSettlementCut,
  useSettlementCutPreview,
} from "../../application/hooks";
import {
  SETTLEMENTS_LIST_PATH,
  SETTLEMENTS_OPERATORS_PATH,
  settlementsAdvancesPath,
  settlementsPendingApprovalPath,
  settlementsRegistryPath,
  settlementCreatePath,
  settlementDetailPath,
} from "../../application/settlementsRoutes";
import type {
  SettlementCutCreateResult,
  SettlementCutPreviewRow,
  SettlementCutSalaryPeriod,
} from "../../domain/settlementCut";
import { PeriodStepper } from "../components/PeriodStepper";
import { SettlementCutFilterChips } from "../components/SettlementCutFilterChips";
import { SettlementCutInspector } from "../components/SettlementCutInspector";
import { SettlementCutReviewTable } from "../components/SettlementCutReviewTable";
import { SettlementStatusBadge } from "../components/SettlementStatusBadge";
import { settlementsCopy } from "../copy/settlementsCopy";
import { buildSuggestedSettlementPeriod } from "../utils/buildSuggestedSettlementPeriod";
import { formatCutWizardTitle } from "../utils/formatCutWizardTitle";
import {
  buildCutZeroKmAckStorageKey,
  clearCutZeroKmAcks,
  readCutZeroKmAcks,
  writeCutZeroKmAcks,
} from "../utils/settlementCutZeroKmAckSession";
import {
  applyZeroKmAckToCutRow,
  buildCutDidNotEnterRows,
  cutDidNotEnterReasonLabel,
  isCutRowSendable,
  partitionCutReviewRows,
  resolveCutRowWarningUi,
  rowNeedsZeroKmAck,
  type SettlementCutReviewFilter,
  type SettlementCutRowAction,
} from "../utils/settlementCutWarnings";
import type { SettlementStatus } from "../../domain/enums";

const copy = settlementsCopy.cutWizard;
const WIZARD_STEPS = [...copy.steps];

const RHYTHM_OPTIONS: ReadonlyArray<{
  value: SettlementCutSalaryPeriod;
  label: string;
}> = [
  { value: "weekly", label: copy.period.weekly },
  { value: "biweekly", label: copy.period.biweekly },
  { value: "monthly", label: copy.period.monthly },
];

const SETTLEMENT_STATUSES = new Set<SettlementStatus>([
  "draft",
  "pending_approval",
  "approved",
  "disbursed",
  "rejected",
  "cancelled",
]);

function parseSalaryPeriod(raw: string | null): SettlementCutSalaryPeriod {
  if (raw === "biweekly" || raw === "monthly" || raw === "weekly") return raw;
  return "weekly";
}

function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

function asSettlementStatus(raw: string): SettlementStatus | null {
  return SETTLEMENT_STATUSES.has(raw as SettlementStatus)
    ? (raw as SettlementStatus)
    : null;
}

function buildCreateRows(
  rows: readonly SettlementCutPreviewRow[],
  zeroKmAcknowledged: ReadonlySet<string>,
) {
  return rows.filter(isCutRowSendable).map((row) => ({
    employeeId: row.employeeId,
    tripIds: [...row.tripIds],
    ...(zeroKmAcknowledged.has(row.employeeId)
      ? { acknowledgeZeroKmTrips: true as const }
      : {}),
  }));
}

export function SettlementCutWizardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const formRef = useRef<WizardFormRef>({
    triggerStepValidation: async () => false,
    requestSubmit: () => undefined,
  });
  const stepHelpersRef = useRef<WizardStepRenderHelpers | null>(null);

  const initialPeriod = useMemo(() => {
    const salaryPeriod = parseSalaryPeriod(searchParams.get("salaryPeriod"));
    const qStart = searchParams.get("periodStart");
    const qEnd = searchParams.get("periodEnd");
    if (qStart && qEnd) {
      return { salaryPeriod, periodStart: qStart, periodEnd: qEnd };
    }
    const suggested = buildSuggestedSettlementPeriod({ salaryPeriod });
    return {
      salaryPeriod,
      periodStart: suggested.periodStart,
      periodEnd: suggested.periodEnd,
    };
  }, [searchParams]);

  const [salaryPeriod, setSalaryPeriod] = useState<SettlementCutSalaryPeriod>(
    initialPeriod.salaryPeriod,
  );
  const [periodStart, setPeriodStart] = useState(initialPeriod.periodStart);
  const [periodEnd, setPeriodEnd] = useState(initialPeriod.periodEnd);
  const [includeContractors, setIncludeContractors] = useState(false);
  const [filter, setFilter] =
    useState<SettlementCutReviewFilter>("with_warning");
  const [readyExpanded, setReadyExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [createResult, setCreateResult] =
    useState<SettlementCutCreateResult | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const [pendingSubmitMode, setPendingSubmitMode] = useState<
    "approval" | "draft" | null
  >(null);
  const zeroKmAckStorageKey = useMemo(
    () =>
      buildCutZeroKmAckStorageKey({
        periodStart,
        periodEnd,
        salaryPeriod,
      }),
    [periodStart, periodEnd, salaryPeriod],
  );
  const [zeroKmAcknowledged, setZeroKmAcknowledged] = useState(
    () =>
      readCutZeroKmAcks(
        buildCutZeroKmAckStorageKey({
          periodStart: initialPeriod.periodStart,
          periodEnd: initialPeriod.periodEnd,
          salaryPeriod: initialPeriod.salaryPeriod,
        }),
      ),
  );

  const previewParams = useMemo(
    () => ({
      periodStart,
      periodEnd,
      salaryPeriod,
      includeContractors,
    }),
    [periodStart, periodEnd, salaryPeriod, includeContractors],
  );

  const previewQuery = useSettlementCutPreview(previewParams);
  const createCut = useCreateSettlementCut();

  // Nuevo periodo / ritmo → nueva clave de idempotencia; acks desde sessionStorage de la sesión
  useEffect(() => {
    setIdempotencyKey(newIdempotencyKey());
    setCreateResult(null);
    setZeroKmAcknowledged(readCutZeroKmAcks(zeroKmAckStorageKey));
  }, [periodStart, periodEnd, salaryPeriod, includeContractors, zeroKmAckStorageKey]);

  const preview = previewQuery.data;
  const summary = preview?.summary;

  const displayEligible = useMemo(() => {
    const eligible = preview?.eligible ?? [];
    if (zeroKmAcknowledged.size === 0) return eligible;
    return eligible.map((row) =>
      zeroKmAcknowledged.has(row.employeeId) && rowNeedsZeroKmAck(row)
        ? applyZeroKmAckToCutRow(row)
        : row,
    );
  }, [preview, zeroKmAcknowledged]);

  const partitioned = useMemo(() => {
    if (!preview) {
      return { withWarning: [], ready: [], outside: [] as SettlementCutPreviewRow[] };
    }
    return partitionCutReviewRows(displayEligible, preview.excluded);
  }, [preview, displayEligible]);

  const filteredPartitions = useMemo(() => {
    const q = search.trim().toLowerCase();
    const match = (row: SettlementCutPreviewRow) =>
      !q || row.employeeFullName.toLowerCase().includes(q);
    return {
      withWarning: partitioned.withWarning.filter(match),
      ready: partitioned.ready.filter(match),
      outside: partitioned.outside.filter(match),
    };
  }, [partitioned, search]);

  const chipCounts = useMemo(() => {
    const all =
      partitioned.withWarning.length +
      partitioned.ready.length +
      partitioned.outside.length;
    return {
      all,
      with_warning: partitioned.withWarning.length + partitioned.outside.length,
      ready: partitioned.ready.length,
    };
  }, [partitioned]);

  const sendableRows = useMemo(
    () => displayEligible.filter(isCutRowSendable),
    [displayEligible],
  );
  const includableCount = sendableRows.length;
  const reviewTotals = useMemo(() => {
    let compensation = 0;
    let advances = 0;
    for (const row of sendableRows) {
      compensation += row.estimatedGross ?? row.estimatedNet ?? 0;
      const suggested = row.suggestedAdvanceDeduction;
      if (suggested != null) advances += suggested;
      else if (row.openAdvancesBalance > 0) {
        const cap = row.maxAdvanceDeductible;
        advances +=
          cap != null
            ? Math.min(row.openAdvancesBalance, cap)
            : row.openAdvancesBalance;
      }
    }
    return { compensation, advances, reimbursements: 0 };
  }, [sendableRows]);

  const handleRhythmChange = useCallback((next: SettlementCutSalaryPeriod) => {
    setSalaryPeriod(next);
    const suggested = buildSuggestedSettlementPeriod({ salaryPeriod: next });
    setPeriodStart(suggested.periodStart);
    setPeriodEnd(suggested.periodEnd);
  }, []);

  const handlePeriodChange = useCallback((start: string, end: string) => {
    setPeriodStart(start);
    setPeriodEnd(end);
  }, []);

  const runCreate = useCallback(
    async (submitForApproval: boolean) => {
      if (sendableRows.length === 0) {
        toast({
          title: copy.toastErrorTitle,
          description: copy.review.sendDisabledEmpty,
          variant: "destructive",
        });
        return false;
      }

      try {
        const result = await createCut.mutateAsync({
          payload: {
            periodStart,
            periodEnd,
            salaryPeriod,
            includeContractors,
            submitForApproval,
            rows: buildCreateRows(sendableRows, zeroKmAcknowledged),
          },
          idempotencyKey,
        });
        clearCutZeroKmAcks(zeroKmAckStorageKey);
        setZeroKmAcknowledged(new Set());
        setCreateResult(result);
        toast({
          title: submitForApproval
            ? copy.toastSendSuccessTitle
            : copy.toastDraftSuccessTitle,
          description: result.message,
          variant: "success",
        });
        return true;
      } catch (error) {
        toast({
          title: copy.toastErrorTitle,
          description: isApiError(error)
            ? error.getDetailedMessage(3)
            : getErrorMessage(error),
          variant: "destructive",
        });
        return false;
      }
    },
    [
      createCut,
      idempotencyKey,
      includeContractors,
      periodEnd,
      periodStart,
      salaryPeriod,
      sendableRows,
      toast,
      zeroKmAckStorageKey,
      zeroKmAcknowledged,
    ],
  );

  formRef.current.triggerStepValidation = async (stepIndex: number) => {
    if (stepIndex === 0) {
      if (!periodStart || !periodEnd) return false;
      if (previewQuery.isError) return false;
      if (previewQuery.isFetching) return false;
      const total =
        (summary?.eligibleCount ?? 0) + (summary?.excludedCount ?? 0);
      if (total === 0) {
        toast({
          title: copy.toastErrorTitle,
          description: copy.period.emptyEligible,
          variant: "destructive",
        });
        return false;
      }
      return true;
    }
    if (stepIndex === 1) {
      if (createResult) return true;
      const mode = pendingSubmitMode ?? "approval";
      setPendingSubmitMode(null);
      return runCreate(mode === "approval");
    }
    return true;
  };
  formRef.current.requestSubmit = () => {
    navigate(settlementsPendingApprovalPath());
  };

  const handleRowAction = useCallback(
    (row: SettlementCutPreviewRow, action: SettlementCutRowAction) => {
      switch (action) {
        case "confirm_zero_km":
          setZeroKmAcknowledged((prev) => {
            const next = new Set(prev);
            next.add(row.employeeId);
            writeCutZeroKmAcks(zeroKmAckStorageKey, next);
            return next;
          });
          return;
        case "assign_tariff":
          navigate(
            `${COMPENSATION_TEMPLATES_PATH}?operators=assign&assign=${row.employeeId}`,
          );
          return;
        case "view_operator":
          navigate(`${SETTLEMENTS_OPERATORS_PATH}?employeeId=${row.employeeId}`);
          return;
        case "view_payment":
          if (row.periodOverlap?.settlementId) {
            navigate(settlementDetailPath(row.periodOverlap.settlementId));
          } else {
            navigate(
              settlementsRegistryPath({ employeeId: row.employeeId }),
            );
          }
          return;
        case "change_amount":
        case "split_advance":
          navigate(settlementsAdvancesPath({ employeeId: row.employeeId }));
          return;
        case "view_history":
          navigate(
            settlementsRegistryPath({ employeeId: row.employeeId }),
          );
          return;
        case "view_trip":
        case "review":
        case "define_payee":
        case "view":
          navigate(
            settlementCreatePath({
              employeeId: row.employeeId,
              periodStart,
              periodEnd,
            }),
          );
          return;
        default:
          return;
      }
    },
    [navigate, periodEnd, periodStart, zeroKmAckStorageKey],
  );

  const handleSend = useCallback(
    async (helpers?: WizardStepRenderHelpers) => {
      setPendingSubmitMode("approval");
      const ok = await runCreate(true);
      if (ok) helpers?.goToStep(2);
    },
    [runCreate],
  );

  const handleSaveDrafts = useCallback(
    async (helpers?: WizardStepRenderHelpers) => {
      setPendingSubmitMode("draft");
      const ok = await runCreate(false);
      if (ok) helpers?.goToStep(2);
    },
    [runCreate],
  );

  // C32: rango visible desde Revisar/Enviar; también en Periodo (mismo periodo elegido).
  const title = useMemo(
    () =>
      formatCutWizardTitle({
        salaryPeriod,
        periodStart,
        periodEnd,
        includePeriodRange: true,
      }),
    [salaryPeriod, periodStart, periodEnd],
  );

  const renderPeriodStep = () => (
    <div className="space-y-6" data-testid="cut-step-period">
      <div className="space-y-2">
        <Label>{copy.period.rhythmLabel}</Label>
        <p className="text-sm text-muted-foreground">{copy.period.rhythmHelp}</p>
        <div
          role="radiogroup"
          aria-label={copy.period.rhythmLabel}
          className="flex flex-wrap gap-1.5"
        >
          {RHYTHM_OPTIONS.map((option) => {
            const active = salaryPeriod === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={active}
                data-testid={`cut-rhythm-${option.value}`}
                onClick={() => handleRhythmChange(option.value)}
                className={cn(
                  "inline-flex h-9 items-center rounded-full border px-3 text-sm transition-colors",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card hover:bg-muted",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-md space-y-2">
        <Label>{settlementsCopy.periodStepper.label}</Label>
        <PeriodStepper
          salaryPeriod={salaryPeriod}
          periodStart={periodStart}
          periodEnd={periodEnd}
          onChange={handlePeriodChange}
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Checkbox
            id="cut-include-contractors"
            checked={includeContractors}
            onCheckedChange={(checked) =>
              setIncludeContractors(checked === true)
            }
          />
          <Label htmlFor="cut-include-contractors" className="font-normal">
            {copy.period.includeContractors}
          </Label>
        </div>
        <p className="pl-6 text-xs text-muted-foreground">
          {copy.period.includeContractorsHint}
        </p>
      </div>

      {previewQuery.isFetching ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {copy.period.loadingPreview}
        </p>
      ) : null}

      {previewQuery.isError ? (
        <DetailAlertCard
          severity="critical"
          title={copy.period.previewError}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void previewQuery.refetch()}
            >
              Reintentar
            </Button>
          }
        />
      ) : null}

      {summary ? (
        <div
          className="rounded-xl border bg-muted/30 px-4 py-3 text-sm"
          data-testid="cut-period-eligible-summary"
        >
          <p className="font-medium">
            {copy.period.eligibleCount(
              summary.eligibleCount + summary.excludedCount,
            )}
          </p>
          <p className="text-muted-foreground">
            {copy.period.eligibleHint(
              summary.includableCount,
              summary.blockingCount,
              summary.excludedCount,
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {copy.period.outsideHint}
          </p>
        </div>
      ) : null}
    </div>
  );

  const renderReviewStep = (_helpers?: WizardStepRenderHelpers) => {
    if (previewQuery.isLoading && !preview) {
      return (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {copy.period.loadingPreview}
        </p>
      );
    }

    if (previewQuery.isError || !preview || !summary) {
      return (
        <DetailAlertCard
          severity="critical"
          title={copy.period.previewError}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void previewQuery.refetch()}
            >
              Reintentar
            </Button>
          }
        />
      );
    }

    const reviewWithWarning =
      filter === "ready"
        ? []
        : [
            ...filteredPartitions.withWarning,
            ...filteredPartitions.outside,
          ];
    const reviewReady =
      filter === "with_warning" ? [] : filteredPartitions.ready;
    const outsideForInspector =
      filter === "ready" ? [] : partitioned.outside;

    return (
      <div className="space-y-4" data-testid="cut-step-review">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_336px] lg:items-start">
          {/* C18: un solo nivel de superficie (el Card del WizardPageShell). */}
          <section className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <SettlementCutFilterChips
                value={filter}
                onChange={setFilter}
                counts={chipCounts}
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={copy.review.searchPlaceholder}
                className="sm:ml-auto sm:max-w-[220px]"
                aria-label={copy.review.searchPlaceholder}
              />
            </div>
            <SettlementCutReviewTable
              withWarning={reviewWithWarning}
              ready={reviewReady}
              readyExpanded={readyExpanded || filter === "ready"}
              onToggleReady={() => setReadyExpanded((prev) => !prev)}
              filter={filter}
              onAction={handleRowAction}
            />
            <p className="text-sm text-muted-foreground">
              {copy.review.includableNote}
            </p>
          </section>
          <SettlementCutInspector
            includableCount={includableCount}
            totalOperators={
              summary.eligibleCount + summary.excludedCount
            }
            estimatedNetTotal={summary.estimatedNetTotal}
            compensationTotal={reviewTotals.compensation}
            advancesTotal={reviewTotals.advances}
            reimbursementsTotal={reviewTotals.reimbursements}
            excluded={outsideForInspector}
          />
        </div>
      </div>
    );
  };

  const renderSendStep = () => {
    if (!createResult) {
      return (
        <p className="text-sm text-muted-foreground">
          {copy.send.emptyCreated}
        </p>
      );
    }

    const nameByEmployee = new Map<string, string>();
    for (const row of preview?.eligible ?? []) {
      nameByEmployee.set(row.employeeId, row.employeeFullName);
    }
    for (const row of preview?.excluded ?? []) {
      nameByEmployee.set(row.employeeId, row.employeeFullName);
    }

    const createdIds = new Set(
      createResult.created.map((row) => row.employeeId),
    );
    const didNotEnter = preview
      ? buildCutDidNotEnterRows({
          eligible: preview.eligible,
          excluded: preview.excluded,
          createdEmployeeIds: createdIds,
          omitted: createResult.omitted,
        })
      : [];
    const orphanOmitted = createResult.omitted.filter(
      (row) =>
        !createdIds.has(row.employeeId) &&
        !didNotEnter.some((r) => r.employeeId === row.employeeId),
    );
    const didNotEnterCount = didNotEnter.length + orphanOmitted.length;

    return (
      <div className="space-y-6" data-testid="cut-step-send">
        {createResult.idempotentReplay ? (
          <DetailAlertCard severity="info" title={copy.send.replayNote} />
        ) : null}

        <section className="space-y-3">
          <h3 className="text-base font-semibold">
            {copy.send.successTitle(createResult.created.length)}
          </h3>
          {createResult.created.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {copy.send.emptyCreated}
            </p>
          ) : (
            <ul className="divide-y rounded-xl border">
              {createResult.created.map((row) => {
                const status = asSettlementStatus(row.status);
                return (
                  <li
                    key={row.settlementId}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {nameByEmployee.get(row.employeeId) ?? row.employeeId}
                      </p>
                      <p className="text-muted-foreground">
                        {copy.send.columns.folio}: {row.settlementNumber}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-right">
                      <p className="font-mono tabular-nums">
                        {formatMxCurrency(row.netAmount)}
                      </p>
                      {status ? (
                        <SettlementStatusBadge status={status} size="sm" />
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {didNotEnterCount > 0 ? (
          <section className="space-y-3" data-testid="cut-did-not-enter">
            <h3 className="text-base font-semibold">
              {copy.send.didNotEnterTitle(didNotEnterCount)}
            </h3>
            <ul className="divide-y rounded-xl border">
              {didNotEnter.map((row) => {
                const ui = resolveCutRowWarningUi(row);
                // Tras enviar, Confirmar ya no aplica: misma CTA de Revisar.
                const action: SettlementCutRowAction =
                  ui?.action === "confirm_zero_km"
                    ? "review"
                    : (ui?.action ?? null);
                const actionLabel = (() => {
                  if (!action) return null;
                  const labels = copy.review.actions;
                  switch (action) {
                    case "assign_tariff":
                      return labels.assignTariff;
                    case "view_operator":
                      return labels.viewOperator;
                    case "view_payment":
                      return labels.viewPayment;
                    case "review":
                      return labels.review;
                    case "change_amount":
                      return labels.changeAmount;
                    case "view_trip":
                      return labels.viewTrip;
                    case "view_history":
                      return labels.viewHistory;
                    case "split_advance":
                      return labels.splitAdvance;
                    case "define_payee":
                      return labels.definePayee;
                    case "view":
                      return labels.view;
                    default:
                      return null;
                  }
                })();
                return (
                  <li
                    key={row.employeeId}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{row.employeeFullName}</p>
                      <p className="text-muted-foreground">
                        {cutDidNotEnterReasonLabel(row)}
                      </p>
                    </div>
                    {action && actionLabel ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRowAction(row, action)}
                      >
                        {actionLabel}
                      </Button>
                    ) : null}
                  </li>
                );
              })}
              {orphanOmitted.map((row) => (
                <li
                  key={`${row.employeeId}-${row.reasonCode}`}
                  className="px-4 py-3 text-sm"
                >
                  <p className="font-medium">
                    {nameByEmployee.get(row.employeeId) ?? row.employeeId}
                  </p>
                  <p className="text-muted-foreground">{row.message}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to={settlementsPendingApprovalPath()}>
              {copy.send.goToApproval}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={SETTLEMENTS_LIST_PATH}>{copy.send.goToPayable}</Link>
          </Button>
        </div>
      </div>
    );
  };

  const renderStep = useCallback(
    (currentStep: number, helpers?: WizardStepRenderHelpers) => {
      if (helpers) stepHelpersRef.current = helpers;
      if (currentStep === 0) return renderPeriodStep();
      if (currentStep === 1) return renderReviewStep(helpers);
      return renderSendStep();
    },
    // Intentional: step bodies close over latest state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      createCut.isPending,
      createResult,
      filter,
      includableCount,
      includeContractors,
      partitioned,
      filteredPartitions,
      periodEnd,
      periodStart,
      preview,
      previewQuery.isError,
      previewQuery.isFetching,
      previewQuery.isLoading,
      readyExpanded,
      reviewTotals,
      salaryPeriod,
      search,
      summary,
      zeroKmAcknowledged,
    ],
  );

  const resultLocked = Boolean(createResult);

  return (
    <WizardPageShell
      steps={WIZARD_STEPS}
      formRef={formRef as RefObject<WizardFormRef | null>}
      header={{
        backHref: SETTLEMENTS_LIST_PATH,
        backLabel: copy.backLabel,
        icon: <Scissors className="h-5 w-5" />,
        title,
        subtitle: copy.subtitle,
      }}
      renderStep={renderStep}
      isSubmitting={createCut.isPending}
      submitLabel={copy.send.goToApproval}
      submittingLabel={copy.review.sending}
      stepsAriaLabel={copy.stepsAriaLabel}
      headerBackMode="wizard"
      onHeaderBack={
        resultLocked
          ? () => navigate(SETTLEMENTS_LIST_PATH)
          : undefined
      }
      onCancel={() => navigate(SETTLEMENTS_LIST_PATH)}
      resolveContainerClassName={(step) =>
        step === 1 ? "max-w-6xl" : undefined
      }
      resolveNavigation={({ currentStep, goToStep }) => {
        // C12: Revisar = pie único con Enviar + Guardar; sin Siguiente.
        if (currentStep === 1) {
          const disabled = createCut.isPending || includableCount === 0;
          return {
            isLastStep: true,
            submitLabel: copy.review.sendN(includableCount),
            showSubmitIcon: false,
            disableSubmit: disabled,
            primaryTestId: "cut-send-n",
            onSubmit: () => {
              void handleSend({ goToStep });
            },
            secondaryAction: {
              label: copy.review.saveDrafts,
              disabled,
              testId: "cut-save-drafts",
              onClick: () => {
                void handleSaveDrafts({ goToStep });
              },
            },
          };
        }
        // C31: tras create, ocultar todo el pie y bloquear vuelta a Revisar/Periodo.
        if (currentStep === 2 && resultLocked) {
          return {
            isLastStep: true,
            hideNav: true,
            lockBackward: true,
            showCancel: false,
          };
        }
        if (currentStep === 2) {
          return {
            isLastStep: true,
            hidePrimary: true,
            showCancel: false,
            hidePrevious: true,
          };
        }
        return undefined;
      }}
      className="pb-28"
    />
  );
}
