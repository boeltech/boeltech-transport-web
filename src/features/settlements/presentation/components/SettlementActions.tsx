import { useState } from "react";
import {
  Eye,
  Check,
  CheckCircle,
  Banknote,
  XCircle,
  MoreHorizontal,
  ExternalLink,
  X,
  Send,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
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
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area/textarea";
import { usePermissions } from "@shared/permissions";
import { useAuth } from "@features/auth";
import { useToast } from "@shared/hooks";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import type { DriverSettlement } from "../../domain/entities";
import {
  useApproveSettlement,
  useCancelSettlement,
  useRejectSettlement,
  useSubmitSettlement,
} from "../../application/hooks/useSettlements";
import { useSettlementSettings } from "../../application/hooks/useSettlementSettings";
import { settlementsCompensationApprovalsPath } from "../config/settlementWorkbenchConfig";
import { settlementsCopy } from "../copy/settlementsCopy";
import { DisburseSettlementDialog } from "./DisburseSettlementDialog";
import {
  canApproveSettlement,
  canDisburse,
  canRejectSettlement,
  canSubmitVobo,
  isSettlementMaker,
} from "../utils/settlementCta";

const copy = settlementsCopy;

interface SettlementActionsProps {
  settlement: DriverSettlement;
  /** Requerido en dropdown; omitible en detail (variant buttons). */
  onView?: (id: string) => void;
  onDisburse?: (settlement: DriverSettlement) => void;
  onActionComplete?: () => void;
  /** Oculta approve/reject inline y muestra link a bandeja central (D6). */
  approvalLinkOnly?: boolean;
  variant?: "dropdown" | "buttons";
}

export function SettlementActions({
  settlement,
  onView,
  onDisburse,
  onActionComplete,
  approvalLinkOnly = false,
  variant = "dropdown",
}: SettlementActionsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission("settlements", "update");
  const canExecute = hasPermission("settlements", "execute");
  const {
    data: settings,
    isError: settingsError,
  } = useSettlementSettings();
  const activeApproverCount = settings?.activeApproverCount;
  const activeExecutorCount = settings?.activeExecutorCount;

  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [disburseDialogOpen, setDisburseDialogOpen] = useState(false);

  const submitMutation = useSubmitSettlement();
  const approveMutation = useApproveSettlement();
  const rejectMutation = useRejectSettlement();
  const cancelMutation = useCancelSettlement();

  const isPendingApproval = settlement.status === "pending_approval";
  const isDraft = settlement.status === "draft";
  const isApproved = settlement.status === "approved";
  const isSelfApproval = isSettlementMaker(settlement, user?.id);
  const isMaker = isSelfApproval;
  const makerBlockedAsApprover =
    isSelfApproval && activeApproverCount !== 1;
  const makerBlockedAsExecutor =
    isMaker && activeExecutorCount !== 1;

  const canSubmit = canSubmitVobo({ settlement, canUpdate });
  const canCancel = canUpdate && isDraft;
  const canApprove = canApproveSettlement({
    settlement,
    userId: user?.id,
    canUpdate,
    activeApproverCount,
  });
  const canReject = canRejectSettlement({
    settlement,
    userId: user?.id,
    canUpdate,
    activeApproverCount,
  });
  const canDisburseAction = canDisburse({
    settlement,
    userId: user?.id,
    canExecute,
    activeExecutorCount,
  });
  // Aviso informativo del umbral; no bloquea CTAs — el API es la autoridad.
  const showSettingsUnavailable =
    settingsError &&
    (canUpdate || canExecute) &&
    (isDraft || isPendingApproval || isApproved);
  const showMakerExecuteBadge =
    makerBlockedAsExecutor &&
    canExecute &&
    (isApproved || (isDraft && settlement.voboRequired === false));
  const submitLabel = copy.actions.pedirVobo;

  const handleSubmit = async () => {
    try {
      await submitMutation.mutateAsync(settlement.id);
      toast({
        title: copy.toasts.submitSettlementSuccess,
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
    if (makerBlockedAsApprover) {
      toast({
        title: copy.toasts.selfApprovalSettlementAuthorize,
        variant: "destructive",
      });
      return;
    }
    try {
      await approveMutation.mutateAsync(settlement.id);
      toast({
        title: copy.toasts.approveSettlementSuccess,
        variant: "success",
      });
      setApproveDialogOpen(false);
      onActionComplete?.();
    } catch (error) {
      toast({
        title: copy.toasts.approveSettlementError,
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
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

  const handleReject = async () => {
    if (makerBlockedAsApprover) {
      toast({
        title: copy.toasts.selfApprovalSettlementReject,
        variant: "destructive",
      });
      return;
    }
    if (!rejectReason.trim()) {
      toast({
        title: copy.toasts.rejectSettlementReasonRequired,
        variant: "destructive",
      });
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        id: settlement.id,
        reason: rejectReason,
      });
      toast({
        title: copy.toasts.rejectSettlementSuccess,
        variant: "default",
      });
      setRejectDialogOpen(false);
      onActionComplete?.();
    } catch (error) {
      toast({
        title: copy.toasts.rejectSettlementError,
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const openDisburse = () => {
    if (onDisburse) {
      onDisburse(settlement);
      return;
    }
    setDisburseDialogOpen(true);
  };

  const dialogs = (
    <>
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

      <Dialog
        open={rejectDialogOpen}
        onOpenChange={(next) => {
          setRejectDialogOpen(next);
          if (next) setRejectReason("");
        }}
      >
        <DialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{copy.actionDialogs.rejectSettlement.title}</DialogTitle>
            <DialogDescription>
              {copy.actionDialogs.rejectSettlement.descriptionPrefix}{" "}
              <span className="font-semibold text-foreground">
                {settlement.settlementNumber}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="action-reject-reason">{copy.actionDialogs.rejectSettlement.reasonLabel}</Label>
            <Textarea
              id="action-reject-reason"
              rows={3}
              placeholder={copy.actionDialogs.rejectSettlement.reasonPlaceholder}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              {copy.actionDialogs.rejectSettlement.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending
                ? copy.actionDialogs.rejectSettlement.pending
                : copy.actionDialogs.rejectSettlement.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!onDisburse && (
        <DisburseSettlementDialog
          open={disburseDialogOpen}
          onOpenChange={setDisburseDialogOpen}
          settlement={settlement}
          onSuccess={() => onActionComplete?.()}
        />
      )}
    </>
  );

  if (variant === "buttons") {
    return (
      <>
        <div className="flex max-w-full flex-nowrap items-center justify-end gap-2">
          {canCancel && (
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(true)}
              disabled={cancelMutation.isPending}
            >
              <X className="mr-2 h-4 w-4 text-destructive" />
              {copy.actions.cancelSettlement}
            </Button>
          )}
          {canSubmit && (
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
              onClick={() => setRejectDialogOpen(true)}
              disabled={rejectMutation.isPending}
            >
              <X className="mr-2 h-4 w-4 text-destructive" />
              {copy.actions.reject}
            </Button>
          )}
          {canApprove && (
            <Button
              onClick={() => setApproveDialogOpen(true)}
              disabled={approveMutation.isPending}
            >
              <Check className="mr-2 h-4 w-4 text-success" />
              {copy.actions.approve}
            </Button>
          )}
          {makerBlockedAsApprover && isPendingApproval && (
            <span className="text-xs text-muted-foreground italic px-1">
              {copy.toasts.selfApprovalBadge}
            </span>
          )}
          {showMakerExecuteBadge && (
            <span className="text-xs text-muted-foreground italic px-1">
              {copy.toasts.makerExecuteBadge}
            </span>
          )}
          {canDisburseAction && (
            <Button onClick={openDisburse}>
              <Banknote className="mr-2 h-4 w-4" />
              {copy.actions.disburse}
            </Button>
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

          {!approvalLinkOnly && canUpdate && isPendingApproval && (
            <>
              <DropdownMenuSeparator />
              {makerBlockedAsApprover ? (
                <DropdownMenuItem
                  disabled
                  className="text-xs text-muted-foreground italic cursor-not-allowed"
                >
                  {copy.toasts.selfApprovalBadge}
                </DropdownMenuItem>
              ) : (
                <>
                  {canApprove ? (
                    <DropdownMenuItem
                      onClick={() => setApproveDialogOpen(true)}
                      disabled={approveMutation.isPending}
                      className="text-success focus:text-success"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {copy.actions.approve}
                    </DropdownMenuItem>
                  ) : null}
                  {canReject ? (
                    <DropdownMenuItem
                      onClick={() => setRejectDialogOpen(true)}
                      disabled={rejectMutation.isPending}
                      className="text-destructive focus:text-destructive"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      {copy.actions.reject}
                    </DropdownMenuItem>
                  ) : null}
                </>
              )}
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
          {showMakerExecuteBadge && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled
                className="text-xs text-muted-foreground italic cursor-not-allowed"
              >
                {copy.toasts.makerExecuteBadge}
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
