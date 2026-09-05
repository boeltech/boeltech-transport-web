import { useState } from "react";
import { Eye, CheckCircle, XCircle, Banknote, MoreHorizontal, ExternalLink, Send } from "lucide-react";
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
import { Label } from "@shared/ui/label";
import { Input } from "@shared/ui/input";
import { Textarea } from "@shared/ui/text-area/textarea";
import { usePermissions } from "@shared/permissions";
import { useAuth } from "@features/auth";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import type { DriverAdvance } from "../../domain/entities";
import {
  useSubmitDriverAdvance,
  useApproveDriverAdvance,
  useRejectDriverAdvance,
  useDisburseDriverAdvance,
} from "../../application/hooks/useAdvances";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy;

interface AdvanceActionsProps {
  advance: DriverAdvance;
  onActionComplete?: () => void;
}

export function AdvanceActions({ advance, onActionComplete }: AdvanceActionsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission("settlements", "update");
  const canExecute = hasPermission("settlements", "execute");

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [disburseDialogOpen, setDisburseDialogOpen] = useState(false);
  const [disburseRef, setDisburseRef] = useState(advance.bankReference ?? "");

  const submitMutation = useSubmitDriverAdvance();
  const approveMutation = useApproveDriverAdvance();
  const rejectMutation = useRejectDriverAdvance();
  const disburseMutation = useDisburseDriverAdvance();

  const isDraft = advance.status === "draft";
  const isPendingApproval = advance.status === "pending_approval";
  const isPendingDisbursement = advance.status === "pending_disbursement";
  const isSelfApproval = Boolean(
    advance.submittedBy && user?.id && advance.submittedBy === user.id,
  );

  const handleSubmit = async () => {
    try {
      await submitMutation.mutateAsync(advance.id);
      toast({
        title: copy.toasts.submitAdvanceSuccess,
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
    if (isSelfApproval) {
      toast({
        title: copy.toasts.selfApprovalNotAllowedAuthorize,
        variant: "destructive",
      });
      return;
    }

    try {
      await approveMutation.mutateAsync(advance.id);
      toast({
        title: copy.toasts.approveAdvanceSuccess,
        variant: "success",
      });
      onActionComplete?.();
    } catch (error) {
      toast({
        title: copy.toasts.approveAdvanceError,
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (isSelfApproval) {
      toast({
        title: copy.toasts.selfApprovalNotAllowedReject,
        variant: "destructive",
      });
      return;
    }

    if (!rejectReason.trim()) {
      toast({
        title: copy.toasts.rejectAdvanceReasonRequired,
        variant: "destructive",
      });
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        id: advance.id,
        reason: rejectReason,
      });
      toast({
        title: copy.toasts.rejectAdvanceSuccess,
        variant: "default",
      });
      setRejectDialogOpen(false);
      onActionComplete?.();
    } catch (error) {
      toast({
        title: copy.toasts.rejectAdvanceError,
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleDisburse = async () => {
    try {
      await disburseMutation.mutateAsync({
        id: advance.id,
        payload: {
          bankReference: disburseRef || undefined,
        },
      });
      toast({
        title: copy.toasts.disburseAdvanceSuccess,
        variant: "success",
      });
      setDisburseDialogOpen(false);
      onActionComplete?.();
    } catch (error) {
      toast({
        title: copy.toasts.disburseAdvanceError,
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

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
          {/* ACCIONES DE WORKFLOW */}
          {canUpdate && isDraft && (
            <DropdownMenuItem
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="text-primary focus:text-primary font-medium"
            >
              <Send className="mr-2 h-4 w-4" />
              {copy.actions.sendToApproval}
            </DropdownMenuItem>
          )}

          {canUpdate && isPendingApproval && (
            <>
              {isSelfApproval ? (
                <DropdownMenuItem
                  disabled
                  className="text-xs text-muted-foreground italic cursor-not-allowed"
                >
                  {copy.toasts.selfApprovalBadge}
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem
                    onClick={handleApprove}
                    disabled={approveMutation.isPending}
                    className="text-success focus:text-success font-medium"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {copy.actions.authorizeAdvance}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setRejectDialogOpen(true)}
                    disabled={rejectMutation.isPending}
                    className="text-destructive focus:text-destructive"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {copy.actions.rejectAdvance}
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
            </>
          )}

          {canExecute && isPendingDisbursement && (
            <>
              <DropdownMenuItem
                onClick={() => setDisburseDialogOpen(true)}
                className="text-primary focus:text-primary font-medium"
              >
                <Banknote className="mr-2 h-4 w-4" />
                {copy.actions.recordAdvanceDisbursement}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

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

      {/* DIALOG DE RECHAZO DE ANTICIPO */}
      <Dialog
        open={rejectDialogOpen}
        onOpenChange={(next) => {
          setRejectDialogOpen(next);
          if (next) setRejectReason("");
        }}
      >
        <DialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{copy.actionDialogs.rejectAdvance.title}</DialogTitle>
            <DialogDescription>
              {copy.actionDialogs.rejectAdvance.descriptionPrefix}{" "}
              <span className="font-semibold text-foreground">{advance.folio}</span> ({formatMxCurrency(advance.amount)}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="advance-reject-reason">{copy.actionDialogs.rejectAdvance.reasonLabel}</Label>
            <Textarea
              id="advance-reject-reason"
              rows={3}
              placeholder={copy.actionDialogs.rejectAdvance.reasonPlaceholder}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              {copy.actionDialogs.rejectAdvance.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending
                ? copy.actionDialogs.rejectAdvance.pending
                : copy.actionDialogs.rejectAdvance.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG DE DISPERSIÓN / ENTREGA DE ANTICIPO */}
      <Dialog
        open={disburseDialogOpen}
        onOpenChange={(next) => {
          setDisburseDialogOpen(next);
          if (next) setDisburseRef(advance.bankReference ?? "");
        }}
      >
        <DialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{copy.actionDialogs.disburseAdvance.title}</DialogTitle>
            <DialogDescription>
              {copy.actionDialogs.disburseAdvance.descriptionPart1}{" "}
              <span className="font-semibold text-primary">{formatMxCurrency(advance.amount)}</span>{" "}
              {copy.actionDialogs.disburseAdvance.descriptionPart2}{" "}
              <span className="font-semibold text-foreground">{advance.employeeFullName ?? "—"}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <div className="space-y-1">
              <Label htmlFor="disburse-bank-ref">{copy.actionDialogs.disburseAdvance.bankRefLabel}</Label>
              <Input
                id="disburse-bank-ref"
                placeholder={copy.actionDialogs.disburseAdvance.bankRefPlaceholder}
                value={disburseRef}
                onChange={(e) => setDisburseRef(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisburseDialogOpen(false)}>
              {copy.actionDialogs.disburseAdvance.cancel}
            </Button>
            <Button
              onClick={handleDisburse}
              disabled={disburseMutation.isPending}
            >
              {disburseMutation.isPending
                ? copy.actionDialogs.disburseAdvance.pending
                : copy.actionDialogs.disburseAdvance.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
