import { useState, useMemo } from "react";
import { useNavigate, useSearchParams, useLocation, Link } from "react-router-dom";
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
import {
  DateField,
  FieldInlineError,
  FormValidationSummary,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { PeriodStepper } from "../components/PeriodStepper";
import { buildSuggestedSettlementPeriod } from "../utils/buildSuggestedSettlementPeriod";
import type { SalaryPeriodKind } from "../utils/buildSuggestedSettlementPeriod";
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
import { formatDate, getTodayString } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { getErrorMessage, isApiError } from "@shared/api/interceptors/error-handler";
import { useEmployeeBasic } from "@features/employees/application";
import { resolveSelfActionUi } from "@features/approvals/domain";
import { useSelfApprovalPolicy } from "@features/approvals/application";
import { EmployeeAsyncCombobox } from "@shared/ui/employee-async-combobox";
import {
  useSettlementPreview,
  useReimbursementSettlementPreview,
  useCreateSettlement,
  useSettlementSettings,
} from "../../application/hooks";
import {
  settlementCreatePath,
  settlementDetailPath,
  settlementsAgreementsPath,
} from "../../application/settlementsRoutes";
import { settlementsCopy } from "../copy/settlementsCopy";
import {
  resolveSettlementBackHref,
  resolveSettlementWayfindingBackLabel,
} from "../utils/settlementWayfinding";
import { shouldShowSupportParticipationBadge } from "../utils/settlementParticipationHelpers";
import {
  resolveMissingSchemeCopy,
  resolveSettlementCompensationReadiness,
} from "../utils/settlementTemplateReadiness";
import { resolveTemplateChangeAlert } from "../utils/templateChangeNotice";
import { resolveTemplateSupersededAlert } from "../utils/templateSupersededNotice";
import { useTemplateAssignments } from "@features/compensation/application/hooks";
import {
  findEligibleAssignmentsForEmployeeOnDate,
  pickAssignmentBySettlementTiebreak,
} from "@features/compensation/presentation/utils/templateAssignmentOverlap";
import {
  customSettlementItemInputSchema,
  type CreateSettlementFormData,
} from "../validation/settlementSchemas";
import { ManualItemsEditor } from "../components/ManualItemsEditor";
import {
  manualItemErrorsFromIssues,
  type ManualItemRow,
  type ManualItemRowErrors,
} from "../utils/manualItemRows";
import {
  applyTemplateDeductionsByPriority,
  assessDeductionCapacity,
  computeSettlementTotals,
  normalizeManualItems,
  roundCents,
  sumManualItems,
  type ManualSettlementItemInput,
} from "../../domain/settlementTotals";
import { liveManualItems } from "../utils/settlementEditing";
import {
  allocateAdvancesFifo,
  deductableAdvanceBalance,
  deductionCapacityErrors,
  deductionsExceedErrorsFromServer,
  parseDeductionsExceedGrossError,
  remainingAdvanceRoom,
  type DeductionCapacityErrors,
} from "../utils/settlementDeductionCapacity";
import {
  resolveCreateSettlementFeedback,
  resolveCreateCta,
} from "../utils/settlementCta";
import {
  isMissingDataAckRequiredError,
  parseNoRuleAckRequiredError,
  parsePeriodPartialOverlapError,
  parseReimbursementCreateError,
  parseTripInActiveSettlementError,
  type PeriodPartialOverlapConflict,
  type ReimbursementCreateError,
  type TripConsumptionConflict,
} from "../utils/settlementCreateConflicts";
import { ReimbursementErrorAlert } from "../components/ReimbursementErrorAlert";
import { ReimbursementLinesTable } from "../components/ReimbursementLinesTable";
import { ReimbursementsPayeeCard } from "../components/ReimbursementsPayeeCard";
import {
  COMPENSATION_SALARY_PERIOD_LABELS,
  TRIP_ROUTE_TYPE_LABELS,
  ADVANCE_CATEGORY_LABELS,
  DEFAULT_VOBO_THRESHOLD_MXN,
  SETTLEMENT_STATUS_LABELS,
  type CompensationCalculationType,
  type CompensationSalaryPeriod,
  type TripRouteType,
  type AdvanceCategory,
} from "../../domain/enums";
import type { EligibleTripPreview, ZeroCommissionReason } from "../../domain/entities";

const copy = settlementsCopy;
const createCopy = settlementsCopy.createPage;
const governanceCopy = settlementsCopy.agreementGovernance;
const capCopy = settlementsCopy.settlementFlow.deductionsCap;

const ZERO_REASON_BADGES: Partial<
  Record<ZeroCommissionReason, { variant: "warning" | "neutral"; label: string; title: string }>
> = {
  no_rule: {
    variant: "warning",
    label: createCopy.zeroReason.no_rule,
    title: createCopy.zeroReason.noRuleTitle,
  },
  zero_km: {
    variant: "warning",
    label: createCopy.zeroReason.zero_km,
    title: createCopy.zeroReason.zeroKmTitle,
  },
  zero_freight: {
    variant: "warning",
    label: createCopy.zeroReason.zero_freight,
    title: createCopy.zeroReason.zeroFreightTitle,
  },
  scheme: {
    variant: "neutral",
    label: createCopy.zeroReason.scheme,
    title: createCopy.zeroReason.schemeTitle,
  },
};

const MISSING_DATA_TRIPS_LISTED = 5;

/**
 * «Cubierto por sueldo base» solo para un local en $0 por regla `none`; con dato
 * faltante, sin regla o mínimo aplicado el viaje muestra su motivo o su insignia.
 */
function isLocalTripCoveredBySalary(
  trip: EligibleTripPreview,
  routeType: TripRouteType,
): boolean {
  if (routeType !== "local" || trip.calculatedCommission !== 0) return false;
  if (trip.calculationGap || trip.minimumGuaranteedApplied) return false;
  if (trip.zeroCommissionReason && trip.zeroCommissionReason !== "scheme") return false;
  return Boolean(trip.appliedRule?.toLowerCase().includes("sueldo"));
}

const ADVANCES_FIELD_ID = "settlement-create-advances";
const MANUAL_ITEMS_FIELD_ID = "settlement-create-manual-items";

export function SettlementCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromState = location.state?.from as string | undefined;
  const backHref = resolveSettlementBackHref(fromState);
  const backLabel = resolveSettlementWayfindingBackLabel(backHref);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const createMutation = useCreateSettlement();
  const {
    data: settings,
    isError: settingsError,
  } = useSettlementSettings();
  // `null` (sin autorización por monto) no debe caer al default: `??` lo convertiría en $0.
  const thresholdMxn = settings ? settings.voboThresholdMxn : DEFAULT_VOBO_THRESHOLD_MXN;
  // Quien arma el corte es su maker: la política dice si podrá autoactuar.
  const { data: selfApprovalPolicy } = useSelfApprovalPolicy();
  const canSelfApproveOwnCut =
    resolveSelfActionUi({
      isOwn: true,
      policy: selfApprovalPolicy?.settlementApprove,
    }) === "self_confirm";
  const canSelfDisburseOwnCut =
    resolveSelfActionUi({
      isOwn: true,
      policy: selfApprovalPolicy?.settlementDisburse,
    }) === "self_confirm";

  // Filter state for live preview (initialize with searchParams if present)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    () => searchParams.get("employeeId") || "",
  );
  const [periodStart, setPeriodStart] = useState<string>(() => {
    const param = searchParams.get("periodStart");
    if (param) return param;
    return `${getTodayString().slice(0, 7)}-01`;
  });
  const [periodEnd, setPeriodEnd] = useState<string>(
    () => searchParams.get("periodEnd") || getTodayString(),
  );

  // Selected advances deduction state: map of advanceId -> amount
  const [advanceDeductions, setAdvanceDeductions] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<string>("");
  // CEO-2 / D24: partidas manuales desde el alta.
  const [manualItems, setManualItems] = useState<ManualItemRow[]>([]);
  const [manualItemErrors, setManualItemErrors] = useState<ManualItemRowErrors[]>([]);
  const [manualItemsSummary, setManualItemsSummary] = useState<string[]>([]);
  // 422 de tope de descuentos: vigente hasta que se editen anticipos o partidas.
  const [serverCapacityErrors, setServerCapacityErrors] = useState<{
    key: string;
    errors: DeductionCapacityErrors;
  } | null>(null);

  // Confirmation dialog pre-submit
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [showTripCalcDetail, setShowTripCalcDetail] = useState(false);
  // ADR-0085 E11.2: una sola confirmación para viajes sin km usable o con flete en $0.
  const [acknowledgeMissingDataTrips, setAcknowledgeMissingDataTrips] = useState(false);
  // 422 de datos faltantes al enviar: vigente mientras no cambien operador ni fechas.
  const [missingDataAckErrorKey, setMissingDataAckErrorKey] = useState<string | null>(null);
  // ADR-0085 E11: viajes sin regla entran en $0 solo con confirmación explícita.
  const [acknowledgeNoRuleTrips, setAcknowledgeNoRuleTrips] = useState(false);
  const [noRuleDialog, setNoRuleDialog] = useState<{
    submit: boolean;
    tripCodes: readonly string[];
  } | null>(null);
  // 409 del alta: vigente mientras no cambien operador ni fechas.
  const [serverPeriodConflict, setServerPeriodConflict] = useState<{
    key: string;
    conflict: PeriodPartialOverlapConflict;
  } | null>(null);
  const [tripConflictAlert, setTripConflictAlert] = useState<{
    key: string;
    conflicts: readonly TripConsumptionConflict[];
  } | null>(null);
  // E11 punto 8: gastos con cambio de conductor que el usuario asigna; se reinician con operador/fechas.
  const [confirmedPayee, setConfirmedPayee] = useState<{
    key: string;
    ids: ReadonlySet<string>;
  }>({ key: "", ids: new Set() });
  const [reimbursementErrorState, setReimbursementErrorState] = useState<{
    key: string;
    error: ReimbursementCreateError;
  } | null>(null);

  const urlEmployeeId = searchParams.get("employeeId") || "";
  const urlPeriodStart = searchParams.get("periodStart") || "";
  const urlPeriodEnd = searchParams.get("periodEnd") || "";
  const urlFiltersKey = `${urlEmployeeId}|${urlPeriodStart}|${urlPeriodEnd}`;
  const [prevUrlFilters, setPrevUrlFilters] = useState({
    key: urlFiltersKey,
    employeeId: urlEmployeeId,
    periodStart: urlPeriodStart,
    periodEnd: urlPeriodEnd,
  });

  // Sync filters from URL when querystring values change (adjust state during
  // render — evita react-hooks/set-state-in-effect).
  if (urlFiltersKey !== prevUrlFilters.key) {
    const empChanged =
      Boolean(urlEmployeeId) && urlEmployeeId !== prevUrlFilters.employeeId;
    const startChanged =
      Boolean(urlPeriodStart) && urlPeriodStart !== prevUrlFilters.periodStart;
    const endChanged =
      Boolean(urlPeriodEnd) && urlPeriodEnd !== prevUrlFilters.periodEnd;

    setPrevUrlFilters({
      key: urlFiltersKey,
      employeeId: urlEmployeeId,
      periodStart: urlPeriodStart,
      periodEnd: urlPeriodEnd,
    });
    if (empChanged) setSelectedEmployeeId(urlEmployeeId);
    if (startChanged) setPeriodStart(urlPeriodStart);
    if (endChanged) setPeriodEnd(urlPeriodEnd);
    if (empChanged || startChanged || endChanged) {
      setAdvanceDeductions({});
      setAcknowledgeMissingDataTrips(false);
    }
  }

  const {
    data: preview,
    isLoading: isPreviewLoading,
    isError: isPreviewError,
    error: previewError,
    refetch: refetchPreview,
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

  const totalCommissions = preview?.summary.totalCommissions ?? 0;
  const totalBaseSalary = preview?.summary.totalBaseSalary ?? 0;
  const totalFixedAllowances = preview?.summary.totalFixedAllowances ?? 0;
  const selectionKey = `${selectedEmployeeId}|${periodStart}|${periodEnd}`;
  const eligibleTripIdSet = new Set((preview?.eligibleTrips ?? []).map((trip) => trip.tripId));
  // E11 punto 7(b): tardíos de viajes que ya están en otro pago (no salen en la tabla de viajes).
  const lateReimbursementLines = (preview?.reimbursements ?? []).filter(
    (line) => line.isLate && !eligibleTripIdSet.has(line.tripId),
  );
  const payeeLines = preview?.reimbursementsRequiringPayee ?? [];
  const confirmedPayeeIds =
    confirmedPayee.key === selectionKey ? confirmedPayee.ids : new Set<string>();
  const confirmedPayeeLines = payeeLines.filter((line) =>
    confirmedPayeeIds.has(line.tripExpenseId),
  );
  const confirmedReimbursementsTotal = roundCents(
    confirmedPayeeLines.reduce((sum, line) => sum + line.amount, 0),
  );
  const totalReimbursements = roundCents(
    (preview?.summary.totalReimbursements ?? 0) + confirmedReimbursementsTotal,
  );
  const reimbursementError =
    reimbursementErrorState?.key === selectionKey ? reimbursementErrorState.error : null;
  const reimbursementRowErrors: Record<string, string> = {};
  if (reimbursementError?.kind === "payee_not_trip_driver") {
    reimbursementRowErrors[reimbursementError.tripExpenseId] =
      copy.reimbursements.errors.payeeNotDriverRow;
  } else if (reimbursementError?.kind === "not_eligible") {
    reimbursementRowErrors[reimbursementError.tripExpenseId] =
      copy.reimbursements.errors.notEligibleRow;
  }
  const findReimbursementExpense = (tripExpenseId: string) =>
    [...(preview?.reimbursements ?? []), ...payeeLines].find(
      (line) => line.tripExpenseId === tripExpenseId,
    );
  const handleTogglePayee = (tripExpenseId: string, checked: boolean) => {
    const next = new Set(confirmedPayeeIds);
    if (checked) next.add(tripExpenseId);
    else next.delete(tripExpenseId);
    setConfirmedPayee({ key: selectionKey, ids: next });
  };
  const calculatedGross =
    totalCommissions + totalBaseSalary + totalFixedAllowances + totalReimbursements;

  const totalAdvancesDeducted = roundCents(
    Object.values(advanceDeductions).reduce((acc, val) => acc + val, 0),
  );
  const selectedAdvancesCount = Object.keys(advanceDeductions).filter(
    (k) => (advanceDeductions[k] ?? 0) > 0,
  ).length;

  // TEC-6: mismos totales que el API (paridad en settlementTotals.test).
  const liveManual = normalizeManualItems(liveManualItems(manualItems));
  const manualSums = sumManualItems(liveManual);
  // La tarifa consume lo ganado (con bonos manuales) por prioridad; lo que no cabe se omite.
  // E11 punto 6: los reembolsos no son base de las deducciones de tarifa (igual que el API).
  const templateLines = preview?.deductions ?? [];
  const appliedTemplateLines = applyTemplateDeductionsByPriority(
    totalCommissions + totalBaseSalary + totalFixedAllowances + manualSums.additions,
    templateLines,
  );
  const totalTemplateDeductions =
    templateLines.length > 0
      ? roundCents(appliedTemplateLines.reduce((sum, line) => sum + line.appliedAmount, 0))
      : (preview?.summary.totalDeductions ?? 0);
  const omittedTemplateLines = appliedTemplateLines.filter((line) => line.omittedAmount > 0);
  const calculatedBase = {
    calculatedGross,
    templateDeductions: totalTemplateDeductions,
    advancesDeducted: totalAdvancesDeducted,
  };
  const { grossAmount, netAmount } = computeSettlementTotals(calculatedBase, liveManual);
  const capacity = assessDeductionCapacity(calculatedBase, liveManual);
  const maxAdvanceDeductible = capacity.maxAdvanceDeductible;
  const capacityInputsKey = JSON.stringify([advanceDeductions, manualItems]);
  const capacityErrors: DeductionCapacityErrors =
    serverCapacityErrors && serverCapacityErrors.key === capacityInputsKey
      ? serverCapacityErrors.errors
      : deductionCapacityErrors(capacity);
  const capacityMessages = [capacityErrors.advances, capacityErrors.manualItems].filter(
    (message): message is string => Boolean(message),
  );
  const hasCapacityError = capacityMessages.length > 0;

  const advancesForAllocation = (advanceIds?: ReadonlySet<string>) =>
    (preview?.openAdvances ?? [])
      .filter((adv) => !advanceIds || advanceIds.has(adv.advanceId))
      .map((adv) => ({
        advanceId: adv.advanceId,
        available: deductableAdvanceBalance(adv),
        disbursedAt: adv.disbursedAt,
      }));

  // Al marcar uno se precarga lo que cabe sin mover los ya capturados.
  const handleAdvanceToggle = (advanceId: string, available: number, checked: boolean) => {
    const next = { ...advanceDeductions };
    if (checked) {
      const otherAdvancesTotal = Object.entries(advanceDeductions)
        .filter(([id]) => id !== advanceId)
        .reduce((sum, [, amount]) => sum + amount, 0);
      next[advanceId] = remainingAdvanceRoom({
        available,
        maxDeductible: maxAdvanceDeductible,
        otherAdvancesTotal,
      });
    } else {
      delete next[advanceId];
    }
    setAdvanceDeductions(next);
  };

  const handleAdvanceAmountChange = (advanceId: string, maxAmount: number, amount: number) => {
    const validAmount = Math.max(0, Math.min(amount, maxAmount));
    setAdvanceDeductions((prev) => ({
      ...prev,
      [advanceId]: validAmount,
    }));
  };

  // FIFO por fecha de entrega; los que no alcanzan nada quedan desmarcados.
  const handleSelectAllAdvances = () => {
    if (!preview?.openAdvances) return;
    setAdvanceDeductions(allocateAdvancesFifo(advancesForAllocation(), maxAdvanceDeductible));
  };

  const handleFitAdvancesToMax = () => {
    const selected = new Set(Object.keys(advanceDeductions));
    setAdvanceDeductions(
      allocateAdvancesFifo(advancesForAllocation(selected), maxAdvanceDeductible),
    );
  };

  const handleClearAllAdvances = () => {
    setAdvanceDeductions({});
  };

  /** Los descuentos que no caben bloquean guardar/enviar (el error ya está visible). */
  const ensureDeductionsFit = (): boolean => !hasCapacityError;
  const hasManualAdjustments = manualItems.length > 0;
  const createCta = resolveCreateCta({
    netAmount,
    hasManualAdjustments,
    thresholdMxn,
  });

  const handleManualItemsChange = (rows: ManualItemRow[]) => {
    setManualItems(rows);
    if (manualItemErrors.length > 0 || manualItemsSummary.length > 0) {
      setManualItemErrors([]);
      setManualItemsSummary([]);
    }
  };

  /** Valida las partidas manuales al guardar/enviar; null = hay errores visibles. */
  const validateManualItems = (): ManualSettlementItemInput[] | null => {
    const result = customSettlementItemInputSchema.array().safeParse(manualItems);
    if (result.success) {
      setManualItemErrors([]);
      setManualItemsSummary([]);
      // Un viaje elegido antes de cambiar operador/periodo ya no pertenece al corte.
      const eligibleTripIds = new Set((preview?.eligibleTrips ?? []).map((t) => t.tripId));
      return result.data.map((item) => ({
        itemType: item.itemType,
        description: item.description,
        amount: item.amount,
        ...(item.isDeduction !== undefined ? { isDeduction: item.isDeduction } : {}),
        ...(item.tripId && eligibleTripIds.has(item.tripId) ? { tripId: item.tripId } : {}),
      }));
    }
    setManualItemErrors(manualItemErrorsFromIssues(result.error.issues));
    setManualItemsSummary(
      Array.from(
        new Set(
          result.error.issues.map((issue) => {
            const index = typeof issue.path[0] === "number" ? issue.path[0] : 0;
            return `${copy.settlementFlow.manualItems.rowLabel(index + 1)}: ${issue.message}`;
          }),
        ),
      ),
    );
    return null;
  };

  const requestSubmitForApproval = () => {
    const manualItemsValid = validateManualItems() !== null;
    if (!ensureDeductionsFit() || !manualItemsValid) return;
    if (noRuleTrips.length > 0 && !acknowledgeNoRuleTrips) {
      setNoRuleDialog({ submit: true, tripCodes: noRuleTrips.map((trip) => trip.tripCode) });
      return;
    }
    setConfirmDialogOpen(true);
  };

  const handleConfirmNoRuleTrips = () => {
    if (!noRuleDialog) return;
    const { submit } = noRuleDialog;
    setAcknowledgeNoRuleTrips(true);
    setNoRuleDialog(null);
    if (submit) {
      setConfirmDialogOpen(true);
    } else {
      void handleSave(false, { acknowledgeNoRuleTrips: true });
    }
  };

  const agreement = preview?.agreement as Record<string, unknown> | undefined;
  const readiness = useMemo(
    () => resolveSettlementCompensationReadiness(preview, previewError),
    [preview, previewError],
  );
  const isAgreementReady = readiness === "ready";
  const templateChangeAlert =
    preview?.templateChange && isAgreementReady
      ? resolveTemplateChangeAlert(
          preview.templateChange,
          preview.eligibleTrips.length > 0,
          preview.periodEnd,
        )
      : null;
  const templateSupersededAlert =
    preview?.templateSuperseded && isAgreementReady
      ? resolveTemplateSupersededAlert(preview.templateSuperseded)
      : null;
  const missingSchemeCopy = resolveMissingSchemeCopy(previewError);
  // D9: sin tarifa válida, los reembolsos pendientes se pagan en un pago de reembolsos.
  const { data: reimbursementOnlyPreview } = useReimbursementSettlementPreview(
    selectedEmployeeId && (isMissingCompensationScheme || (preview && !isAgreementReady))
      ? selectedEmployeeId
      : null,
  );
  const canOfferReimbursementSettlement =
    (reimbursementOnlyPreview?.reimbursements?.length ?? 0) +
      (reimbursementOnlyPreview?.reimbursementsRequiringPayee?.length ?? 0) >
    0;
  const previewAssignmentId = preview?.template?.assignmentId;
  const assignmentAmbiguity = useMemo(() => {
    if (!selectedEmployeeId || !periodEnd) {
      return { hasAmbiguity: false, appliedAssignment: null, eligibleCount: 0 };
    }

    const eligible = findEligibleAssignmentsForEmployeeOnDate(
      employeeAssignments,
      selectedEmployeeId,
      periodEnd,
    );

    const appliedByPreview = previewAssignmentId
      ? eligible.find((assignment) => assignment.id === previewAssignmentId)
      : undefined;

    return {
      hasAmbiguity: eligible.length > 1,
      appliedAssignment: appliedByPreview ?? pickAssignmentBySettlementTiebreak(eligible),
      eligibleCount: eligible.length,
    };
  }, [employeeAssignments, periodEnd, selectedEmployeeId, previewAssignmentId]);
  const hasFixedSalary = Boolean(agreement?.has_fixed_salary || agreement?.hasFixedSalary);
  const fixedSalaryAmount = Number(agreement?.fixed_salary_amount ?? agreement?.fixedSalaryAmount ?? 0);
  const fixedSalaryPeriod = String(agreement?.fixed_salary_period ?? agreement?.fixedSalaryPeriod ?? "weekly");

  const salaryPeriod: SalaryPeriodKind | null = (() => {
    // Source of truth = employee.salary_type (independent of compensation template / preview).
    const raw = selectedEmployeeBasic?.salaryType ?? null;
    if (raw === "weekly" || raw === "biweekly" || raw === "monthly") return raw;
    return null;
  })();

  // Al cambiar de operador, sugerir periodo según salary_type (adjust state
  // during render — evita react-hooks/set-state-in-effect).
  const [prevEmployeeId, setPrevEmployeeId] = useState(selectedEmployeeId);
  if (selectedEmployeeId !== prevEmployeeId) {
    setPrevEmployeeId(selectedEmployeeId);
    if (
      selectedEmployeeId &&
      selectedEmployeeBasic?.salaryType &&
      ["weekly", "biweekly", "monthly"].includes(selectedEmployeeBasic.salaryType)
    ) {
      const period = buildSuggestedSettlementPeriod({
        salaryPeriod: selectedEmployeeBasic.salaryType as SalaryPeriodKind,
      });
      setPeriodStart(period.periodStart);
      setPeriodEnd(period.periodEnd);
      setAdvanceDeductions({});
      setAcknowledgeMissingDataTrips(false);
    }
  }

  // E11-F3 (O-1): sin tarifa no hay pago regular; los reembolsos van en un pago de reembolsos.
  const canProceedWithSave = isAgreementReady;
  const hasSettlementContent =
    (preview?.eligibleTrips.length ?? 0) > 0 ||
    totalBaseSalary > 0 ||
    totalFixedAllowances > 0 ||
    totalReimbursements > 0;
  const missingDataTrips = useMemo(
    () =>
      (preview?.eligibleTrips ?? []).filter(
        (trip) => trip.requiresZeroKmAck || trip.requiresZeroFreightAck,
      ),
    [preview?.eligibleTrips],
  );
  const hasMissingDataGaps = missingDataTrips.length > 0;
  const noRuleTrips = (preview?.eligibleTrips ?? []).filter(
    (trip) => trip.zeroCommissionReason === "no_rule",
  );
  const periodicBlock = preview?.periodicBlock;
  const periodConflictKey = `${selectedEmployeeId}|${periodStart}|${periodEnd}`;
  const partialOverlap: PeriodPartialOverlapConflict | null =
    periodicBlock?.status === "partial_overlap" &&
    periodicBlock.settlement &&
    periodicBlock.suggestedPeriodStart
      ? { ...periodicBlock.settlement, suggestedPeriodStart: periodicBlock.suggestedPeriodStart }
      : serverPeriodConflict?.key === periodConflictKey
        ? serverPeriodConflict.conflict
        : null;
  const isPeriodBlocked = partialOverlap !== null;
  const hasUsableSuggestedStart =
    partialOverlap !== null &&
    Boolean(partialOverlap.suggestedPeriodStart) &&
    partialOverlap.suggestedPeriodStart <= periodEnd;
  const tripConflicts =
    tripConflictAlert?.key === periodConflictKey ? tripConflictAlert.conflicts : null;
  const containedBlockSettlement =
    periodicBlock?.status === "excluded_contained" ? periodicBlock.settlement : null;
  const showCommercialFreightHint = useMemo(
    () =>
      (preview?.eligibleTrips ?? []).some(
        (trip) => trip.freightBase === "commercial_at_complete",
      ),
    [preview?.eligibleTrips],
  );
  const canSubmitForApproval =
    canProceedWithSave &&
    !isPeriodBlocked &&
    (!hasMissingDataGaps || acknowledgeMissingDataTrips);
  const missingDataAckError =
    missingDataAckErrorKey === periodConflictKey && !acknowledgeMissingDataTrips
      ? createCopy.missingDataGate.serverAckRequired
      : undefined;

  const tripDetailReturnHref = useMemo(
    () =>
      settlementCreatePath({
        ...(selectedEmployeeId ? { employeeId: selectedEmployeeId } : {}),
        ...(periodStart ? { periodStart } : {}),
        ...(periodEnd ? { periodEnd } : {}),
      }),
    [selectedEmployeeId, periodStart, periodEnd],
  );

  // Reset de confirmaciones al cambiar preview / gaps (adjust state during render —
  // evita react-hooks/set-state-in-effect).
  const ackSyncKey = `${preview?.employeeId ?? ""}|${preview?.periodStart ?? ""}|${preview?.periodEnd ?? ""}|${missingDataTrips.length}|${noRuleTrips.length}`;
  const [prevAckSyncKey, setPrevAckSyncKey] = useState(ackSyncKey);
  if (ackSyncKey !== prevAckSyncKey) {
    setPrevAckSyncKey(ackSyncKey);
    setAcknowledgeMissingDataTrips(false);
    setAcknowledgeNoRuleTrips(false);
  }

  const handleStartOnSuggested = (date: string) => {
    setPeriodStart(date);
    setAdvanceDeductions({});
    setServerPeriodConflict(null);
  };

  const describePeriod = (start: string, end: string) =>
    `${formatDate(start)} – ${formatDate(end)}`;

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

  const handleSave = async (
    submitForApproval: boolean,
    options: { acknowledgeNoRuleTrips?: boolean } = {},
  ) => {
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

    if (isPeriodBlocked) {
      setConfirmDialogOpen(false);
      return;
    }

    const customItems = validateManualItems();
    if (!ensureDeductionsFit() || !customItems) {
      setConfirmDialogOpen(false);
      return;
    }

    const noRuleAcknowledged = options.acknowledgeNoRuleTrips ?? acknowledgeNoRuleTrips;
    if (noRuleTrips.length > 0 && !noRuleAcknowledged) {
      setConfirmDialogOpen(false);
      setNoRuleDialog({
        submit: submitForApproval,
        tripCodes: noRuleTrips.map((trip) => trip.tripCode),
      });
      return;
    }

    // El API pide ambas confirmaciones por separado (primero km); la UI tiene una sola.
    const missingDataAcknowledged =
      submitForApproval && hasMissingDataGaps && acknowledgeMissingDataTrips;

    try {
      const openAdvancesMap = new Map(
        (preview?.openAdvances ?? []).map((adv) => [adv.advanceId, deductableAdvanceBalance(adv)]),
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
        confirmedReimbursementExpenseIds: confirmedPayeeLines.map((line) => line.tripExpenseId),
        advancesToApply,
        customItems,
        notes: notes || undefined,
        submitForApproval,
        acknowledgeZeroKmTrips: missingDataAcknowledged,
        acknowledgeZeroFreightTrips: missingDataAcknowledged,
        acknowledgeNoRuleTrips: noRuleAcknowledged,
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
      navigate(settlementDetailPath(result.id), { state: { from: backHref } });
    } catch (error) {
      const exceedsGross = parseDeductionsExceedGrossError(error);
      if (exceedsGross) {
        setServerCapacityErrors({
          key: capacityInputsKey,
          errors: deductionsExceedErrorsFromServer(exceedsGross, { useServerMessage: false }),
        });
        setConfirmDialogOpen(false);
        return;
      }
      const periodConflict = parsePeriodPartialOverlapError(error);
      if (periodConflict) {
        setServerPeriodConflict({ key: periodConflictKey, conflict: periodConflict });
        setConfirmDialogOpen(false);
        void refetchPreview();
        return;
      }
      const missingNoRuleAck = parseNoRuleAckRequiredError(error);
      if (missingNoRuleAck) {
        setConfirmDialogOpen(false);
        setAcknowledgeNoRuleTrips(false);
        setNoRuleDialog({ submit: submitForApproval, tripCodes: missingNoRuleAck });
        void refetchPreview();
        return;
      }
      if (isMissingDataAckRequiredError(error)) {
        setConfirmDialogOpen(false);
        setAcknowledgeMissingDataTrips(false);
        setMissingDataAckErrorKey(periodConflictKey);
        void refetchPreview();
        return;
      }
      const consumedTrips = parseTripInActiveSettlementError(error);
      if (consumedTrips) {
        setConfirmDialogOpen(false);
        setTripConflictAlert({ key: periodConflictKey, conflicts: consumedTrips });
        void refetchPreview();
        return;
      }
      const reimbursementFailure = parseReimbursementCreateError(error);
      if (reimbursementFailure) {
        setConfirmDialogOpen(false);
        setReimbursementErrorState({ key: selectionKey, error: reimbursementFailure });
        if (reimbursementFailure.kind === "payee_not_trip_driver") {
          handleTogglePayee(reimbursementFailure.tripExpenseId, false);
        }
        void refetchPreview();
        return;
      }
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
        backHref,
        backLabel,
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <EmployeeAsyncCombobox
                  id="create-emp"
                  label={`${copy.fields.employee} *`}
                  value={selectedEmployeeId}
                  onChange={(employeeId) => {
                    setSelectedEmployeeId(employeeId);
                    setAdvanceDeductions({});
                  }}
                  placeholder="Seleccionar chofer u operador..."
                />
              </div>

              <div className="space-y-1.5">
                <Label>{settlementsCopy.periodStepper.label} *</Label>
                {salaryPeriod ? (
                  <PeriodStepper
                    salaryPeriod={salaryPeriod}
                    periodStart={periodStart}
                    periodEnd={periodEnd}
                    onChange={(start, end) => {
                      setPeriodStart(start);
                      setPeriodEnd(end);
                      setAdvanceDeductions({});
                    }}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <DateField
                      id="create-start"
                      value={periodStart}
                      onChange={(val) => {
                        setPeriodStart(val);
                        setAdvanceDeductions({});
                      }}
                    />
                    <DateField
                      id="create-end"
                      value={periodEnd}
                      onChange={(val) => {
                        setPeriodEnd(val);
                        setAdvanceDeductions({});
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {templateChangeAlert && (
              <Alert variant="warning" data-testid="settlement-template-change-alert">
                <AlertTriangle />
                <AlertTitle>{templateChangeAlert.title}</AlertTitle>
                <AlertDescription>{templateChangeAlert.body}</AlertDescription>
              </Alert>
            )}
            {templateSupersededAlert && (
              <Alert variant="warning" data-testid="settlement-template-superseded-alert">
                <AlertTriangle />
                <AlertTitle>{templateSupersededAlert.title}</AlertTitle>
                <AlertDescription>{templateSupersededAlert.body}</AlertDescription>
              </Alert>
            )}
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
                      {createCopy.sections.templateAppliedValue(
                        preview.template.name,
                        preview.template.version,
                      )}
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
              !preview.templateChange &&
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
                          periodStart,
                          periodEnd,
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
                    : missingSchemeCopy.title}
                </AlertTitle>
                <AlertDescription className="space-y-3">
                  <p>
                    {readiness === "incomplete"
                      ? createCopy.empty.incompleteAgreementDescription
                      : missingSchemeCopy.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Button type="button" size="sm" asChild>
                      <Link
                        to={settlementsAgreementsPath({
                          employeeId: selectedEmployeeId,
                          periodStart,
                          periodEnd,
                        })}
                      >
                        {readiness === "incomplete"
                          ? createCopy.empty.configureIncompleteCompensationAction
                          : createCopy.empty.configureCompensationAction}
                      </Link>
                    </Button>
                    {readiness === "incomplete" && selectedEmployeeId ? (
                      <Button type="button" size="sm" variant="outline" asChild>
                        <Link to={`/employees/${selectedEmployeeId}/edit`}>
                          {createCopy.empty.configureEmployeeSalaryAction}
                        </Link>
                      </Button>
                    ) : null}
                    {canOfferReimbursementSettlement ? (
                      <Button type="button" size="sm" variant="outline" asChild>
                        <Link
                          to={settlementCreatePath({
                            kind: "reimbursements",
                            employeeId: selectedEmployeeId,
                          })}
                          state={{ from: backHref }}
                        >
                          {copy.reimbursements.createAction}
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            {partialOverlap ? (
              <Alert variant="warning">
                <AlertTriangle />
                <AlertTitle>{createCopy.periodicBlock.partialTitle}</AlertTitle>
                <AlertDescription className="space-y-3">
                  <p>
                    {(hasUsableSuggestedStart
                      ? createCopy.periodicBlock.partialDescription
                      : createCopy.periodicBlock.partialDescriptionNoSuggestion)(
                      partialOverlap.settlementNumber,
                      SETTLEMENT_STATUS_LABELS[partialOverlap.status] ?? partialOverlap.status,
                      describePeriod(partialOverlap.periodStart, partialOverlap.periodEnd),
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {hasUsableSuggestedStart ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleStartOnSuggested(partialOverlap.suggestedPeriodStart)}
                      >
                        {createCopy.periodicBlock.startOnAction(
                          formatDate(partialOverlap.suggestedPeriodStart),
                        )}
                      </Button>
                    ) : null}
                    {partialOverlap.settlementId ? (
                      <Button type="button" size="sm" variant="outline" asChild>
                        <Link to={settlementDetailPath(partialOverlap.settlementId)}>
                          {createCopy.periodicBlock.viewSettlementAction(
                            partialOverlap.settlementNumber,
                          )}
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </AlertDescription>
              </Alert>
            ) : containedBlockSettlement ? (
              <Alert variant="info">
                <Info />
                <AlertTitle>{createCopy.periodicBlock.containedTitle}</AlertTitle>
                <AlertDescription className="space-y-3">
                  <p>
                    {createCopy.periodicBlock.containedDescription(
                      containedBlockSettlement.settlementNumber,
                      SETTLEMENT_STATUS_LABELS[containedBlockSettlement.status] ??
                        containedBlockSettlement.status,
                      describePeriod(
                        containedBlockSettlement.periodStart,
                        containedBlockSettlement.periodEnd,
                      ),
                    )}
                  </p>
                  <Button type="button" size="sm" variant="outline" asChild>
                    <Link to={settlementDetailPath(containedBlockSettlement.settlementId)}>
                      {createCopy.periodicBlock.viewSettlementAction(
                        containedBlockSettlement.settlementNumber,
                      )}
                    </Link>
                  </Button>
                </AlertDescription>
              </Alert>
            ) : null}
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
                            <TableHead className="min-w-[7.5rem] text-right">{createCopy.trips.payCol}</TableHead>
                            <TableHead className="text-right">{createCopy.trips.reimbursementsCol}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {preview.eligibleTrips.map((trip) => {
                            const routeType = (trip.routeType as TripRouteType) || "long_haul";
                            const routeTypeLabel = TRIP_ROUTE_TYPE_LABELS[routeType] ?? routeType;
                            const isLocalCovered = isLocalTripCoveredBySalary(trip, routeType);
                            const zeroReasonBadge = trip.zeroCommissionReason
                              ? ZERO_REASON_BADGES[trip.zeroCommissionReason]
                              : undefined;
                            const hasMissingData =
                              trip.requiresZeroKmAck || trip.requiresZeroFreightAck;

                            return (
                              <TableRow key={trip.tripId}>
                                <TableCell className="font-semibold text-primary font-mono text-xs">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <Link
                                      to={`/trips/${trip.tripId}`}
                                      state={{ from: tripDetailReturnHref }}
                                      className="font-semibold text-primary hover:underline font-mono text-xs"
                                    >
                                      {trip.tripCode}
                                    </Link>
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
                                        title={`${trip.corridorMatch.name} — ${formatMxCurrency(trip.corridorMatch.fixedAmount)}${trip.corridorMatch.replacesKmCommission ? " · Sustituye comisión por km" : ""}`}
                                      >
                                        {createCopy.trips.corridorBadgeLabel}
                                      </Badge>
                                    ) : null}
                                    {!isLocalCovered && zeroReasonBadge ? (
                                      <Badge
                                        variant={zeroReasonBadge.variant}
                                        tone="soft"
                                        className="text-[10px] py-0 px-1.5 h-4 font-normal"
                                        title={zeroReasonBadge.title}
                                      >
                                        {zeroReasonBadge.label}
                                      </Badge>
                                    ) : null}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium text-foreground text-xs">
                                    {trip.originCity} → {trip.destinationCity}
                                  </div>
                                  <div className="mt-0.5 flex flex-wrap items-center gap-1">
                                    <Badge
                                      variant={
                                        routeType === "long_haul"
                                          ? "info"
                                          : routeType === "transfer"
                                            ? "warning"
                                            : "neutral"
                                      }
                                      tone="soft"
                                      className="text-[10px]"
                                    >
                                      <Route className="mr-1 h-2.5 w-2.5" />
                                      {routeTypeLabel}
                                    </Badge>
                                    {trip.operationalOutcome === "false_trip" ? (
                                      <Badge
                                        variant="warning"
                                        tone="soft"
                                        className="text-[10px] py-0 px-1.5 h-4 font-normal"
                                      >
                                        {createCopy.trips.falseTripBadge}
                                      </Badge>
                                    ) : null}
                                    {trip.hasRevenueSplit ? (
                                      <Badge
                                        variant="info"
                                        tone="soft"
                                        className="text-[10px] py-0 px-1.5 h-4 font-normal"
                                        title={createCopy.trips.revenueSplitBadgeTitle}
                                      >
                                        {createCopy.trips.revenueSplitBadge}
                                      </Badge>
                                    ) : null}
                                  </div>
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
                                      {trip.requiresZeroKmAck ||
                                      trip.distanceBasis === "unavailable" ? (
                                        <span className="text-warning font-medium">
                                          {createCopy.trips.distanceUnavailableLabel}
                                        </span>
                                      ) : (
                                        <span>
                                          {trip.distanceKm} km
                                          {trip.distanceBasis === "odometer"
                                            ? ` ${createCopy.trips.distanceOdometerSuffix}`
                                            : ""}
                                        </span>
                                      )}
                                      <span className="mx-1.5 opacity-40">·</span>
                                      <span
                                        className={
                                          trip.requiresZeroFreightAck
                                            ? "text-warning font-medium"
                                            : undefined
                                        }
                                      >
                                        Flete {formatMxCurrency(trip.freightRevenue)}
                                      </span>
                                      {trip.freightBase === "commercial_at_complete" ? (
                                        <span className="block text-[10px] opacity-80">
                                          al completar
                                        </span>
                                      ) : null}
                                      {trip.requiresZeroKmAck ? (
                                        <span className="block text-[10px] text-warning mt-0.5">
                                          {createCopy.trips.distanceGapHint}
                                        </span>
                                      ) : null}
                                      {trip.requiresZeroFreightAck ? (
                                        <span className="block text-[10px] text-warning mt-0.5">
                                          {createCopy.trips.freightGapHint}
                                        </span>
                                      ) : null}
                                    </TableCell>
                                  </>
                                ) : null}
                                <TableCell
                                  className={`min-w-[7.5rem] text-right tabular-nums font-bold ${
                                    hasMissingData ? "text-warning" : "text-foreground"
                                  }`}
                                >
                                  {isLocalCovered ? (
                                    <span className="text-xs font-normal text-muted-foreground">
                                      $0.00
                                    </span>
                                  ) : (
                                    <div className="flex flex-col items-end">
                                      {formatMxCurrency(trip.calculatedCommission)}
                                      {trip.minimumGuaranteedApplied ? (
                                        <Badge
                                          variant="info"
                                          tone="soft"
                                          className="mt-0.5 h-auto shrink-0 whitespace-nowrap text-[10px] font-normal leading-4 px-1.5 py-0"
                                          title={createCopy.trips.minimumGuaranteedBadgeTitle(
                                            formatMxCurrency(trip.commissionBeforeMinimum ?? 0),
                                            formatMxCurrency(
                                              trip.minimumGuaranteedAmount ??
                                                trip.calculatedCommission,
                                            ),
                                          )}
                                        >
                                          {createCopy.trips.minimumGuaranteedBadge}
                                        </Badge>
                                      ) : null}
                                      {typeof trip.participantCount === "number" &&
                                      trip.participantCount > 1 ? (
                                        <Badge
                                          variant="neutral"
                                          tone="soft"
                                          className="mt-0.5 h-auto shrink-0 whitespace-nowrap text-[10px] font-normal leading-4 px-1.5 py-0"
                                          title={createCopy.trips.multipleOperatorsBadgeTitle}
                                        >
                                          {createCopy.trips.multipleOperatorsBadge}
                                        </Badge>
                                      ) : null}
                                    </div>
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

              {lateReimbursementLines.length > 0 ? (
                <Card className="border-border shadow-xs" data-testid="late-reimbursements-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">
                      {copy.reimbursements.lateSection.title(lateReimbursementLines.length)}
                    </CardTitle>
                    <CardDescription>{copy.reimbursements.lateSection.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ReimbursementLinesTable
                      lines={lateReimbursementLines}
                      ariaLabel={copy.reimbursements.lateSection.title(lateReimbursementLines.length)}
                      showTotal
                      tripLinkFrom={tripDetailReturnHref}
                    />
                  </CardContent>
                </Card>
              ) : null}

              {payeeLines.length > 0 ? (
                <ReimbursementsPayeeCard
                  lines={payeeLines}
                  operatorName={selectedEmployeeLabel}
                  selectedIds={confirmedPayeeIds}
                  onToggle={handleTogglePayee}
                  rowErrors={reimbursementRowErrors}
                  disabled={createMutation.isPending}
                  tripLinkFrom={tripDetailReturnHref}
                />
              ) : null}

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
                                  {adv.reservedBySettlementNumber ? (
                                    <span
                                      className="block text-[10px] font-normal text-muted-foreground mt-0.5"
                                      data-testid={`create-advance-reserved-elsewhere-${adv.advanceId}`}
                                    >
                                      {createCopy.summary.reservedElsewhereHint(adv.reservedBySettlementNumber)}
                                    </span>
                                  ) : reservedAmount > 0 ? (
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
                                      aria-label={`${createCopy.advances.amountAriaLabel} ${adv.folio}`}
                                      error={isSelected && Boolean(capacityErrors.advances)}
                                      {...(isSelected
                                        ? getFieldErrorAriaProps(ADVANCES_FIELD_ID, capacityErrors.advances)
                                        : {})}
                                      className="h-8 text-right tabular-nums text-xs"
                                    />
                                    {isSelected && remainingAfterDeduction > 0 && (
                                      <p
                                        className="text-[10px] text-muted-foreground text-right tabular-nums"
                                        data-testid={`create-advance-pending-${adv.advanceId}`}
                                      >
                                        {capCopy.pendingNextCut(formatMxCurrency(remainingAfterDeduction))}
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
                  {preview.openAdvances.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p
                        className="text-xs text-muted-foreground tabular-nums"
                        data-testid="create-advances-max-hint"
                      >
                        {capCopy.maxDeductibleHint(formatMxCurrency(maxAdvanceDeductible))}
                      </p>
                      <FieldInlineError
                        fieldId={ADVANCES_FIELD_ID}
                        message={capacityErrors.advances}
                      />
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

                  <div
                    className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 space-y-1"
                    aria-label={createCopy.summary.channelsTeachingAriaLabel}
                  >
                    <p className="text-[11px] font-medium text-muted-foreground">
                      {createCopy.summary.channelsTeachingIntro}
                    </p>
                    <ul className="text-[11px] text-muted-foreground space-y-0.5 list-none">
                      <li>{createCopy.summary.channelsTeachingExpense}</li>
                      <li>{createCopy.summary.channelsTeachingAdvance}</li>
                      <li>{createCopy.summary.channelsTeachingFixed}</li>
                    </ul>
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
                      totalReimbursements > 0 ||
                      manualSums.additions > 0) && (
                      <div className="pl-2 space-y-1 border-l border-border/60 text-muted-foreground">
                        {totalBaseSalary > 0 && (
                          <div className="flex justify-between gap-2">
                            <span>
                              {fixedSalaryPeriod && fixedSalaryPeriod !== "none"
                                ? createCopy.summary.fixedSalaryLabelWithPeriod(
                                    COMPENSATION_SALARY_PERIOD_LABELS[fixedSalaryPeriod as CompensationSalaryPeriod] ?? fixedSalaryPeriod,
                                  )
                                : createCopy.summary.fixedSalaryLabel}
                            </span>
                            <span className="tabular-nums">{formatMxCurrency(totalBaseSalary)}</span>
                          </div>
                        )}
                        {totalFixedAllowances > 0 && (
                          <div className="flex justify-between gap-2">
                            <span>
                              {fixedSalaryPeriod && fixedSalaryPeriod !== "none"
                                ? createCopy.summary.fixedAllowancesLabelWithPeriod(
                                    COMPENSATION_SALARY_PERIOD_LABELS[fixedSalaryPeriod as CompensationSalaryPeriod] ?? fixedSalaryPeriod,
                                  )
                                : createCopy.summary.fixedAllowancesLabel}
                            </span>
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
                        {manualSums.additions > 0 && (
                          <div className="flex justify-between gap-2">
                            <span>{copy.settlementFlow.create.manualAdditionsLabel}</span>
                            <span className="tabular-nums" data-testid="create-manual-additions">
                              {formatMxCurrency(manualSums.additions)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {manualSums.deductions > 0 ? (
                      <div className="flex justify-between items-center text-destructive pt-1 border-t border-dashed">
                        <span>{copy.settlementFlow.create.manualDeductionsLabel}</span>
                        <span className="tabular-nums font-semibold" data-testid="create-manual-deductions">
                          -{formatMxCurrency(manualSums.deductions)}
                        </span>
                      </div>
                    ) : null}
                    {totalTemplateDeductions > 0 || omittedTemplateLines.length > 0 ? (
                      <div className="pt-1 border-t border-dashed space-y-1">
                        <div className="flex justify-between items-center text-destructive">
                          <span>{createCopy.summary.deductionsLabel}</span>
                          <span className="tabular-nums font-semibold">
                            {totalTemplateDeductions > 0
                              ? `-${formatMxCurrency(totalTemplateDeductions)}`
                              : formatMxCurrency(0)}
                          </span>
                        </div>
                        {omittedTemplateLines.length > 0 ? (
                          <ul
                            className="pl-2 space-y-0.5 border-l border-warning/50 text-[11px] text-muted-foreground"
                            data-testid="create-template-omitted"
                          >
                            {omittedTemplateLines.map((line) => (
                              <li key={line.id}>
                                {capCopy.templateOmittedLine(
                                  line.label,
                                  formatMxCurrency(line.omittedAmount),
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ) : null}
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

                  <div className="space-y-2 border-t pt-3">
                    <ManualItemsEditor
                      idPrefix="settlement-create-item"
                      value={manualItems}
                      onChange={handleManualItemsChange}
                      errors={manualItemErrors}
                      tripOptions={(preview?.eligibleTrips ?? []).map((trip) => ({
                        tripId: trip.tripId,
                        tripCode: trip.tripCode,
                      }))}
                      disabled={createMutation.isPending}
                      stacked
                    />
                    {hasManualAdjustments ? (
                      <p className="text-[11px] text-muted-foreground" data-testid="create-manual-items-hint">
                        {copy.settlementFlow.create.manualItemsHint}
                      </p>
                    ) : null}
                    <FieldInlineError
                      fieldId={MANUAL_ITEMS_FIELD_ID}
                      message={capacityErrors.manualItems}
                    />
                    <FormValidationSummary
                      messages={[...manualItemsSummary, ...capacityMessages]}
                      title={copy.settlementFlow.sheet.validationTitle}
                      className="mb-0"
                    />
                    {capacityErrors.advances ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleFitAdvancesToMax}
                        className="h-7 w-full text-xs"
                      >
                        {capCopy.fitMaxAction}
                      </Button>
                    ) : null}
                  </div>

                  <div className="space-y-2 pt-1">
                    {hasSettlementContent ? (
                      <>
                        {reimbursementError ? (
                          <ReimbursementErrorAlert
                            error={reimbursementError}
                            findExpense={findReimbursementExpense}
                          />
                        ) : null}
                        {tripConflicts ? (
                          <Alert variant="warning" data-testid="trip-in-active-settlement-alert">
                            <AlertTriangle />
                            <AlertTitle>{createCopy.conflicts.tripInActiveSettlementTitle}</AlertTitle>
                            <AlertDescription className="space-y-2">
                              <ul className="space-y-1">
                                {tripConflicts.map((conflict) => (
                                  <li key={`${conflict.tripId}-${conflict.settlementId}`}>
                                    {createCopy.conflicts.tripInActiveSettlementLinePrefix(
                                      conflict.tripCode,
                                    )}
                                    {conflict.settlementId ? (
                                      <Link
                                        to={settlementDetailPath(conflict.settlementId)}
                                        className="font-medium underline underline-offset-2"
                                      >
                                        {conflict.settlementNumber}
                                      </Link>
                                    ) : (
                                      conflict.settlementNumber
                                    )}
                                    {createCopy.conflicts.tripInActiveSettlementLineStatus(
                                      SETTLEMENT_STATUS_LABELS[conflict.status] ?? conflict.status,
                                    )}
                                  </li>
                                ))}
                              </ul>
                              <p>{createCopy.conflicts.tripInActiveSettlementHint}</p>
                            </AlertDescription>
                          </Alert>
                        ) : null}
                        {hasMissingDataGaps ? (
                          <div
                            className="rounded-lg border border-warning/30 bg-warning-soft/40 p-3 space-y-2"
                            data-testid="missing-data-gate"
                          >
                            <p className="text-xs font-medium text-foreground">
                              {createCopy.missingDataGate.alertTitle}
                            </p>
                            <p className="text-[11px] text-muted-foreground leading-snug">
                              {createCopy.missingDataGate.alertDescription(
                                missingDataTrips.length,
                              )}
                            </p>
                            <ul
                              className="text-[11px] text-foreground leading-snug space-y-0.5"
                              aria-label={createCopy.missingDataGate.tripsListAriaLabel}
                            >
                              {missingDataTrips.slice(0, MISSING_DATA_TRIPS_LISTED).map((trip) => (
                                <li key={trip.tripId}>
                                  <span className="font-mono font-medium">{trip.tripCode}</span>{" "}
                                  <span className="text-muted-foreground">
                                    {trip.requiresZeroKmAck
                                      ? createCopy.missingDataGate.missingKm
                                      : createCopy.missingDataGate.missingFreight}
                                  </span>
                                </li>
                              ))}
                              {missingDataTrips.length > MISSING_DATA_TRIPS_LISTED ? (
                                <li className="text-muted-foreground">
                                  {createCopy.missingDataGate.moreTrips(
                                    missingDataTrips.length - MISSING_DATA_TRIPS_LISTED,
                                  )}
                                </li>
                              ) : null}
                            </ul>
                            <div className="flex items-start gap-2 pt-1">
                              <Checkbox
                                id="acknowledge-missing-data"
                                checked={acknowledgeMissingDataTrips}
                                onCheckedChange={(checked) => {
                                  setAcknowledgeMissingDataTrips(checked === true);
                                  if (checked === true) setMissingDataAckErrorKey(null);
                                }}
                                {...getFieldErrorAriaProps(
                                  "acknowledge-missing-data",
                                  missingDataAckError,
                                )}
                              />
                              <Label
                                htmlFor="acknowledge-missing-data"
                                className="text-xs font-normal leading-snug cursor-pointer"
                              >
                                {createCopy.missingDataGate.ackLabel(missingDataTrips.length)}
                              </Label>
                            </div>
                            <FieldInlineError
                              fieldId="acknowledge-missing-data"
                              message={missingDataAckError}
                            />
                          </div>
                        ) : null}
                        {createCta !== "guardar_borrador" ? (
                          <>
                            <Button
                              className="w-full"
                              disabled={
                                createMutation.isPending || !canSubmitForApproval
                              }
                              onClick={requestSubmitForApproval}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              {createCopy.summary.submitApprovalBtn}
                            </Button>
                            {hasMissingDataGaps && !acknowledgeMissingDataTrips ? (
                              <p className="text-[11px] text-center text-warning leading-snug px-1">
                                {createCopy.missingDataGate.submitBlockedHint}
                              </p>
                            ) : (
                              <p className="text-[11px] text-center text-muted-foreground leading-snug px-1">
                                {canSelfApproveOwnCut
                                  ? createCopy.summary.submitApprovalSegregationHintSingle
                                  : createCopy.summary.submitApprovalSegregationHint}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-[11px] text-center text-muted-foreground leading-snug px-1">
                            {thresholdMxn === null
                              ? canSelfDisburseOwnCut
                                ? createCopy.summary.bypassDraftHintNoAmountSingle
                                : createCopy.summary.bypassDraftHintNoAmount
                              : canSelfDisburseOwnCut
                                ? createCopy.summary.bypassDraftHintSingle(
                                    formatMxCurrency(thresholdMxn),
                                  )
                                : createCopy.summary.bypassDraftHint(
                                    formatMxCurrency(thresholdMxn),
                                  )}
                          </p>
                        )}
                        <Button
                          variant={
                            createCta === "guardar_borrador"
                              ? "default"
                              : "secondary"
                          }
                          className="w-full"
                          disabled={
                            createMutation.isPending || !canProceedWithSave || isPeriodBlocked
                          }
                          onClick={() => handleSave(false)}
                        >
                          {createCopy.summary.saveDraftBtn}
                        </Button>
                        {isPeriodBlocked ? (
                          <p className="text-[11px] text-center text-warning leading-snug px-1">
                            {hasUsableSuggestedStart
                              ? createCopy.periodicBlock.submitBlockedHint
                              : createCopy.periodicBlock.submitBlockedHintNoSuggestion}
                          </p>
                        ) : null}
                        {showCommercialFreightHint ? (
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
                      onClick={() => navigate(backHref)}
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
            title={missingSchemeCopy.title}
            description={missingSchemeCopy.description}
            cta={{
              label: createCopy.empty.configureCompensationAction,
              onClick: () =>
                navigate(
                  settlementsAgreementsPath({
                    employeeId: selectedEmployeeId,
                    periodStart,
                    periodEnd,
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

      <Dialog
        open={noRuleDialog !== null}
        onOpenChange={(open) => {
          if (!open && !createMutation.isPending) setNoRuleDialog(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              {createCopy.noRuleGate.dialogTitle}
            </DialogTitle>
            <DialogDescription>
              {createCopy.noRuleGate.dialogDescription(noRuleDialog?.tripCodes.length ?? 0)}
            </DialogDescription>
          </DialogHeader>
          <ul className="rounded-lg border bg-muted/30 p-3 text-xs font-mono space-y-1">
            {(noRuleDialog?.tripCodes ?? []).map((tripCode) => (
              <li key={tripCode}>{tripCode}</li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">{createCopy.noRuleGate.fixHint}</p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              disabled={createMutation.isPending}
              onClick={() => setNoRuleDialog(null)}
            >
              {createCopy.noRuleGate.cancelAction}
            </Button>
            <Button disabled={createMutation.isPending} onClick={handleConfirmNoRuleTrips}>
              {createCopy.noRuleGate.confirmAction}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              {createCopy.dialog.voboTitle}
            </DialogTitle>
            <DialogDescription>
              {createCopy.dialog.voboDescription}
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
            {hasManualAdjustments ? (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">
                  {copy.settlementFlow.create.manualItemsLabel}
                </span>
                <span className="text-xs font-medium text-foreground tabular-nums">
                  {manualSums.additions > 0 ? `+${formatMxCurrency(manualSums.additions)}` : ""}
                  {manualSums.additions > 0 && manualSums.deductions > 0 ? " · " : ""}
                  {manualSums.deductions > 0 ? `−${formatMxCurrency(manualSums.deductions)}` : ""}
                </span>
              </div>
            ) : null}
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
