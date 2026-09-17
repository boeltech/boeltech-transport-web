import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Calculator,
  Check,
  Send,
  User,
  Banknote,
  Route,
  Receipt,
  RotateCcw,
  CheckCheck,
  Info,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Badge } from "@shared/ui/badge";
import { Textarea } from "@shared/ui/text-area/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@shared/ui/card";
import { DateField } from "@shared/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Checkbox } from "@shared/ui/checkbox";
import { EmptyState } from "@shared/ui/feedback-states";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { useToast } from "@shared/hooks";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { getErrorMessage, isApiError } from "@shared/api/interceptors/error-handler";
import { useEmployeeBasic } from "@features/employees";
import { EmployeeAsyncCombobox } from "@shared/ui/employee-async-combobox";
import {
  useSettlementPreview,
  useCreateSettlement,
  usePagosOperadoresGreenfield,
} from "../../application/hooks";
import {
  SETTLEMENTS_LIST_PATH,
  settlementDetailPath,
  settlementsAgreementsPath,
} from "../../application/settlementsRoutes";
import { settlementsCopy } from "../copy/settlementsCopy";
import { shouldShowSupportParticipationBadge } from "../utils/settlementParticipationHelpers";
import { resolveSettlementCompensationReadiness } from "../utils/settlementTemplateReadiness";
import { useTemplateAssignments } from "@features/compensation/application/hooks";
import {
  findEligibleAssignmentsForEmployeeOnDate,
  pickAssignmentBySettlementTiebreak,
} from "@features/compensation/presentation/utils/templateAssignmentOverlap";
import type { CreateSettlementFormData } from "../validation/settlementSchemas";
import {
  resolveCreateSettlementFeedback,
  resolveGreenfieldCreateCta,
} from "../utils/greenfieldCta";
import {
  COMPENSATION_SALARY_PERIOD_LABELS,
  TRIP_ROUTE_TYPE_LABELS,
  ADVANCE_CATEGORY_LABELS,
  type CompensationCalculationType,
  type CompensationSalaryPeriod,
  type TripRouteType,
  type AdvanceCategory,
} from "../../domain/enums";

const copy = settlementsCopy;
const createCopy = settlementsCopy.createPage;
const governanceCopy = settlementsCopy.agreementGovernance;

function deductableAdvanceBalance(adv: {
  balanceRemaining: number;
  availableBalance?: number;
}): number {
  if (typeof adv.availableBalance === "number") {
    return Math.max(0, adv.availableBalance);
  }
  return adv.balanceRemaining;
}

export function SettlementCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const createMutation = useCreateSettlement();
  const {
    enabled: greenfieldEnabled,
    thresholdMxn,
    isReady: settingsReady,
    isError: settingsError,
  } = usePagosOperadoresGreenfield();

  // Filter state for live preview (initialize with searchParams if present)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    () => searchParams.get("employeeId") || "",
  );
  const [periodStart, setPeriodStart] = useState<string>(() => {
    const param = searchParams.get("periodStart");
    if (param) return param;
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [periodEnd, setPeriodEnd] = useState<string>(
    () => searchParams.get("periodEnd") || new Date().toISOString().slice(0, 10),
  );

  // Selected advances deduction state: map of advanceId -> amount
  const [advanceDeductions, setAdvanceDeductions] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<string>("");

  // Confirmation dialog pre-submit
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [reimbursementsOnlyOptIn, setReimbursementsOnlyOptIn] = useState(false);
  const [showTripCalcDetail, setShowTripCalcDetail] = useState(false);

  const urlEmployeeId = searchParams.get("employeeId") || "";
  const urlPeriodStart = searchParams.get("periodStart") || "";
  const urlPeriodEnd = searchParams.get("periodEnd") || "";
  const prevUrlFiltersRef = useRef({
    employeeId: urlEmployeeId,
    periodStart: urlPeriodStart,
    periodEnd: urlPeriodEnd,
  });

  // Sync filters from URL when querystring values change
  useEffect(() => {
    const prev = prevUrlFiltersRef.current;
    const empChanged = Boolean(urlEmployeeId) && urlEmployeeId !== prev.employeeId;
    const startChanged = Boolean(urlPeriodStart) && urlPeriodStart !== prev.periodStart;
    const endChanged = Boolean(urlPeriodEnd) && urlPeriodEnd !== prev.periodEnd;

    if (empChanged) setSelectedEmployeeId(urlEmployeeId);
    if (startChanged) setPeriodStart(urlPeriodStart);
    if (endChanged) setPeriodEnd(urlPeriodEnd);
    if (empChanged || startChanged || endChanged) {
      setAdvanceDeductions({});
      setReimbursementsOnlyOptIn(false);
    }

    prevUrlFiltersRef.current = {
      employeeId: urlEmployeeId,
      periodStart: urlPeriodStart,
      periodEnd: urlPeriodEnd,
    };
  }, [urlEmployeeId, urlPeriodStart, urlPeriodEnd]);

  const {
    data: preview,
    isLoading: isPreviewLoading,
    isError: isPreviewError,
    error: previewError,
  } = useSettlementPreview(
    selectedEmployeeId && periodStart && periodEnd
      ? {
          employeeId: selectedEmployeeId,
          periodStart,
          periodEnd,
        }
      : null,
  );

  const { data: employeeAssignmentsData } = useTemplateAssignments(
    selectedEmployeeId
      ? { employeeId: selectedEmployeeId, pageSize: 100, enabled: Boolean(selectedEmployeeId) }
      : { enabled: false },
  );
  const employeeAssignments = useMemo(
    () => employeeAssignmentsData?.data ?? [],
    [employeeAssignmentsData?.data],
  );

  const { data: selectedEmployeeBasic } = useEmployeeBasic(
    selectedEmployeeId,
    Boolean(selectedEmployeeId),
  );

  const selectedEmployeeLabel =
    selectedEmployeeBasic != null
      ? `${selectedEmployeeBasic.firstName} ${selectedEmployeeBasic.lastName}`.trim()
      : preview?.employeeName ?? "";

  const isMissingCompensationScheme =
    isPreviewError &&
    isApiError(previewError) &&
    previewError.code === "MISSING_COMPENSATION_SCHEME";

  const handleAdvanceToggle = (advanceId: string, maxAmount: number, checked: boolean) => {
    setAdvanceDeductions((prev) => {
      const next = { ...prev };
      if (checked) {
        next[advanceId] = maxAmount;
      } else {
        delete next[advanceId];
      }
      return next;
    });
  };

  const handleAdvanceAmountChange = (advanceId: string, maxAmount: number, amount: number) => {
    const validAmount = Math.max(0, Math.min(amount, maxAmount));
    setAdvanceDeductions((prev) => ({
      ...prev,
      [advanceId]: validAmount,
    }));
  };

  const handleSelectAllAdvances = () => {
    if (!preview?.openAdvances) return;
    const allDeductions: Record<string, number> = {};
    for (const adv of preview.openAdvances) {
      allDeductions[adv.advanceId] = adv.balanceRemaining;
    }
    setAdvanceDeductions(allDeductions);
  };

  const handleClearAllAdvances = () => {
    setAdvanceDeductions({});
  };

  const totalCommissions = preview?.summary.totalCommissions ?? 0;
  const totalBaseSalary = preview?.summary.totalBaseSalary ?? 0;
  const totalFixedAllowances = preview?.summary.totalFixedAllowances ?? 0;
  const totalReimbursements = preview?.summary.totalReimbursements ?? 0;
  const grossAmount =
    totalCommissions + totalBaseSalary + totalFixedAllowances + totalReimbursements;

  const totalAdvancesDeducted = Object.values(advanceDeductions).reduce(
    (acc, val) => acc + val,
    0,
  );
  const selectedAdvancesCount = Object.keys(advanceDeductions).filter(
    (k) => (advanceDeductions[k] ?? 0) > 0,
  ).length;

  const netAmount = Math.max(0, grossAmount - totalAdvancesDeducted);
  const greenfieldCreateCta = greenfieldEnabled
    ? resolveGreenfieldCreateCta({
        netAmount,
        hasManualAdjustments: false,
        thresholdMxn,
      })
    : null;

  const agreement = preview?.agreement as Record<string, unknown> | undefined;
  const readiness = useMemo(
    () => resolveSettlementCompensationReadiness(preview, previewError),
    [preview, previewError],
  );
  const isAgreementReady = readiness === "ready";
  const assignmentAmbiguity = useMemo(() => {
    if (!selectedEmployeeId || !periodEnd) {
      return { hasAmbiguity: false, appliedAssignment: null, eligibleCount: 0 };
    }

    const eligible = findEligibleAssignmentsForEmployeeOnDate(
      employeeAssignments,
      selectedEmployeeId,
      periodEnd,
    );

    return {
      hasAmbiguity: eligible.length > 1,
      appliedAssignment: pickAssignmentBySettlementTiebreak(eligible),
      eligibleCount: eligible.length,
    };
  }, [employeeAssignments, periodEnd, selectedEmployeeId]);
  const hasFixedSalary = Boolean(agreement?.has_fixed_salary || agreement?.hasFixedSalary);
  const fixedSalaryAmount = Number(agreement?.fixed_salary_amount ?? agreement?.fixedSalaryAmount ?? 0);
  const fixedSalaryPeriod = String(agreement?.fixed_salary_period ?? agreement?.fixedSalaryPeriod ?? "weekly");

  const hasReimbursementOrAdvanceWork =
    totalReimbursements > 0 || selectedAdvancesCount > 0;
  const canProceedWithSave =
    settingsReady &&
    (isAgreementReady || (reimbursementsOnlyOptIn && hasReimbursementOrAdvanceWork));
  const hasSettlementContent =
    (preview?.eligibleTrips.length ?? 0) > 0 ||
    totalBaseSalary > 0 ||
    totalFixedAllowances > 0 ||
    totalReimbursements > 0;

  // Format agreement description in human-friendly terms (solo útil cuando ready)
  const agreementSummaryText = useMemo(() => {
    if (!agreement || !isAgreementReady) return null;
    const parts: string[] = [];
    if (hasFixedSalary && fixedSalaryAmount > 0) {
      const periodLabel =
        COMPENSATION_SALARY_PERIOD_LABELS[fixedSalaryPeriod as CompensationSalaryPeriod] ?? "semanal";
      parts.push(`Sueldo base ${periodLabel} de ${formatMxCurrency(fixedSalaryAmount)}`);
    }

    const calcType = (agreement.calculation_type || agreement.calculationType) as CompensationCalculationType | undefined;
    const ratePerKm = Number(agreement.rate_per_km ?? agreement.ratePerKm ?? 0);
    const percentageRate = Number(agreement.percentage_rate ?? agreement.percentageRate ?? 0);
    const baseRate = Number(agreement.base_rate ?? agreement.baseRate ?? 0);
    const helperDailyRate = Number(agreement.helper_daily_rate ?? agreement.helperDailyRate ?? 0);

    if (calcType === "rate_per_km" && ratePerKm > 0) {
      parts.push(`Comisión de ${formatMxCurrency(ratePerKm)} por km recorrido`);
    } else if (calcType === "percentage_of_freight" && percentageRate > 0) {
      parts.push(`${percentageRate}% de comisión sobre flete`);
    } else if (calcType === "fixed_per_trip" && baseRate > 0) {
      parts.push(`Tarifa fija de ${formatMxCurrency(baseRate)} por viaje`);
    } else if (calcType === "fixed_daily_rate" && helperDailyRate > 0) {
      parts.push(`Tarifa diaria de ${formatMxCurrency(helperDailyRate)} por jornada`);
    }

    const ruleCount = Array.isArray(agreement.rules) ? agreement.rules.length : 0;
    if (parts.length === 0 && ruleCount > 0) {
      parts.push(`Sueldo + pago por viajes (${ruleCount} reglas por tipo de ruta)`);
    }

    return parts.length > 0 ? parts.join(" + ") : null;
  }, [agreement, hasFixedSalary, fixedSalaryAmount, fixedSalaryPeriod, isAgreementReady]);

  const handleSave = async (submitForApproval: boolean) => {
    if (!selectedEmployeeId || !periodStart || !periodEnd) {
      toast({
        title: createCopy.toasts.missingRequiredParams,
        variant: "destructive",
      });
      return;
    }

    if (!canProceedWithSave) {
      toast({
        title: createCopy.toasts.agreementRequired,
        variant: "destructive",
      });
      return;
    }

    try {
      const openAdvancesMap = new Map(
        (preview?.openAdvances ?? []).map((adv) => [adv.advanceId, adv.balanceRemaining]),
      );

      const advancesToApply = Object.entries(advanceDeductions)
        .filter(([advanceId, amount]) => {
          const maxAvailable = openAdvancesMap.get(advanceId);
          return maxAvailable !== undefined && amount > 0;
        })
        .map(([advanceId, amount]) => {
          const maxAvailable = openAdvancesMap.get(advanceId) ?? amount;
          return {
            advanceId,
            amountToDeduct: Math.min(amount, maxAvailable),
          };
        });

      const payload: CreateSettlementFormData = {
        employeeId: selectedEmployeeId,
        periodStart,
        periodEnd,
        tripIds: preview?.eligibleTrips.map((t) => t.tripId) ?? [],
        advancesToApply,
        customItems: [],
        notes: notes || undefined,
        submitForApproval,
      };

      const result = await createMutation.mutateAsync(payload);
      // El API es la fuente de verdad del VoBo: si degradó el envío a borrador
      // (neto bajo el umbral vigente), el aviso lo dice en vez de mentir con un
      // "enviada para autorización" que nunca ocurrió.
      const feedback = resolveCreateSettlementFeedback({
        submitForApproval,
        resultStatus: result.status,
      });
      const degradedToDraft = feedback === "degraded_to_draft";
      toast({
        title: degradedToDraft
          ? createCopy.toasts.submitDegradedToDraft
          : feedback === "submitted_for_approval"
            ? createCopy.toasts.submitSuccess
            : createCopy.toasts.draftSuccess,
        description: degradedToDraft
          ? createCopy.toasts.submitDegradedToDraftHint
          : undefined,
        variant: degradedToDraft ? "default" : "success",
      });
      setConfirmDialogOpen(false);
      navigate(settlementDetailPath(result.id));
    } catch (error) {
      toast({
        title: createCopy.toasts.createError,
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  return (
    <FormPageShell
      isLoading={false}
      header={{
        backHref: SETTLEMENTS_LIST_PATH,
        backLabel: copy.actions.backToList,
        icon: <Banknote className="h-5 w-5" />,
        title: createCopy.header.title,
        subtitle: createCopy.header.subtitle,
      }}
    >
      <div className="space-y-6">
        {/* PARTE 1: SELECCIÓN DE PERÍODO Y OPERADOR */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              {createCopy.sections.filtersTitle}
            </CardTitle>
            <CardDescription>
              {createCopy.sections.filtersDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <EmployeeAsyncCombobox
                  id="create-emp"
                  label={`${copy.fields.employee} *`}
                  value={selectedEmployeeId}
                  onChange={(employeeId) => {
                    setSelectedEmployeeId(employeeId);
                    setAdvanceDeductions({});
                    setReimbursementsOnlyOptIn(false);
                  }}
                  placeholder="Seleccionar chofer u operador..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-start">{copy.fields.periodStart} *</Label>
                <DateField
                  id="create-start"
                  value={periodStart}
                  onChange={(val) => {
                    setPeriodStart(val);
                    setAdvanceDeductions({});
                    setReimbursementsOnlyOptIn(false);
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-end">{copy.fields.periodEnd} *</Label>
                <DateField
                  id="create-end"
                  value={periodEnd}
                  onChange={(val) => {
                    setPeriodEnd(val);
                    setAdvanceDeductions({});
                    setReimbursementsOnlyOptIn(false);
                  }}
                />
              </div>
            </div>

            {/* Banner: tarifa lista vs configuración incompleta (PD2) */}
            {preview && readiness === "ready" && (preview.template || agreementSummaryText) && (
              <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-xs">
                <Info className="h-4 w-4 text-primary shrink-0" />
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold text-foreground">
                    {createCopy.sections.agreementActiveLabel}:
                  </span>
                  {preview.template ? (
                    <span className="text-primary font-medium">
                      {createCopy.sections.templateActivePrefix}{" "}
                      {preview.template.name}
                      {agreementSummaryText ? ` — ${agreementSummaryText}` : ""}
                    </span>
                  ) : (
                    <span className="text-primary font-medium">{agreementSummaryText}</span>
                  )}
                </div>
              </div>
            )}
            {preview &&
              readiness === "ready" &&
              assignmentAmbiguity.hasAmbiguity &&
              assignmentAmbiguity.appliedAssignment && (
                <Alert variant="warning">
                  <AlertTriangle />
                  <AlertTitle>{governanceCopy.settlementAmbiguityTitle}</AlertTitle>
                  <AlertDescription className="space-y-3">
                    <p>
                      {governanceCopy.settlementAmbiguityDescriptionPrefix}{" "}
                      {formatDate(assignmentAmbiguity.appliedAssignment.effectiveFrom)}
                      {governanceCopy.settlementAmbiguityDescriptionSuffix}
                    </p>
                    <Button type="button" size="sm" variant="outline" asChild>
                      <Link
                        to={settlementsAgreementsPath({
                          employeeId: selectedEmployeeId,
                        })}
                      >
                        {governanceCopy.reviewAgreementsAction}
                      </Link>
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            {(preview || isMissingCompensationScheme) && readiness !== "ready" && (
              <Alert variant="warning">
                <AlertTriangle />
                <AlertTitle>
                  {readiness === "incomplete"
                    ? createCopy.empty.incompleteAgreementTitle
                    : createCopy.empty.missingSchemeTitle}
                </AlertTitle>
                <AlertDescription className="space-y-3">
                  <p>
                    {readiness === "incomplete"
                      ? createCopy.empty.incompleteAgreementDescription
                      : createCopy.empty.missingSchemeDescription}
                  </p>
                  {selectedEmployeeId ? (
                    <p className="text-xs opacity-90">
                      <Link
                        to={`/employees/${selectedEmployeeId}/edit`}
                        className="font-medium text-foreground underline underline-offset-4"
                      >
                        {createCopy.sections.agreementProfileSalaryHintLink}
                      </Link>
                    </p>
                  ) : (
                    <p className="text-xs opacity-90">
                      {createCopy.sections.agreementProfileSalaryHint}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Button type="button" size="sm" asChild>
                      <Link
                        to={settlementsAgreementsPath({
                          employeeId: selectedEmployeeId,
                        })}
                      >
                        {createCopy.empty.configureCompensationAction}
                      </Link>
                    </Button>
                    {selectedEmployeeId ? (
                      <Button type="button" size="sm" variant="outline" asChild>
                        <Link to={`/employees/${selectedEmployeeId}/edit`}>
                          {createCopy.empty.configureEmployeeSalaryAction}
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* PARTE 2: REVELACIÓN PROGRESIVA CON SPLIT VIEW */}
        {!selectedEmployeeId ? (
          <EmptyState
            icon={<User className="h-8 w-8 text-muted-foreground" />}
            title={createCopy.empty.selectOperatorTitle}
            description={createCopy.empty.selectOperatorDescription}
          />
        ) : isPreviewLoading ? (
          <div className="py-12 text-center text-muted-foreground space-y-2">
            <Calculator className="mx-auto h-8 w-8 animate-bounce text-primary" />
            <p className="text-sm font-semibold text-foreground">
              {createCopy.empty.calculatingTitle}
            </p>
            <p className="text-xs text-muted-foreground">
              {createCopy.empty.calculatingDescription}
            </p>
          </div>
        ) : preview ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COLUMNA IZQUIERDA: Tablas de viajes y anticipos (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* TABLA DE VIAJES COMPLETADOS */}
              <Card className="border-border shadow-xs">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-semibold">
                        {createCopy.sections.tripsTitle} ({preview.eligibleTrips.length})
                      </CardTitle>
                      <CardDescription>
                        {createCopy.sections.tripsDescription}
                      </CardDescription>
                    </div>
                    {preview.eligibleTrips.length > 0 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 shrink-0"
                        onClick={() => setShowTripCalcDetail((v) => !v)}
                      >
                        {showTripCalcDetail
                          ? createCopy.sections.tripsHideCalcDetail
                          : createCopy.sections.tripsShowCalcDetail}
                      </Button>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent>
                  {preview.eligibleTrips.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground border rounded-lg bg-muted/20">
                      {createCopy.trips.emptyTrips}
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-24">{createCopy.trips.tripCol}</TableHead>
                            <TableHead>{createCopy.trips.routeCol}</TableHead>
                            {showTripCalcDetail ? (
                              <>
                                <TableHead>{createCopy.trips.ruleCol}</TableHead>
                                <TableHead className="text-right">{createCopy.trips.opsDetailCol}</TableHead>
                              </>
                            ) : null}
                            <TableHead className="text-right">{createCopy.trips.payCol}</TableHead>
                            <TableHead className="text-right">{createCopy.trips.reimbursementsCol}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {preview.eligibleTrips.map((trip) => {
                            const routeType = (trip.routeType as TripRouteType) || "long_haul";
                            const routeTypeLabel = TRIP_ROUTE_TYPE_LABELS[routeType] ?? routeType;
                            const isLocalCovered =
                              routeType === "local" &&
                              (trip.calculatedCommission === 0 ||
                                (trip.appliedRule && trip.appliedRule.toLowerCase().includes("sueldo")));

                            return (
                              <TableRow key={trip.tripId}>
                                <TableCell className="font-semibold text-primary font-mono text-xs">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span>{trip.tripCode}</span>
                                    {shouldShowSupportParticipationBadge(
                                      trip.appliedRule,
                                      preview.agreement
                                        .calculationType as CompensationCalculationType,
                                    ) ? (
                                      <Badge
                                        variant="neutral"
                                        tone="soft"
                                        className="text-[10px] py-0 px-1.5 h-4 font-normal"
                                      >
                                        {createCopy.trips.supportParticipationBadge}
                                      </Badge>
                                    ) : null}
                                    {trip.corridorMatch ? (
                                      <Badge
                                        variant="warning"
                                        tone="soft"
                                        className="text-[10px] py-0 px-1.5 h-4 font-normal"
                                        title={
                                          trip.corridorMatch.replacesKmCommission
                                            ? "Sustituye comisión por km"
                                            : undefined
                                        }
                                      >
                                        {createCopy.trips.corridorBadgePrefix}:{" "}
                                        {trip.corridorMatch.name}
                                      </Badge>
                                    ) : null}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium text-foreground text-xs">
                                    {trip.originCity} → {trip.destinationCity}
                                  </div>
                                  <Badge
                                    variant={
                                      routeType === "long_haul"
                                        ? "info"
                                        : routeType === "transfer"
                                          ? "warning"
                                          : "neutral"
                                    }
                                    tone="soft"
                                    className="text-[10px] mt-0.5"
                                  >
                                    <Route className="mr-1 h-2.5 w-2.5" />
                                    {routeTypeLabel}
                                  </Badge>
                                </TableCell>
                                {showTripCalcDetail ? (
                                  <>
                                    <TableCell className="text-xs text-muted-foreground">
                                      {isLocalCovered ? (
                                        <span className="inline-flex items-center gap-1 text-muted-foreground font-medium">
                                          <Check className="h-3 w-3 text-success" />
                                          {createCopy.trips.coveredBySalary}
                                        </span>
                                      ) : (
                                        trip.appliedRule || "Estándar"
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                                      <span>{trip.distanceKm} km</span>
                                      <span className="mx-1.5 opacity-40">·</span>
                                      <span>Flete {formatMxCurrency(trip.freightRevenue)}</span>
                                      {trip.freightBase === "commercial_at_complete" ? (
                                        <span className="block text-[10px] opacity-80">
                                          al completar
                                        </span>
                                      ) : null}
                                    </TableCell>
                                  </>
                                ) : null}
                                <TableCell className="text-right tabular-nums font-bold text-foreground">
                                  {isLocalCovered ? (
                                    <span className="text-xs font-normal text-muted-foreground">
                                      $0.00
                                    </span>
                                  ) : (
                                    formatMxCurrency(trip.calculatedCommission)
                                  )}
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-xs text-muted-foreground">
                                  {trip.approvedReimbursableExpenses > 0
                                    ? `+${formatMxCurrency(trip.approvedReimbursableExpenses)}`
                                    : "—"}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* TABLA DE ANTICIPOS ABIERTOS */}
              <Card className="border-border shadow-xs">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-semibold">
                        {createCopy.sections.advancesTitle} ({preview.openAdvances.length})
                      </CardTitle>
                      <CardDescription>
                        {createCopy.sections.advancesDescription}
                      </CardDescription>
                    </div>
                    {preview.openAdvances.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAllAdvances}
                          className="text-xs h-7 px-2"
                        >
                          <CheckCheck className="h-3.5 w-3.5 mr-1 text-primary" />
                          {createCopy.advances.selectAll}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleClearAllAdvances}
                          className="text-xs h-7 px-2 text-muted-foreground"
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1" />
                          {createCopy.advances.clearAll}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {preview.openAdvances.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground border rounded-lg bg-muted/20">
                      {createCopy.advances.emptyAdvances}
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12 text-center">Aplicar</TableHead>
                            <TableHead className="w-24">Folio</TableHead>
                            <TableHead>Concepto / Tipo</TableHead>
                            <TableHead className="text-right">Saldo pendiente</TableHead>
                            <TableHead className="text-right w-44">Monto a descontar</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {preview.openAdvances.map((adv) => {
                            const isSelected = advanceDeductions[adv.advanceId] !== undefined;
                            const currentVal = advanceDeductions[adv.advanceId] ?? 0;
                            const maxDeduct = deductableAdvanceBalance(adv);
                            const remainingAfterDeduction = Math.max(0, maxDeduct - currentVal);
                            const reservedAmount = adv.reservedAmount ?? 0;

                            return (
                              <TableRow key={adv.advanceId} className={isSelected ? "bg-muted/30" : ""}>
                                <TableCell className="text-center">
                                  <Checkbox
                                    checked={isSelected}
                                    disabled={maxDeduct <= 0}
                                    onCheckedChange={(checked) =>
                                      handleAdvanceToggle(
                                        adv.advanceId,
                                        maxDeduct,
                                        checked === true,
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell className="font-semibold text-primary font-mono text-xs">
                                  {adv.folio}
                                </TableCell>
                                <TableCell className="text-xs">
                                  <span className="font-medium text-foreground">
                                    {ADVANCE_CATEGORY_LABELS[adv.category as AdvanceCategory] ?? adv.category}
                                  </span>
                                  {adv.disbursedAt && (
                                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                                      Entregado: {formatDate(adv.disbursedAt)}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right tabular-nums font-medium text-foreground text-xs">
                                  {formatMxCurrency(maxDeduct)}
                                  {reservedAmount > 0 ? (
                                    <span className="block text-[10px] font-normal text-muted-foreground mt-0.5">
                                      {createCopy.summary.reservedAdvanceHint}
                                    </span>
                                  ) : null}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="space-y-1">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      max={maxDeduct}
                                      disabled={!isSelected}
                                      value={isSelected ? currentVal : ""}
                                      onChange={(e) =>
                                        handleAdvanceAmountChange(
                                          adv.advanceId,
                                          maxDeduct,
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      className="h-8 text-right tabular-nums text-xs"
                                    />
                                    {isSelected && remainingAfterDeduction > 0 && (
                                      <p className="text-[10px] text-muted-foreground text-right tabular-nums">
                                        {createCopy.advances.remainingNote} {formatMxCurrency(remainingAfterDeduction)}
                                      </p>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* OBSERVACIONES */}
              <div className="space-y-2">
                <Label htmlFor="settlement-notes" className="text-xs font-medium">
                  {createCopy.sections.notesTitle}
                </Label>
                <Textarea
                  id="settlement-notes"
                  rows={3}
                  placeholder={createCopy.sections.notesPlaceholder}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* COLUMNA DERECHA: Sticky resumen a pagar (D6) */}
            <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-4">
              <Card className="border-primary/20 bg-card shadow-sm">
                <CardHeader className="pb-3 border-b bg-muted/20">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-primary" />
                    {createCopy.summary.cardTitle}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {createCopy.summary.cardSubtitle}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4 text-sm">
                  <div className="bg-primary/5 -mx-4 px-4 py-3 border-b border-primary/10">
                    <div className="flex justify-between items-center gap-2">
                      <div>
                        <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground block">
                          {createCopy.summary.netTotalLabel}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {createCopy.summary.netTotalSubtext}
                        </span>
                      </div>
                      <span className="text-2xl font-extrabold font-mono text-primary tabular-nums">
                        {formatMxCurrency(netAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">{createCopy.summary.earnedLabel}</span>
                      <span className="font-semibold tabular-nums text-foreground">
                        {formatMxCurrency(grossAmount)}
                      </span>
                    </div>
                    {(totalBaseSalary > 0 ||
                      totalFixedAllowances > 0 ||
                      totalCommissions > 0 ||
                      totalReimbursements > 0) && (
                      <div className="pl-2 space-y-1 border-l border-border/60 text-muted-foreground">
                        {totalBaseSalary > 0 && (
                          <div className="flex justify-between gap-2">
                            <span>{createCopy.summary.fixedSalaryLabel}</span>
                            <span className="tabular-nums">{formatMxCurrency(totalBaseSalary)}</span>
                          </div>
                        )}
                        {totalFixedAllowances > 0 && (
                          <div className="flex justify-between gap-2">
                            <span>{createCopy.summary.fixedAllowancesLabel}</span>
                            <span className="tabular-nums">
                              {formatMxCurrency(totalFixedAllowances)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between gap-2">
                          <span>
                            {createCopy.summary.commissionsLabel} ({preview.eligibleTrips.length})
                          </span>
                          <span className="tabular-nums">{formatMxCurrency(totalCommissions)}</span>
                        </div>
                        {totalReimbursements > 0 && (
                          <div className="flex justify-between gap-2">
                            <span>{createCopy.summary.reimbursementsLabel}</span>
                            <span className="tabular-nums">
                              {formatMxCurrency(totalReimbursements)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex justify-between items-center text-destructive pt-1 border-t border-dashed">
                      <span>
                        {createCopy.summary.advancesLabel}
                        {selectedAdvancesCount > 0 ? ` (${selectedAdvancesCount})` : ""}
                      </span>
                      <span className="tabular-nums font-semibold">
                        {totalAdvancesDeducted > 0
                          ? `-${formatMxCurrency(totalAdvancesDeducted)}`
                          : formatMxCurrency(0)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    {!isAgreementReady && hasSettlementContent && (
                      <div className="rounded-lg border border-warning/30 bg-warning-soft/40 p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <Checkbox
                            id="reimbursements-only-opt-in"
                            checked={reimbursementsOnlyOptIn}
                            onCheckedChange={(checked) =>
                              setReimbursementsOnlyOptIn(checked === true)
                            }
                            disabled={!hasReimbursementOrAdvanceWork}
                          />
                          <Label
                            htmlFor="reimbursements-only-opt-in"
                            className="text-xs font-normal leading-snug cursor-pointer"
                          >
                            {createCopy.summary.reimbursementsOnlyLabel}
                          </Label>
                        </div>
                        <p className="text-[11px] text-muted-foreground pl-6">
                          {createCopy.summary.reimbursementsOnlyHint}
                        </p>
                      </div>
                    )}
                    {hasSettlementContent ? (
                      <>
                        {greenfieldCreateCta !== "guardar_borrador" ? (
                          <>
                            <Button
                              className="w-full"
                              disabled={createMutation.isPending || !canProceedWithSave}
                              onClick={() => setConfirmDialogOpen(true)}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              {greenfieldEnabled
                                ? createCopy.summary.pedirVoboBtn
                                : createCopy.summary.submitApprovalBtn}
                            </Button>
                            <p className="text-[11px] text-center text-muted-foreground leading-snug px-1">
                              {createCopy.summary.submitApprovalSegregationHint}
                            </p>
                          </>
                        ) : (
                          <p className="text-[11px] text-center text-muted-foreground leading-snug px-1">
                            {createCopy.summary.bypassDraftHint}
                          </p>
                        )}
                        <Button
                          variant={
                            greenfieldCreateCta === "guardar_borrador"
                              ? "default"
                              : "secondary"
                          }
                          className="w-full"
                          disabled={createMutation.isPending || !canProceedWithSave}
                          onClick={() => handleSave(false)}
                        >
                          {createCopy.summary.saveDraftBtn}
                        </Button>
                        {greenfieldEnabled ? (
                          <p className="text-[11px] text-center text-muted-foreground leading-snug px-1">
                            {createCopy.summary.commercialFreightHint}
                          </p>
                        ) : null}
                        {settingsError && (
                          <p className="text-[11px] text-center text-destructive py-0.5">
                            {copy.toasts.settingsUnavailable}
                          </p>
                        )}
                        {!canProceedWithSave && !settingsError && (
                          <p className="text-[11px] text-center text-muted-foreground py-0.5">
                            {createCopy.summary.actionsBlockedUntilReady}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-center text-muted-foreground py-1">
                        {createCopy.summary.noItemsToSettle}
                      </p>
                    )}
                    <Button
                      variant="ghost"
                      className="w-full text-muted-foreground"
                      onClick={() => navigate(SETTLEMENTS_LIST_PATH)}
                    >
                      {createCopy.summary.cancelBtn}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : isMissingCompensationScheme ? (
          <EmptyState
            icon={<AlertTriangle className="h-8 w-8 text-warning" />}
            title={createCopy.empty.missingSchemeTitle}
            description={createCopy.empty.missingSchemeDescription}
            cta={{
              label: createCopy.empty.configureCompensationAction,
              onClick: () =>
                navigate(
                  settlementsAgreementsPath({
                    employeeId: selectedEmployeeId,
                  }),
                ),
            }}
          />
        ) : isPreviewError ? (
          <EmptyState
            icon={<AlertTriangle className="h-8 w-8 text-destructive" />}
            title={createCopy.empty.previewErrorTitle}
            description={getErrorMessage(previewError)}
          />
        ) : null}
      </div>

      {/* Dialog mínimo: operador · período · neto (D6) */}
      <Dialog
        open={confirmDialogOpen}
        onOpenChange={(open) => {
          if (!createMutation.isPending) {
            setConfirmDialogOpen(open);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              {greenfieldEnabled
                ? createCopy.dialog.voboTitle
                : createCopy.dialog.title}
            </DialogTitle>
            <DialogDescription>
              {greenfieldEnabled
                ? createCopy.dialog.voboDescription
                : createCopy.dialog.description}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-muted/30 p-3.5 space-y-2.5 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-xs">{createCopy.dialog.driverLabel}</span>
              <span className="font-semibold text-foreground text-xs">
                {selectedEmployeeLabel || "—"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-xs">{createCopy.dialog.periodLabel}</span>
              <span className="text-xs font-medium text-foreground">
                {formatDate(periodStart)} – {formatDate(periodEnd)}
              </span>
            </div>
            <div className="border-t pt-2.5 flex justify-between items-center font-bold text-primary text-base">
              <span>{createCopy.dialog.netLabel}</span>
              <span className="tabular-nums font-mono text-lg">{formatMxCurrency(netAmount)}</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              disabled={createMutation.isPending}
              onClick={() => setConfirmDialogOpen(false)}
            >
              {createCopy.dialog.cancelAction}
            </Button>
            <Button
              disabled={createMutation.isPending}
              onClick={() => handleSave(true)}
            >
              <Check className="mr-2 h-4 w-4" />
              {createMutation.isPending ? "Enviando..." : createCopy.dialog.confirmAction}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FormPageShell>
  );
}
