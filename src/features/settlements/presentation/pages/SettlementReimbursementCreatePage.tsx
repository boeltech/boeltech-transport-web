import { useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AlertTriangle, Banknote, Check, Receipt, Send, User, Wallet } from "lucide-react";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import { Button } from "@shared/ui/button";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { FieldInlineError, FormValidationSummary } from "@shared/ui/form";
import { Skeleton } from "@shared/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { EmptyState } from "@shared/ui/feedback-states";
import { useToast } from "@shared/hooks";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { useEmployeeBasic } from "@features/employees/application";
import { resolveSelfActionUi } from "@features/approvals/domain";
import { useSelfApprovalPolicy } from "@features/approvals/application";
import {
  useCreateReimbursementSettlement,
  useReimbursementSettlementPreview,
  useSettlementDetail,
  useSettlementSettings,
} from "../../application/hooks";
import {
  SETTLEMENTS_LIST_PATH,
  settlementCreatePath,
  settlementDetailPath,
} from "../../application/settlementsRoutes";
import {
  assessDeductionCapacity,
  computeSettlementTotals,
  normalizeManualItems,
  roundCents,
  sumManualItems,
  type ManualSettlementItemInput,
} from "../../domain/settlementTotals";
import { DEFAULT_VOBO_THRESHOLD_MXN } from "../../domain/enums";
import { settlementsCopy } from "../copy/settlementsCopy";
import { customSettlementItemInputSchema } from "../validation/settlementSchemas";
import { ManualItemsEditor } from "../components/ManualItemsEditor";
import { OpenAdvancesDeductionCard } from "../components/OpenAdvancesDeductionCard";
import { ReimbursementErrorAlert } from "../components/ReimbursementErrorAlert";
import { ReimbursementLinesTable } from "../components/ReimbursementLinesTable";
import { ReimbursementsPayeeCard } from "../components/ReimbursementsPayeeCard";
import {
  manualItemErrorsFromIssues,
  type ManualItemRow,
  type ManualItemRowErrors,
} from "../utils/manualItemRows";
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
import { resolveCreateCta, resolveCreateSettlementFeedback } from "../utils/settlementCta";
import {
  parseReimbursementCreateError,
  type ReimbursementCreateError,
} from "../utils/settlementCreateConflicts";
import {
  resolveSettlementBackHref,
  resolveSettlementWayfindingBackLabel,
} from "../utils/settlementWayfinding";

const copy = settlementsCopy;
const createCopy = settlementsCopy.createPage;
const pageCopy = settlementsCopy.reimbursements.createPage;
const ADVANCES_FIELD_ID = "settlement-reimbursement-advances";
const MANUAL_ITEMS_FIELD_ID = "settlement-reimbursement-manual-items";

/** E11-F3 (handoff 04 §B.3): pago solo de reembolsos; sin viajes, sueldo ni período. */
export function SettlementReimbursementCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const employeeId = searchParams.get("employeeId") || "";
  const fromSettlementId = searchParams.get("from") || "";
  const fromState = location.state?.from as string | undefined;

  const { data: fromSettlement } = useSettlementDetail(fromSettlementId);
  const queueHref = resolveSettlementBackHref(fromState);
  const backHref = fromSettlementId ? settlementDetailPath(fromSettlementId) : queueHref;
  const backLabel = fromSettlementId
    ? fromSettlement
      ? pageCopy.backToFolio(fromSettlement.settlementNumber)
      : pageCopy.backToFolioFallback
    : queueHref === SETTLEMENTS_LIST_PATH
      ? pageCopy.backToPending
      : resolveSettlementWayfindingBackLabel(queueHref);

  const createMutation = useCreateReimbursementSettlement();
  const { data: settings, isError: settingsError } = useSettlementSettings();
  const thresholdMxn = settings ? settings.voboThresholdMxn : DEFAULT_VOBO_THRESHOLD_MXN;
  const { data: selfApprovalPolicy } = useSelfApprovalPolicy();
  const canSelfApproveOwnCut =
    resolveSelfActionUi({ isOwn: true, policy: selfApprovalPolicy?.settlementApprove }) ===
    "self_confirm";
  const canSelfDisburseOwnCut =
    resolveSelfActionUi({ isOwn: true, policy: selfApprovalPolicy?.settlementDisburse }) ===
    "self_confirm";

  const {
    data: preview,
    isLoading: isPreviewLoading,
    isError: isPreviewError,
    error: previewError,
    refetch: refetchPreview,
  } = useReimbursementSettlementPreview(employeeId || null);
  const { data: employeeBasic } = useEmployeeBasic(employeeId, Boolean(employeeId));
  const operatorName =
    employeeBasic != null
      ? `${employeeBasic.firstName} ${employeeBasic.lastName}`.trim()
      : preview?.employeeName ?? "";

  const [advanceDeductions, setAdvanceDeductions] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [manualItems, setManualItems] = useState<ManualItemRow[]>([]);
  const [manualItemErrors, setManualItemErrors] = useState<ManualItemRowErrors[]>([]);
  const [manualItemsSummary, setManualItemsSummary] = useState<string[]>([]);
  const [serverCapacityErrors, setServerCapacityErrors] = useState<{
    key: string;
    errors: DeductionCapacityErrors;
  } | null>(null);
  const [confirmedIds, setConfirmedIds] = useState<ReadonlySet<string>>(new Set());
  const [requiresExpensesError, setRequiresExpensesError] = useState(false);
  const [reimbursementError, setReimbursementError] = useState<ReimbursementCreateError | null>(
    null,
  );
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const readyLines = preview?.reimbursements ?? [];
  const payeeLines = preview?.reimbursementsRequiringPayee ?? [];
  const confirmedLines = payeeLines.filter((line) => confirmedIds.has(line.tripExpenseId));
  const readyTotal = roundCents(readyLines.reduce((sum, line) => sum + line.amount, 0));
  const confirmedTotal = roundCents(confirmedLines.reduce((sum, line) => sum + line.amount, 0));
  const totalReimbursements = roundCents(readyTotal + confirmedTotal);
  const hasSelectedReimbursements = readyLines.length + confirmedLines.length > 0;
  const openAdvances = preview?.openAdvances ?? [];
  const tripOptions = Array.from(
    new Map(
      [...readyLines, ...confirmedLines].map((line) => [
        line.tripId,
        { tripId: line.tripId, tripCode: line.tripCode },
      ]),
    ).values(),
  );

  const totalAdvancesDeducted = roundCents(
    Object.values(advanceDeductions).reduce((acc, val) => acc + val, 0),
  );
  const selectedAdvancesCount = Object.values(advanceDeductions).filter((v) => v > 0).length;
  const liveManual = normalizeManualItems(liveManualItems(manualItems));
  const manualSums = sumManualItems(liveManual);
  const calculatedBase = {
    calculatedGross: totalReimbursements,
    templateDeductions: 0,
    advancesDeducted: totalAdvancesDeducted,
  };
  const { netAmount } = computeSettlementTotals(calculatedBase, liveManual);
  const capacity = assessDeductionCapacity(calculatedBase, liveManual);
  const maxAdvanceDeductible = capacity.maxAdvanceDeductible;
  const capacityInputsKey = JSON.stringify([advanceDeductions, manualItems, [...confirmedIds]]);
  const capacityErrors: DeductionCapacityErrors =
    serverCapacityErrors && serverCapacityErrors.key === capacityInputsKey
      ? serverCapacityErrors.errors
      : deductionCapacityErrors(capacity);
  const capacityMessages = [capacityErrors.advances, capacityErrors.manualItems].filter(
    (message): message is string => Boolean(message),
  );
  const hasCapacityError = capacityMessages.length > 0;
  const hasManualAdjustments = manualItems.length > 0;
  const createCta = resolveCreateCta({ netAmount, hasManualAdjustments, thresholdMxn });

  const reimbursementRowErrors: Record<string, string> = {};
  if (reimbursementError?.kind === "payee_not_trip_driver") {
    reimbursementRowErrors[reimbursementError.tripExpenseId] =
      copy.reimbursements.errors.payeeNotDriverRow;
  } else if (reimbursementError?.kind === "not_eligible") {
    reimbursementRowErrors[reimbursementError.tripExpenseId] =
      copy.reimbursements.errors.notEligibleRow;
  }
  const findExpense = (tripExpenseId: string) =>
    [...readyLines, ...payeeLines].find((line) => line.tripExpenseId === tripExpenseId);
  const requiresExpensesMessage =
    requiresExpensesError && !hasSelectedReimbursements ? pageCopy.requiresExpensesError : undefined;

  const handleTogglePayee = (tripExpenseId: string, checked: boolean) => {
    setConfirmedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(tripExpenseId);
      else next.delete(tripExpenseId);
      return next;
    });
  };

  const advancesForAllocation = (advanceIds?: ReadonlySet<string>) =>
    openAdvances
      .filter((adv) => !advanceIds || advanceIds.has(adv.advanceId))
      .map((adv) => ({
        advanceId: adv.advanceId,
        available: deductableAdvanceBalance(adv),
        disbursedAt: adv.disbursedAt,
      }));

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
    setAdvanceDeductions((prev) => ({ ...prev, [advanceId]: validAmount }));
  };

  const handleFitAdvancesToMax = () => {
    const selected = new Set(Object.keys(advanceDeductions));
    setAdvanceDeductions(allocateAdvancesFifo(advancesForAllocation(selected), maxAdvanceDeductible));
  };

  const handleManualItemsChange = (rows: ManualItemRow[]) => {
    setManualItems(rows);
    if (manualItemErrors.length > 0 || manualItemsSummary.length > 0) {
      setManualItemErrors([]);
      setManualItemsSummary([]);
    }
  };

  const validateManualItems = (): ManualSettlementItemInput[] | null => {
    const result = customSettlementItemInputSchema.array().safeParse(manualItems);
    if (result.success) {
      setManualItemErrors([]);
      setManualItemsSummary([]);
      // Un viaje cuyo gasto se desmarcó ya no pertenece al pago.
      const tripIds = new Set(tripOptions.map((trip) => trip.tripId));
      return result.data.map((item) => ({
        itemType: item.itemType,
        description: item.description,
        amount: item.amount,
        ...(item.isDeduction !== undefined ? { isDeduction: item.isDeduction } : {}),
        ...(item.tripId && tripIds.has(item.tripId) ? { tripId: item.tripId } : {}),
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

  /** Reglas locales previas al envío; false = hay errores visibles. */
  const validateBeforeSave = (): ManualSettlementItemInput[] | null => {
    const customItems = validateManualItems();
    if (!hasSelectedReimbursements) {
      setRequiresExpensesError(true);
      return null;
    }
    if (hasCapacityError || !customItems) return null;
    return customItems;
  };

  const requestSubmitForApproval = () => {
    if (validateBeforeSave() === null) return;
    setConfirmDialogOpen(true);
  };

  const handleSave = async (submitForApproval: boolean) => {
    const customItems = validateBeforeSave();
    if (!employeeId || customItems === null) {
      setConfirmDialogOpen(false);
      return;
    }

    const balances = new Map(openAdvances.map((adv) => [adv.advanceId, deductableAdvanceBalance(adv)]));
    const advancesToApply = Object.entries(advanceDeductions)
      .filter(([advanceId, amount]) => balances.has(advanceId) && amount > 0)
      .map(([advanceId, amount]) => ({
        advanceId,
        amountToDeduct: Math.min(amount, balances.get(advanceId) ?? amount),
      }));

    try {
      const result = await createMutation.mutateAsync({
        employeeId,
        confirmedReimbursementExpenseIds: confirmedLines.map((line) => line.tripExpenseId),
        advancesToApply,
        customItems,
        notes: notes || undefined,
        submitForApproval,
      });
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
        description: degradedToDraft ? createCopy.toasts.submitDegradedToDraftHint : undefined,
        variant: degradedToDraft ? "default" : "success",
      });
      setConfirmDialogOpen(false);
      navigate(settlementDetailPath(result.id), { state: { from: queueHref } });
    } catch (error) {
      setConfirmDialogOpen(false);
      const exceedsGross = parseDeductionsExceedGrossError(error);
      if (exceedsGross) {
        setServerCapacityErrors({
          key: capacityInputsKey,
          errors: deductionsExceedErrorsFromServer(exceedsGross, { useServerMessage: false }),
        });
        return;
      }
      const reimbursementFailure = parseReimbursementCreateError(error);
      if (reimbursementFailure) {
        setReimbursementError(reimbursementFailure);
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

  const tripLinkFrom = settlementCreatePath({
    kind: "reimbursements",
    employeeId,
    ...(fromSettlementId ? { from: fromSettlementId } : {}),
  });

  const renderBody = () => {
    if (!employeeId) {
      return (
        <EmptyState
          icon={<User className="h-8 w-8 text-muted-foreground" />}
          title={pageCopy.noEmployeeTitle}
          cta={{ label: pageCopy.noEmployeeAction, onClick: () => navigate(SETTLEMENTS_LIST_PATH) }}
        />
      );
    }
    if (isPreviewLoading) {
      return (
        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          data-testid="settlement-reimbursement-calculating"
          aria-busy="true"
          aria-live="polite"
        >
          <span className="sr-only">{pageCopy.loadingTitle}</span>
          <div className="lg:col-span-8 space-y-4">
            <Skeleton className="h-10 w-56" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="lg:col-span-4 space-y-3">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      );
    }
    if (isPreviewError || !preview) {
      return (
        <EmptyState
          icon={<AlertTriangle className="h-8 w-8 text-destructive" />}
          title={createCopy.empty.previewErrorTitle}
          description={getErrorMessage(previewError)}
        />
      );
    }
    if (readyLines.length === 0 && payeeLines.length === 0) {
      return (
        <div className="space-y-4">
          {reimbursementError ? (
            <ReimbursementErrorAlert error={reimbursementError} findExpense={findExpense} />
          ) : null}
          <EmptyState
            icon={<Receipt className="h-8 w-8 text-muted-foreground" />}
            title={pageCopy.emptyTitle}
            description={pageCopy.emptyDescription}
            cta={{ label: pageCopy.emptyAction, onClick: () => navigate(backHref) }}
          />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-border shadow-xs">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground">{pageCopy.operatorLabel}</p>
              <p className="text-sm font-semibold text-foreground" data-testid="reimbursement-operator">
                {operatorName || "—"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs" data-testid="reimbursements-ready-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                {pageCopy.readyTitle(readyLines.length)}
              </CardTitle>
              <CardDescription>{pageCopy.readyDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              {readyLines.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground border rounded-lg bg-muted/20">
                  {pageCopy.readyEmpty}
                </div>
              ) : (
                <ReimbursementLinesTable
                  lines={readyLines}
                  ariaLabel={pageCopy.readyTitle(readyLines.length)}
                  showTotal
                  tripLinkFrom={tripLinkFrom}
                />
              )}
            </CardContent>
          </Card>

          {payeeLines.length > 0 ? (
            <ReimbursementsPayeeCard
              lines={payeeLines}
              operatorName={operatorName}
              selectedIds={confirmedIds}
              onToggle={handleTogglePayee}
              rowErrors={reimbursementRowErrors}
              error={requiresExpensesMessage}
              titlePrefix={pageCopy.payeePrefix}
              disabled={createMutation.isPending}
              tripLinkFrom={tripLinkFrom}
            />
          ) : null}

          <OpenAdvancesDeductionCard
            title={pageCopy.advancesTitle(openAdvances.length)}
            advances={openAdvances}
            deductions={advanceDeductions}
            maxDeductible={maxAdvanceDeductible}
            fieldId={ADVANCES_FIELD_ID}
            error={capacityErrors.advances}
            onToggle={handleAdvanceToggle}
            onAmountChange={handleAdvanceAmountChange}
            onSelectAll={() =>
              setAdvanceDeductions(allocateAdvancesFifo(advancesForAllocation(), maxAdvanceDeductible))
            }
            onClearAll={() => setAdvanceDeductions({})}
          />

          <div className="space-y-2">
            <Label htmlFor="settlement-reimbursement-notes" className="text-xs font-medium">
              {pageCopy.notesTitle}
            </Label>
            <Textarea
              id="settlement-reimbursement-notes"
              rows={3}
              placeholder={createCopy.sections.notesPlaceholder}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
          <Card className="border-primary/20 bg-card shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                {createCopy.summary.cardTitle}
              </CardTitle>
              <CardDescription className="text-xs">{createCopy.summary.cardSubtitle}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-sm">
              <div className="bg-primary/5 -mx-4 px-4 py-3 border-b border-primary/10">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                    {createCopy.summary.netTotalLabel}
                  </span>
                  <span
                    className="text-2xl font-extrabold font-mono text-foreground tabular-nums"
                    data-testid="reimbursement-net-amount"
                  >
                    {formatMxCurrency(netAmount)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{createCopy.summary.reimbursementsLabel}</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatMxCurrency(totalReimbursements)}
                  </span>
                </div>
                {manualSums.additions > 0 ? (
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>{copy.settlementFlow.create.manualAdditionsLabel}</span>
                    <span className="tabular-nums">{formatMxCurrency(manualSums.additions)}</span>
                  </div>
                ) : null}
                {manualSums.deductions > 0 ? (
                  <div className="flex justify-between items-center text-destructive pt-1 border-t border-dashed">
                    <span>{copy.settlementFlow.create.manualDeductionsLabel}</span>
                    <span className="tabular-nums font-semibold">
                      -{formatMxCurrency(manualSums.deductions)}
                    </span>
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
                  idPrefix="settlement-reimbursement-item"
                  value={manualItems}
                  onChange={handleManualItemsChange}
                  errors={manualItemErrors}
                  tripOptions={tripOptions}
                  disabled={createMutation.isPending}
                  stacked
                />
                <FieldInlineError fieldId={MANUAL_ITEMS_FIELD_ID} message={capacityErrors.manualItems} />
                <FormValidationSummary
                  messages={[
                    ...(requiresExpensesMessage ? [requiresExpensesMessage] : []),
                    ...manualItemsSummary,
                    ...capacityMessages,
                  ]}
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
                    {settlementsCopy.settlementFlow.deductionsCap.fitMaxAction}
                  </Button>
                ) : null}
              </div>

              <div className="space-y-2 pt-1">
                {reimbursementError ? (
                  <ReimbursementErrorAlert error={reimbursementError} findExpense={findExpense} />
                ) : null}
                {createCta !== "guardar_borrador" ? (
                  <Button
                    className="w-full"
                    disabled={createMutation.isPending}
                    onClick={requestSubmitForApproval}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {createCopy.summary.submitApprovalBtn}
                  </Button>
                ) : null}
                <Button
                  variant={createCta === "guardar_borrador" ? "default" : "secondary"}
                  className="w-full"
                  disabled={createMutation.isPending}
                  onClick={() => void handleSave(false)}
                >
                  {createCopy.summary.saveDraftBtn}
                </Button>
                <p
                  className={
                    settingsError
                      ? "text-xs text-center text-destructive leading-snug px-1"
                      : "text-xs text-center text-muted-foreground leading-snug px-1"
                  }
                  data-testid="settlement-reimbursement-cta-hint"
                >
                  {settingsError
                    ? copy.toasts.settingsUnavailable
                    : createCta !== "guardar_borrador"
                      ? canSelfApproveOwnCut
                        ? createCopy.summary.submitApprovalSegregationHintSingle
                        : createCopy.summary.submitApprovalSegregationHint
                      : thresholdMxn === null
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
    );
  };

  return (
    <FormPageShell
      isLoading={false}
      header={{
        backHref,
        backLabel,
        icon: <Banknote className="h-5 w-5" />,
        title: pageCopy.title,
        subtitle: pageCopy.subtitle,
      }}
    >
      {renderBody()}

      <Dialog
        open={confirmDialogOpen}
        onOpenChange={(open) => {
          if (!createMutation.isPending) setConfirmDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              {createCopy.dialog.voboTitle}
            </DialogTitle>
            <DialogDescription>{createCopy.dialog.voboDescription}</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/30 p-3.5 space-y-2.5 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-xs">{createCopy.dialog.driverLabel}</span>
              <span className="font-semibold text-foreground text-xs">{operatorName || "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-xs">{pageCopy.dialogKindLabel}</span>
              <span className="text-xs font-medium text-foreground">
                {copy.reimbursements.kindLabel}
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
            <div className="border-t pt-2.5 flex justify-between items-center font-bold text-foreground text-base">
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
            <Button disabled={createMutation.isPending} onClick={() => void handleSave(true)}>
              <Check className="mr-2 h-4 w-4" />
              {createMutation.isPending ? "Enviando..." : createCopy.dialog.confirmAction}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FormPageShell>
  );
}
