import { useMemo, useState } from "react";
import {
  Eye,
  Check,
  CheckCircle,
  Banknote,
  XCircle,
  MoreHorizontal,
  ExternalLink,
  Send,
  Pencil,
  Undo2,
  History,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
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
import { usePermissions } from "@shared/permissions";
import { useAuth } from "@features/auth";
import { useToast } from "@shared/hooks";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import {
  getApprovalGuardCode,
  isIntermediateStep,
  resolveApprovalActionUi,
} from "@features/approvals/domain";
import {
  useSelfActionForbiddenHandler,
  useSelfApprovalPolicy,
} from "@features/approvals/application";
import {
  approvalActionStateLabel,
  approvalsCopy,
  formatNextStepLabel,
  guardErrorMessage,
} from "@features/approvals/presentation";
import {
  ApprovalActionStateChip,
  ApprovalHistorySheet,
  DecisionReasonSheet,
  OwnRequestChip,
  OwnRequestMenuItem,
  ReapprovalConfirmNote,
  SelfApprovalConfirmDialog,
  type DecisionReasonInput,
  type DecisionReasonMode,
} from "@features/approvals/presentation/components";
import type { DriverSettlement } from "../../domain/entities";
import {
  invalidateSettlementQueries,
  useApproveSettlement,
  useRejectSettlement,
  useReturnSettlement,
  useSubmitSettlement,
} from "../../application/hooks/useSettlements";
import { useSettlementSettings } from "../../application/hooks/useSettlementSettings";
import { settlementsCompensationApprovalsPath } from "../config/settlementWorkbenchConfig";
import { settlementsCopy } from "../copy/settlementsCopy";
import { DisburseSettlementDialog } from "./DisburseSettlementDialog";
import { SettlementCancelDialog } from "./SettlementCancelDialog";
import { MissingDataAckGate } from "./MissingDataAckGate";
import {
  canDisburse,
  canSubmitVobo,
  isSettlementAwaitingDisbursement,
  isSettlementMaker,
  resolveSettlementDisburseUi,
} from "../utils/settlementCta";
import {
  isSettlementCorrectable,
  isSettlementReturned,
  settlementGuards,
} from "../utils/settlementEditing";
import { isDeductionsExceedGrossError } from "../utils/settlementDeductionCapacity";
import { settlementToApprovableItem } from "../utils/settlementApprovableItem";
import { isMissingDataAckRequiredError } from "../utils/settlementCreateConflicts";
import { missingDataGapsFromItems } from "../utils/missingDataGapsFromItems";

const copy = settlementsCopy;
const flowCopy = settlementsCopy.settlementFlow;
const missingDataGateCopy = settlementsCopy.createPage.missingDataGate;

interface SettlementActionsProps {
  settlement: DriverSettlement;
  /** Requerido en dropdown; omitible en detail (variant buttons). */
  onView?: (id: string) => void;
  onDisburse?: (settlement: DriverSettlement) => void;
  onActionComplete?: () => void;
  /** Oculta approve/reject inline y muestra link a bandeja central (D6). */
  approvalLinkOnly?: boolean;
  variant?: "dropdown" | "buttons";
  /** D21: abre el Sheet «Corregir pago» (solo en el detalle, que trae partidas). */
  onCorrect?: () => void;
}

export function SettlementActions({
  settlement,
  onView,
  onDisburse,
  onActionComplete,
  approvalLinkOnly = false,
  variant = "dropdown",
  onCorrect,
}: SettlementActionsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission("settlements", "update");
  const canExecute = hasPermission("settlements", "execute");
  const canReadApprovals = hasPermission("finance_approvals", "read");
  const { isError: settingsError } = useSettlementSettings();
  const { data: selfApprovalPolicy } = useSelfApprovalPolicy();
  const handleSelfActionForbidden = useSelfActionForbiddenHandler();

  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [stepConfirmOpen, setStepConfirmOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [reasonMode, setReasonMode] = useState<DecisionReasonMode | null>(null);
  const [disburseDialogOpen, setDisburseDialogOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [acknowledgeMissingData, setAcknowledgeMissingData] = useState(false);
  const [missingDataAckError, setMissingDataAckError] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);

  const submitMutation = useSubmitSettlement();
  const approveMutation = useApproveSettlement();
  const rejectMutation = useRejectSettlement();
  const returnMutation = useReturnSettlement();
  const isDeciding = rejectMutation.isPending || returnMutation.isPending;

  const isPendingApproval = settlement.status === "pending_approval";
  const isDraft = settlement.status === "draft";
  const isApproved = settlement.status === "approved";
  const isReturned = isSettlementReturned(settlement);
  const missingDataGaps = useMemo(
    () => missingDataGapsFromItems(settlement.items),
    [settlement.items],
  );
  const hasMissingDataGaps = missingDataGaps.length > 0;
  const isOwn = isSettlementMaker(settlement, user?.id);
  // ADR-0099: una sola función decide la acción (con o sin bloque `approval`).
  const approvalUi = resolveApprovalActionUi(settlement.approval, {
    isOwn,
    selfPolicy: selfApprovalPolicy?.settlementApprove,
    canDecide: canUpdate,
    isPending: isPendingApproval,
    userId: user?.id,
  });
  const approvalStateLabel = approvalActionStateLabel(approvalUi);
  const isSelfApprove = approvalUi.kind === "act" && approvalUi.selfConfirm;
  const disburseUi = resolveSettlementDisburseUi(
    settlement,
    user?.id,
    selfApprovalPolicy,
  );
  const isSelfDisburse = disburseUi === "self_confirm";
  const step = isIntermediateStep(settlement.approval)
    ? {
        current: settlement.approval.stepCurrent,
        total: settlement.approval.stepsTotal,
        nextRole: formatNextStepLabel(settlement.approval),
      }
    : null;

  const canSubmit = canSubmitVobo({ settlement, canUpdate });
  // Sin dispersar: el API anula la autorización vigente y libera anticipos.
  const canCancel = canUpdate && (isDraft || isPendingApproval || isApproved);
  const canDecideNow = canUpdate && isPendingApproval;
  const canApprove = canDecideNow && approvalUi.kind === "act";
  const canReject = canApprove;
  const canDisburseAction = canDisburse({
    settlement,
    canExecute,
    selfActionUi: disburseUi,
  });
  const showOwnApproveBlocked = canDecideNow && approvalUi.kind === "own_blocked";
  const showApprovalStateChip =
    canDecideNow &&
    (approvalUi.kind === "already_signed" ||
      approvalUi.kind === "waiting" ||
      approvalUi.kind === "no_active_eligible");
  const showOwnDisburseBlocked =
    disburseUi === "blocked_own" &&
    canExecute &&
    isSettlementAwaitingDisbursement(settlement);
  const showAwaitingTreasuryHint =
    !canExecute && isSettlementAwaitingDisbursement(settlement);
  const canCorrect =
    Boolean(onCorrect) &&
    canUpdate &&
    isSettlementCorrectable(settlement.status) &&
    !isReturned;
  const canOpenHistory = canReadApprovals && settlement.approval != null;
  // Aviso informativo del umbral; no bloquea CTAs — el API es la autoridad.
  const showSettingsUnavailable =
    settingsError &&
    (canUpdate || canExecute) &&
    (isDraft || isPendingApproval || isApproved);
  const submitLabel = isReturned
    ? flowCopy.returnedAlert.resubmitUnchanged
    : copy.actions.sendToApproval;

  const describeActionError = (error: unknown) => {
    const forbidden = handleSelfActionForbidden(error);
    return forbidden
      ? (forbidden.message ?? approvalsCopy.selfApproval.serverRejected)
      : getErrorMessage(error);
  };

  /** 422 de tope de descuentos: el texto del API dice qué corregir (y si hay que volver a borrador). */
  const handleDeductionsExceedError = (error: unknown, close?: () => void): boolean => {
    if (!isDeductionsExceedGrossError(error)) return false;
    close?.();
    toast({
      title: flowCopy.deductionsCap.actionErrorTitle,
      description: getErrorMessage(error),
      variant: "error",
    });
    return true;
  };

  /** Handoff F6 §6: una guarda cierra, avisa y recarga; nunca se reintenta. */
  const handleGuardError = (error: unknown, close: () => void): boolean => {
    const guard = getApprovalGuardCode(error);
    if (!guard) return false;
    close();
    invalidateSettlementQueries(queryClient, settlement.id);
    toast({ title: guardErrorMessage(guard), variant: "warning" });
    return true;
  };

  const resetMissingDataAck = () => {
    setAcknowledgeMissingData(false);
    setMissingDataAckError(false);
  };

  const runSubmit = async () => {
    try {
      const vars =
        hasMissingDataGaps && acknowledgeMissingData
          ? {
              id: settlement.id,
              acknowledgeZeroKmTrips: true,
              acknowledgeZeroFreightTrips: true,
            }
          : settlement.id;
      await submitMutation.mutateAsync(vars);
      setSubmitConfirmOpen(false);
      resetMissingDataAck();
      toast({
        title: isReturned ? flowCopy.toasts.resubmitted : copy.toasts.submitSettlementSuccess,
        variant: "success",
      });
      onActionComplete?.();
    } catch (error) {
      if (isMissingDataAckRequiredError(error)) {
        setAcknowledgeMissingData(false);
        setMissingDataAckError(true);
        toast({
          title: copy.toasts.submitSettlementError,
          description: missingDataGateCopy.serverAckRequired,
          variant: "error",
        });
        return;
      }
      if (handleDeductionsExceedError(error)) return;
      toast({
        title: copy.toasts.submitSettlementError,
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleSubmit = () => {
    if (hasMissingDataGaps && !acknowledgeMissingData) {
      if (variant === "dropdown") {
        setSubmitConfirmOpen(true);
        return;
      }
      setMissingDataAckError(true);
      return;
    }
    void runSubmit();
  };

  const handleApprove = async () => {
    const closeAll = () => {
      setApproveDialogOpen(false);
      setStepConfirmOpen(false);
    };
    try {
      const guards = settlementGuards(settlement);
      const result = await approveMutation.mutateAsync(
        guards ? { id: settlement.id, guards } : settlement.id,
      );
      toast({
        title:
          result?.outcome === "step_signed" && step
            ? approvalsCopy.flow.stepSignedToast(step.current, step.total, step.nextRole)
            : copy.toasts.approveSettlementSuccess,
        variant: "success",
      });
      closeAll();
      onActionComplete?.();
    } catch (error) {
      if (handleGuardError(error, closeAll)) return;
      if (handleDeductionsExceedError(error, closeAll)) return;
      toast({
        title: copy.toasts.approveSettlementError,
        description: describeActionError(error),
        variant: "destructive",
      });
    }
  };

  const requestApprove = () => {
    if (!isSelfApprove && step) {
      setStepConfirmOpen(true);
      return;
    }
    setApproveDialogOpen(true);
  };

  const closeReasonSheet = () => setReasonMode(null);

  const handleReasonSubmit = async (input: DecisionReasonInput) => {
    const mode = reasonMode;
    if (!mode) return;
    const guards = settlementGuards(settlement);
    try {
      if (mode === "return") {
        await returnMutation.mutateAsync({
          id: settlement.id,
          reason: input.reason,
          reasonCode: input.reasonCode ?? "other",
          guards,
        });
        toast({ title: flowCopy.toasts.returned, variant: "success" });
      } else {
        await rejectMutation.mutateAsync({ id: settlement.id, reason: input.reason, guards });
        toast({ title: copy.toasts.rejectSettlementSuccess, variant: "default" });
      }
      closeReasonSheet();
      onActionComplete?.();
    } catch (error) {
      if (handleGuardError(error, closeReasonSheet)) return;
      toast({
        title: mode === "return" ? flowCopy.toasts.returnError : copy.toasts.rejectSettlementError,
        description: describeActionError(error),
        variant: "destructive",
      });
    }
  };

  // La autoacción usa el diálogo propio para mostrar el aviso explícito.
  const usesOwnDisburseDialog = !onDisburse || isSelfDisburse;

  const openDisburse = () => {
    if (!usesOwnDisburseDialog && onDisburse) {
      onDisburse(settlement);
      return;
    }
    setDisburseDialogOpen(true);
  };

  const dialogs = (
    <>
      {isSelfApprove ? (
        <SelfApprovalConfirmDialog
          open={approveDialogOpen}
          onOpenChange={setApproveDialogOpen}
          subject="settlement"
          onConfirm={handleApprove}
          isPending={approveMutation.isPending}
          note={
            <ReapprovalConfirmNote
              approval={settlement.approval}
              type="internal_staff_compensation"
            />
          }
        />
      ) : (
        <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>{copy.actionDialogs.approveSettlement.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {copy.actionDialogs.approveSettlement.descriptionPart1}{" "}
                <span className="font-semibold text-foreground">
                  {settlement.settlementNumber}
                </span>{" "}
                {copy.actionDialogs.approveSettlement.descriptionPart2}{" "}
                <span className="font-semibold text-foreground">
                  {settlement.employeeFullName ?? "—"}
                </span>{" "}
                {copy.actionDialogs.approveSettlement.descriptionPart3}{" "}
                <span className="font-bold text-primary">
                  {formatMxCurrency(settlement.netAmount)}
                </span>
                {copy.actionDialogs.approveSettlement.descriptionPart4}
                <ReapprovalConfirmNote
                  approval={settlement.approval}
                  type="internal_staff_compensation"
                />
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={approveMutation.isPending}>
                {copy.actionDialogs.approveSettlement.cancel}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {approveMutation.isPending
                  ? copy.actionDialogs.approveSettlement.pending
                  : copy.actionDialogs.approveSettlement.confirm}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <AlertDialog
        open={stepConfirmOpen}
        onOpenChange={(open) => {
          if (!open && !approveMutation.isPending) setStepConfirmOpen(false);
        }}
      >
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {approvalsCopy.flow.stepConfirmTitle(step?.current ?? 1, step?.total ?? 2)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {approvalsCopy.flow.stepConfirmBody(step?.current ?? 1, step?.total ?? 2)}
              <ReapprovalConfirmNote
                approval={settlement.approval}
                type="internal_staff_compensation"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={approveMutation.isPending}>
              {copy.actions.cancel}
            </AlertDialogCancel>
            <Button
              type="button"
              disabled={approveMutation.isPending}
              onClick={() => void handleApprove()}
            >
              {approvalsCopy.flow.stepConfirmAction}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {canCancel ? (
        <SettlementCancelDialog
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
          settlement={settlement}
          onCancelled={() => onActionComplete?.()}
        />
      ) : null}

      <DecisionReasonSheet
        mode={reasonMode ?? "reject"}
        open={reasonMode != null}
        onOpenChange={(open) => {
          if (!open && isDeciding) return;
          if (!open) closeReasonSheet();
        }}
        item={reasonMode ? settlementToApprovableItem(settlement) : null}
        isSubmitting={isDeciding}
        type="internal_staff_compensation"
        onSubmit={(input) => {
          void handleReasonSubmit(input);
        }}
      />

      {usesOwnDisburseDialog && (
        <DisburseSettlementDialog
          open={disburseDialogOpen}
          onOpenChange={setDisburseDialogOpen}
          settlement={settlement}
          onSuccess={() => onActionComplete?.()}
          selfConfirm={isSelfDisburse}
        />
      )}

      {canOpenHistory ? (
        <ApprovalHistorySheet
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          type="internal_staff_compensation"
          id={settlement.id}
          subtitle={settlement.settlementNumber}
        />
      ) : null}

      <AlertDialog
        open={submitConfirmOpen}
        onOpenChange={(open) => {
          if (!open && !submitMutation.isPending) {
            setSubmitConfirmOpen(false);
            resetMissingDataAck();
          }
        }}
      >
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{submitLabel}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <MissingDataAckGate
                  gaps={missingDataGaps}
                  acknowledged={acknowledgeMissingData}
                  onAcknowledgedChange={(value) => {
                    setAcknowledgeMissingData(value);
                    if (value) setMissingDataAckError(false);
                  }}
                  errorMessage={
                    missingDataAckError ? missingDataGateCopy.submitBlockedHint : null
                  }
                  checkboxId="acknowledge-missing-data-actions-menu"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitMutation.isPending}>
              {copy.actions.cancel}
            </AlertDialogCancel>
            <Button
              type="button"
              disabled={
                submitMutation.isPending ||
                (hasMissingDataGaps && !acknowledgeMissingData)
              }
              onClick={() => void runSubmit()}
            >
              <Send className="mr-2 h-4 w-4" />
              {submitLabel}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  if (variant === "buttons") {
    const showMoreMenu = canReject || canCancel;
    return (
      <>
        <div className="flex max-w-full flex-col items-end gap-2">
          {canSubmit && !isReturned && hasMissingDataGaps ? (
            <div className="w-full max-w-md">
              <MissingDataAckGate
                gaps={missingDataGaps}
                acknowledged={acknowledgeMissingData}
                onAcknowledgedChange={(value) => {
                  setAcknowledgeMissingData(value);
                  if (value) setMissingDataAckError(false);
                }}
                errorMessage={
                  missingDataAckError ? missingDataGateCopy.submitBlockedHint : null
                }
                checkboxId="acknowledge-missing-data-actions"
              />
            </div>
          ) : null}
          <div className="flex max-w-full flex-nowrap items-center justify-end gap-2">
          {canCorrect && (
            <Button variant="outline" onClick={onCorrect}>
              <Pencil className="mr-2 h-4 w-4" />
              {flowCopy.header.correct}
            </Button>
          )}
          {/* D15: devuelta → reenviar desde la alerta del detalle. */}
          {canSubmit && !isReturned && (
            <div className="flex flex-col items-end gap-1">
              <Button
                onClick={handleSubmit}
                disabled={
                  submitMutation.isPending ||
                  (hasMissingDataGaps && !acknowledgeMissingData)
                }
              >
                <Send className="mr-2 h-4 w-4" />
                {submitLabel}
              </Button>
              {hasMissingDataGaps && !acknowledgeMissingData ? (
                <p className="max-w-[14rem] text-[11px] leading-snug text-warning">
                  {missingDataGateCopy.submitBlockedHint}
                </p>
              ) : null}
            </div>
          )}
          {canReject && (
            <div className="flex max-w-[14rem] flex-col items-stretch gap-1 sm:max-w-none sm:flex-row sm:items-center sm:gap-2">
              <Button
                variant="outline"
                onClick={() => setReasonMode("return")}
                disabled={isDeciding}
              >
                <Undo2 className="mr-2 h-4 w-4" />
                {flowCopy.header.returnForCorrection}
              </Button>
              <p className="text-[11px] leading-snug text-muted-foreground sm:max-w-[12rem]">
                {flowCopy.returnVsRejectHint}
              </p>
            </div>
          )}
          {canApprove && (
            <Button
              onClick={requestApprove}
              disabled={approveMutation.isPending}
            >
              <Check className="mr-2 h-4 w-4 text-success" />
              {copy.actions.approve}
            </Button>
          )}
          {showApprovalStateChip && <ApprovalActionStateChip actionUi={approvalUi} />}
          {showOwnApproveBlocked && <OwnRequestChip />}
          {showOwnDisburseBlocked && <OwnRequestChip kind="disburse" />}
          {showAwaitingTreasuryHint ? (
            <p className="max-w-[14rem] text-[11px] leading-snug text-muted-foreground sm:max-w-[16rem]">
              {copy.actions.awaitingTreasuryDisburse}
            </p>
          ) : null}
          {canDisburseAction && (
            <Button onClick={openDisburse}>
              <Banknote className="mr-2 h-4 w-4" />
              {copy.actions.disburse}
            </Button>
          )}
          {showMoreMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label={flowCopy.header.moreActionsSr}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {canReject ? (
                  <DropdownMenuItem
                    onClick={() => setReasonMode("reject")}
                    disabled={isDeciding}
                    className="text-destructive focus:text-destructive"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {copy.actions.reject}
                  </DropdownMenuItem>
                ) : null}
                {canCancel ? (
                  <DropdownMenuItem
                    onClick={() => setCancelDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {copy.actions.cancelSettlement}
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {showSettingsUnavailable && (
            <span className="text-xs text-destructive px-1">
              {copy.toasts.settingsUnavailable}
            </span>
          )}
          </div>
        </div>
        {dialogs}
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{copy.actions.openActionsMenuSr}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {onView && (
            <DropdownMenuItem onClick={() => onView(settlement.id)}>
              <Eye className="mr-2 h-4 w-4" />
              {copy.actions.viewDetails}
            </DropdownMenuItem>
          )}

          {approvalLinkOnly && isPendingApproval && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={settlementsCompensationApprovalsPath()}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {settlementsCopy.workbench.actions.reviewInApprovals}
                </Link>
              </DropdownMenuItem>
            </>
          )}

          {!approvalLinkOnly && canSubmit && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
              >
                <Send className="mr-2 h-4 w-4" />
                {submitLabel}
              </DropdownMenuItem>
            </>
          )}

          {!approvalLinkOnly && canDecideNow && (
            <>
              <DropdownMenuSeparator />
              {showOwnApproveBlocked ? (
                <OwnRequestMenuItem />
              ) : canApprove ? (
                <>
                  <DropdownMenuItem
                    onClick={requestApprove}
                    disabled={approveMutation.isPending}
                    className="text-success focus:text-success"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {copy.actions.approve}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setReasonMode("return")}
                    disabled={isDeciding}
                  >
                    <Undo2 className="mr-2 h-4 w-4" />
                    {flowCopy.header.returnForCorrection}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setReasonMode("reject")}
                    disabled={isDeciding}
                    className="text-destructive focus:text-destructive"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {copy.actions.reject}
                  </DropdownMenuItem>
                </>
              ) : approvalStateLabel ? (
                <DropdownMenuItem disabled>{approvalStateLabel}</DropdownMenuItem>
              ) : null}
            </>
          )}

          {canDisburseAction && (onDisburse || variant === "dropdown") && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={openDisburse}
                className="text-primary font-medium focus:text-primary"
              >
                <Banknote className="mr-2 h-4 w-4" />
                {copy.actions.disburse}
              </DropdownMenuItem>
            </>
          )}
          {showOwnDisburseBlocked && (
            <>
              <DropdownMenuSeparator />
              <OwnRequestMenuItem kind="disburse" />
            </>
          )}
          {canOpenHistory && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setHistoryOpen(true)}>
                <History className="mr-2 h-4 w-4" />
                {flowCopy.header.menuHistory}
              </DropdownMenuItem>
            </>
          )}
          {canCancel && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setCancelDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <XCircle className="mr-2 h-4 w-4" />
                {copy.actions.cancelSettlement}
              </DropdownMenuItem>
            </>
          )}
          {showSettingsUnavailable && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled
                className="text-xs text-destructive italic cursor-not-allowed"
              >
                {copy.toasts.settingsUnavailable}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {dialogs}
    </>
  );
}
