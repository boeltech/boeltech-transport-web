import { useState } from "react";
import {
  Eye,
  CheckCircle,
  XCircle,
  Banknote,
  MoreHorizontal,
  ExternalLink,
  Send,
  Pencil,
  Undo2,
  Ban,
  StickyNote,
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
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import {
  ApprovalHistorySheet,
  DecisionReasonSheet,
  approvalActionStateLabel,
  approvalGuardsFor,
  approvalsCopy,
  formatNextStepLabel,
  getApprovalGuardCode,
  guardErrorMessage,
  isIntermediateStep,
  isOwnRecord,
  OwnRequestMenuItem,
  resolveApprovalActionUi,
  resolveSelfActionUi,
  SelfApprovalConfirmDialog,
  useSelfActionForbiddenHandler,
  useSelfApprovalPolicy,
  type DecisionReasonInput,
  type DecisionReasonMode,
} from "@features/approvals";
import type { DriverAdvance } from "../../domain/entities";
import {
  invalidateAdvanceQueries,
  useSubmitDriverAdvance,
  useApproveDriverAdvance,
  useRejectDriverAdvance,
  useReturnDriverAdvance,
} from "../../application/hooks/useAdvances";
import { settlementsCopy } from "../copy/settlementsCopy";
import { DisburseAdvanceDialog } from "./DisburseAdvanceDialog";
import { AdvanceEditSheet, type AdvanceEditMode } from "./AdvanceEditSheet";
import { AdvanceAddNoteDialog } from "./AdvanceAddNoteDialog";
import { AdvanceCancelDialog } from "./AdvanceCancelDialog";
import { driverAdvanceToApprovableItem } from "../utils/advanceApprovableItem";
import {
  isAdvanceDisbursed,
  isAdvanceEditable,
  isAdvanceReturned,
} from "../utils/advanceEditing";

const copy = settlementsCopy;
const flowCopy = settlementsCopy.advanceFlow;

interface AdvanceActionsProps {
  advance: DriverAdvance;
  onActionComplete?: () => void;
}

export function AdvanceActions({ advance, onActionComplete }: AdvanceActionsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission("settlements", "update");
  const canExecute = hasPermission("settlements", "execute");
  const canReadApprovals = hasPermission("finance_approvals", "read");

  const [reasonMode, setReasonMode] = useState<DecisionReasonMode | null>(null);
  const [disburseDialogOpen, setDisburseDialogOpen] = useState(false);
  const [selfApproveDialogOpen, setSelfApproveDialogOpen] = useState(false);
  const [stepConfirmOpen, setStepConfirmOpen] = useState(false);
  const [editMode, setEditMode] = useState<AdvanceEditMode | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { data: selfApprovalPolicy } = useSelfApprovalPolicy();
  const handleSelfActionForbidden = useSelfActionForbiddenHandler();

  const submitMutation = useSubmitDriverAdvance();
  const approveMutation = useApproveDriverAdvance();
  const rejectMutation = useRejectDriverAdvance();
  const returnMutation = useReturnDriverAdvance();
  const isDeciding = rejectMutation.isPending || returnMutation.isPending;

  const isDraft = advance.status === "draft";
  const isReturned = isAdvanceReturned(advance);
  const isPendingApproval = advance.status === "pending_approval";
  const isPendingDisbursement = advance.status === "pending_disbursement";
  const isDisbursed = isAdvanceDisbursed(advance.status);
  const canEdit = canUpdate && isAdvanceEditable(advance.status);
  const isOwnAdvance = isOwnRecord(user?.id, [
    advance.createdBy,
    advance.submittedBy,
  ]);
  const approvalUi = resolveApprovalActionUi(advance.approval, {
    isOwn: isOwnAdvance,
    selfPolicy: selfApprovalPolicy?.advanceApprove,
    canDecide: canUpdate,
    isPending: isPendingApproval,
    userId: user?.id,
  });
  const approvalStateLabel = approvalActionStateLabel(approvalUi);
  const disburseUi = resolveSelfActionUi({
    isOwn: isOwnAdvance,
    policy: selfApprovalPolicy?.advanceDisburse,
  });
  const step = isIntermediateStep(advance.approval)
    ? {
        current: advance.approval.stepCurrent,
        total: advance.approval.stepsTotal,
        nextRole: formatNextStepLabel(advance.approval),
      }
    : null;
  const canOpenHistory = canReadApprovals && advance.approval != null;

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
    invalidateAdvanceQueries(queryClient);
    toast({ title: guardErrorMessage(guard), variant: "warning" });
    return true;
  };

  const handleSubmit = async () => {
    try {
      await submitMutation.mutateAsync(advance.id);
      toast({
        title: isReturned ? flowCopy.toasts.resubmitted : copy.toasts.submitAdvanceSuccess,
        variant: "success",
      });
      onActionComplete?.();
    } catch (error) {
      toast({
        title: copy.toasts.submitAdvanceError,
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleApprove = async () => {
    const closeAll = () => {
      setSelfApproveDialogOpen(false);
      setStepConfirmOpen(false);
    };
    try {
      const result = await approveMutation.mutateAsync({
        id: advance.id,
        guards: approvalGuardsFor(advance),
      });
      toast({
        title:
          result?.outcome === "step_signed" && step
            ? approvalsCopy.flow.stepSignedToast(step.current, step.total, step.nextRole)
            : copy.toasts.approveAdvanceSuccess,
        variant: "success",
      });
      closeAll();
      onActionComplete?.();
    } catch (error) {
      if (handleGuardError(error, closeAll)) return;
      toast({
        title: copy.toasts.approveAdvanceError,
        description: describeActionError(error),
        variant: "destructive",
      });
    }
  };

  const requestApprove = () => {
    if (approvalUi.kind === "act" && approvalUi.selfConfirm) {
      setSelfApproveDialogOpen(true);
      return;
    }
    if (step) {
      setStepConfirmOpen(true);
      return;
    }
    void handleApprove();
  };

  const closeReasonSheet = () => setReasonMode(null);

  const handleReasonSubmit = async (input: DecisionReasonInput) => {
    const mode = reasonMode;
    if (!mode) return;
    const guards = approvalGuardsFor(advance);
    try {
      if (mode === "return") {
        await returnMutation.mutateAsync({
          id: advance.id,
          reason: input.reason,
          reasonCode: input.reasonCode ?? "other",
          guards,
        });
        toast({ title: flowCopy.toasts.returned, variant: "success" });
      } else {
        await rejectMutation.mutateAsync({ id: advance.id, reason: input.reason, guards });
        toast({ title: copy.toasts.rejectAdvanceSuccess, variant: "default" });
      }
      closeReasonSheet();
      onActionComplete?.();
    } catch (error) {
      if (handleGuardError(error, closeReasonSheet)) return;
      toast({
        title: mode === "return" ? flowCopy.toasts.returnError : copy.toasts.rejectAdvanceError,
        description: describeActionError(error),
        variant: "destructive",
      });
    }
  };

  const canDecide = canUpdate && isPendingApproval;
  const showDecisions = canDecide && approvalUi.kind === "act";
  const showWorkflowSection =
    (canUpdate && isDraft) ||
    canDecide ||
    (canExecute && isPendingDisbursement) ||
    canEdit ||
    (canUpdate && isDisbursed) ||
    canOpenHistory;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{copy.actions.openActionsMenuSr}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {/* D15: devuelto → corregir primero */}
          {canUpdate && isReturned ? (
            <>
              <DropdownMenuItem
                onClick={() => setEditMode("correct")}
                className="text-primary focus:text-primary font-medium"
              >
                <Pencil className="mr-2 h-4 w-4" />
                {flowCopy.menu.correctAndResubmit}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSubmit} disabled={submitMutation.isPending}>
                <Send className="mr-2 h-4 w-4" />
                {flowCopy.menu.resubmitUnchanged}
              </DropdownMenuItem>
            </>
          ) : null}

          {canUpdate && isDraft && !isReturned ? (
            <DropdownMenuItem
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="text-primary focus:text-primary font-medium"
            >
              <Send className="mr-2 h-4 w-4" />
              {copy.actions.sendToApproval}
            </DropdownMenuItem>
          ) : null}

          {canDecide ? (
            approvalUi.kind === "own_blocked" ? (
              <OwnRequestMenuItem />
            ) : showDecisions ? (
              <>
                <DropdownMenuItem
                  onClick={requestApprove}
                  disabled={approveMutation.isPending}
                  className="text-success focus:text-success font-medium"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {copy.actions.authorizeAdvance}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setReasonMode("return")} disabled={isDeciding}>
                  <Undo2 className="mr-2 h-4 w-4" />
                  {flowCopy.menu.returnForCorrection}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setReasonMode("reject")}
                  disabled={isDeciding}
                  className="text-destructive focus:text-destructive"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {copy.actions.rejectAdvance}
                </DropdownMenuItem>
              </>
            ) : approvalStateLabel ? (
              <DropdownMenuItem disabled>{approvalStateLabel}</DropdownMenuItem>
            ) : null
          ) : null}

          {canExecute && isPendingDisbursement ? (
            disburseUi === "blocked_own" ? (
              <OwnRequestMenuItem kind="disburse" />
            ) : (
              <DropdownMenuItem
                onClick={() => setDisburseDialogOpen(true)}
                className="text-primary focus:text-primary font-medium"
              >
                <Banknote className="mr-2 h-4 w-4" />
                {copy.actions.recordAdvanceDisbursement}
              </DropdownMenuItem>
            )
          ) : null}

          {canEdit && !isReturned ? (
            <DropdownMenuItem onClick={() => setEditMode("edit")}>
              <Pencil className="mr-2 h-4 w-4" />
              {flowCopy.menu.edit}
            </DropdownMenuItem>
          ) : null}

          {canUpdate && isDisbursed ? (
            <DropdownMenuItem onClick={() => setNoteDialogOpen(true)}>
              <StickyNote className="mr-2 h-4 w-4" />
              {flowCopy.menu.addNote}
            </DropdownMenuItem>
          ) : null}

          {canOpenHistory ? (
            <DropdownMenuItem onClick={() => setHistoryOpen(true)}>
              <History className="mr-2 h-4 w-4" />
              {flowCopy.menu.history}
            </DropdownMenuItem>
          ) : null}

          {canEdit ? (
            <DropdownMenuItem
              onClick={() => setCancelDialogOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <Ban className="mr-2 h-4 w-4" />
              {flowCopy.menu.cancel}
            </DropdownMenuItem>
          ) : null}

          {showWorkflowSection ? <DropdownMenuSeparator /> : null}

          <DropdownMenuItem asChild>
            <Link to={`/employees/${advance.employeeId}`}>
              <Eye className="mr-2 h-4 w-4" />
              {copy.actions.viewDriverFile}
            </Link>
          </DropdownMenuItem>

          {advance.tripId ? (
            <DropdownMenuItem asChild>
              <Link to={`/trips/${advance.tripId}`}>
                <ExternalLink className="mr-2 h-4 w-4" />
                {copy.actions.viewTripPrefix} {advance.tripCode ?? ""}
              </Link>
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <DecisionReasonSheet
        mode={reasonMode ?? "reject"}
        open={reasonMode != null}
        onOpenChange={(open) => {
          if (!open && isDeciding) return;
          if (!open) closeReasonSheet();
        }}
        item={reasonMode ? driverAdvanceToApprovableItem(advance) : null}
        isSubmitting={isDeciding}
        type="driver_advance_request"
        onSubmit={(input) => {
          void handleReasonSubmit(input);
        }}
      />

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

      <DisburseAdvanceDialog
        open={disburseDialogOpen}
        onOpenChange={setDisburseDialogOpen}
        advance={advance}
        selfConfirm={disburseUi === "self_confirm"}
        onSuccess={onActionComplete}
      />

      <SelfApprovalConfirmDialog
        open={selfApproveDialogOpen}
        onOpenChange={setSelfApproveDialogOpen}
        subject="advance"
        onConfirm={() => void handleApprove()}
        isPending={approveMutation.isPending}
      />

      <AdvanceEditSheet
        open={editMode != null}
        onOpenChange={(open) => {
          if (!open) setEditMode(null);
        }}
        advance={advance}
        mode={editMode ?? "edit"}
        onSaved={onActionComplete}
      />

      <AdvanceAddNoteDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        advance={advance}
        onSaved={onActionComplete}
      />

      <AdvanceCancelDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        advance={advance}
        onCancelled={onActionComplete}
      />

      {canOpenHistory ? (
        <ApprovalHistorySheet
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          type="driver_advance_request"
          id={advance.id}
          subtitle={advance.folio}
        />
      ) : null}
    </>
  );
}
