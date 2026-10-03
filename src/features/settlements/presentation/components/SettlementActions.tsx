import { useState } from "react";
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
  ApprovalActionStateChip,
  ApprovalHistorySheet,
  DecisionReasonSheet,
  approvalActionStateLabel,
  approvalsCopy,
  formatNextStepLabel,
  getApprovalGuardCode,
  guardErrorMessage,
  isIntermediateStep,
  OwnRequestChip,
  OwnRequestMenuItem,
  resolveApprovalActionUi,
  SelfApprovalConfirmDialog,
  useSelfActionForbiddenHandler,
  useSelfApprovalPolicy,
  type DecisionReasonInput,
  type DecisionReasonMode,
} from "@features/approvals";
import type { DriverSettlement } from "../../domain/entities";
import {
  invalidateSettlementQueries,
  useApproveSettlement,
  useCancelSettlement,
  useRejectSettlement,
  useReturnSettlement,
  useSubmitSettlement,
} from "../../application/hooks/useSettlements";
import { useSettlementSettings } from "../../application/hooks/useSettlementSettings";
import { settlementsCompensationApprovalsPath } from "../config/settlementWorkbenchConfig";
import { settlementsCopy } from "../copy/settlementsCopy";
import { DisburseSettlementDialog } from "./DisburseSettlementDialog";
import {
  canDisburse,
  canSubmitVobo,
  isSettlementDisbursable,
  isSettlementMaker,
  resolveSettlementDisburseUi,
} from "../utils/settlementCta";
import {
  isSettlementCorrectable,
  isSettlementReturned,
  settlementGuards,
} from "../utils/settlementEditing";
import { settlementToApprovableItem } from "../utils/settlementApprovableItem";

const copy = settlementsCopy;
const flowCopy = settlementsCopy.settlementFlow;

interface SettlementActionsProps {
  settlement: DriverSettlement;
  /** Requerido en dropdown; omitible en detail (variant buttons). */
  onView?: (id: string) => void;
  onDisburse?: (settlement: DriverSettlement) => void;
  onActionComplete?: () => void;
  /** Oculta approve/reject inline y muestra link a bandeja central (D6). */
  approvalLinkOnly?: boolean;
  variant?: "dropdown" | "buttons";
  /** D21: abre el Sheet «Corregir liquidación» (solo en el detalle, que trae partidas). */
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

  const submitMutation = useSubmitSettlement();
  const approveMutation = useApproveSettlement();
  const rejectMutation = useRejectSettlement();
  const returnMutation = useReturnSettlement();
  const cancelMutation = useCancelSettlement();
  const isDeciding = rejectMutation.isPending || returnMutation.isPending;

  const isPendingApproval = settlement.status === "pending_approval";
  const isDraft = settlement.status === "draft";
  const isApproved = settlement.status === "approved";
  const isReturned = isSettlementReturned(settlement);
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
  const canCancel = canUpdate && isDraft;
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
    isSettlementDisbursable({ settlement, canExecute });
  const canCorrect = Boolean(onCorrect) && canUpdate && isSettlementCorrectable(settlement.status);
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

  /** Handoff F6 §6: una guarda cierra, avisa y recarga; nunca se reintenta. */
  const handleGuardError = (error: unknown, close: () => void): boolean => {
    const guard = getApprovalGuardCode(error);
    if (!guard) return false;
    close();
    invalidateSettlementQueries(queryClient, settlement.id);
    toast({ title: guardErrorMessage(guard), variant: "warning" });
    return true;
  };

  const handleSubmit = async () => {
    try {
      await submitMutation.mutateAsync(settlement.id);
      toast({
        title: isReturned ? flowCopy.toasts.resubmitted : copy.toasts.submitSettlementSuccess,
        variant: "success",
      });
      onActionComplete?.();
    } catch (error) {
      toast({
        title: copy.toasts.submitSettlementError,
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
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

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(settlement.id);
      toast({
        title: copy.toasts.cancelSettlementSuccess,
        variant: "default",
      });
      setCancelDialogOpen(false);
      onActionComplete?.();
    } catch (error) {
      toast({
        title: copy.toasts.cancelSettlementError,
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
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

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.actionDialogs.cancelSettlement.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.actionDialogs.cancelSettlement.descriptionPart1}{" "}
              <span className="font-semibold text-foreground">
                {settlement.settlementNumber}
              </span>{" "}
              {copy.actionDialogs.cancelSettlement.descriptionPart2}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMutation.isPending}>
              {copy.actionDialogs.cancelSettlement.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelMutation.isPending
                ? copy.actionDialogs.cancelSettlement.pending
                : copy.actionDialogs.cancelSettlement.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
    </>
  );

  if (variant === "buttons") {
    const showMoreMenu = canReject || canCancel;
    return (
      <>
        <div className="flex max-w-full flex-nowrap items-center justify-end gap-2">
          {canCorrect && (
            <Button variant="outline" onClick={onCorrect}>
              <Pencil className="mr-2 h-4 w-4" />
              {flowCopy.header.correct}
            </Button>
          )}
          {/* D15: devuelta → reenviar desde la alerta del detalle. */}
          {canSubmit && !isReturned && (
            <Button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
            >
              <Send className="mr-2 h-4 w-4" />
              {submitLabel}
            </Button>
          )}
          {canReject && (
            <Button
              variant="outline"
              onClick={() => setReasonMode("return")}
              disabled={isDeciding}
            >
              <Undo2 className="mr-2 h-4 w-4" />
              {flowCopy.header.returnForCorrection}
            </Button>
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
                    disabled={cancelMutation.isPending}
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
              {canCancel ? (
                <DropdownMenuItem
                  onClick={() => setCancelDialogOpen(true)}
                  disabled={cancelMutation.isPending}
                  className="text-destructive focus:text-destructive"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {copy.actions.cancelSettlement}
                </DropdownMenuItem>
              ) : null}
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
