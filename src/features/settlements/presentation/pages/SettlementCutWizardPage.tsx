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
import { settlementsCopy } from "../copy/settlementsCopy";
import {
  buildSuggestedSettlementPeriod,
  type SalaryPeriodKind,
} from "../utils/buildSuggestedSettlementPeriod";
import {
  isCutRowSendable,
  partitionCutReviewRows,
  type SettlementCutReviewFilter,
  type SettlementCutRowAction,
} from "../utils/settlementCutWarnings";

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

function parseSalaryPeriod(raw: string | null): SettlementCutSalaryPeriod {
  if (raw === "biweekly" || raw === "monthly" || raw === "weekly") return raw;
  return "weekly";
}

function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

function buildCreateRows(rows: readonly SettlementCutPreviewRow[]) {
  return rows.filter(isCutRowSendable).map((row) => ({
    employeeId: row.employeeId,
    tripIds: [...row.tripIds],
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

  // Nuevo periodo / ritmo → nueva clave de idempotencia
  useEffect(() => {
    setIdempotencyKey(newIdempotencyKey());
    setCreateResult(null);
  }, [periodStart, periodEnd, salaryPeriod, includeContractors]);

  const preview = previewQuery.data;
  const summary = preview?.summary;

  const partitioned = useMemo(() => {
    if (!preview) {
      return { withWarning: [], ready: [], outside: [] as SettlementCutPreviewRow[] };
    }
    return partitionCutReviewRows(preview.eligible, preview.excluded);
  }, [preview]);

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

  const includableCount = summary?.includableCount ?? 0;
  const sendableRows = useMemo(
    () => (preview?.eligible ?? []).filter(isCutRowSendable),
    [preview],
  );

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
            rows: buildCreateRows(sendableRows),
          },
          idempotencyKey,
        });
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
        case "assign_tariff":
          navigate(
            `${COMPENSATION_TEMPLATES_PATH}?operators=assign&assign=${row.employeeId}`,
          );
          return;
        case "view_operator":
          navigate(`${SETTLEMENTS_OPERATORS_PATH}?employeeId=${row.employeeId}`);
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
    [navigate, periodEnd, periodStart],
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

  const title = useMemo(() => {
    const kind = salaryPeriod as SalaryPeriodKind;
    if (kind === "weekly") {
      return `Corte semanal`;
    }
    if (kind === "biweekly") return "Corte quincenal";
    return "Corte mensual";
  }, [salaryPeriod]);

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
        <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
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
        </div>
      ) : null}
    </div>
  );

  const renderReviewStep = (helpers?: WizardStepRenderHelpers) => {
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
          <section className="rounded-2xl border bg-card p-4 sm:p-5">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
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
          </section>
          <SettlementCutInspector
            includableCount={summary.includableCount}
            totalOperators={
              summary.eligibleCount + summary.excludedCount
            }
            estimatedNetTotal={summary.estimatedNetTotal}
            excluded={outsideForInspector}
          />
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border bg-card px-4 py-3 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground">
            {copy.review.includableNote}
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={createCut.isPending || includableCount === 0}
              onClick={() => void handleSaveDrafts(helpers)}
            >
              {copy.review.saveDrafts}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={createCut.isPending || includableCount === 0}
              title={
                includableCount === 0
                  ? copy.review.sendDisabledEmpty
                  : undefined
              }
              onClick={() => void handleSend(helpers)}
              data-testid="cut-send-n"
            >
              {createCut.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {copy.review.sending}
                </>
              ) : (
                copy.review.sendN(includableCount)
              )}
            </Button>
          </div>
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
              {createResult.created.map((row) => (
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
                  <div className="text-right">
                    <p className="font-mono tabular-nums">
                      {formatMxCurrency(row.netAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground">{row.status}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {createResult.omitted.length > 0 ? (
          <section className="space-y-3">
            <h3 className="text-base font-semibold">
              {copy.send.omittedTitle(createResult.omitted.length)}
            </h3>
            <ul className="divide-y rounded-xl border">
              {createResult.omitted.map((row) => (
                <li
                  key={`${row.employeeId}-${row.reasonCode}`}
                  className="px-4 py-3 text-sm"
                >
                  <p className="font-medium">
                    {nameByEmployee.get(row.employeeId) ?? row.employeeId}
                  </p>
                  <p className="text-muted-foreground">
                    {copy.send.omittedReason}: {row.message}
                  </p>
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
      salaryPeriod,
      search,
      summary,
    ],
  );

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
      onCancel={() => navigate(SETTLEMENTS_LIST_PATH)}
      resolveContainerClassName={(step) =>
        step === 1 ? "max-w-6xl" : undefined
      }
      className="pb-28"
    />
  );
}
