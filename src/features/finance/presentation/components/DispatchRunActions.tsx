/**
 * Acciones de un envío del periodo.
 * - dropdown: listado (Abrir · Cancelar envío)
 * - buttons: detalle (Enviar facturas + Más)
 */

import { useState } from "react";
import { Loader2, MoreHorizontal, RefreshCw } from "lucide-react";
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
import { Button } from "@shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import { usePermissions } from "@shared/permissions";
import { useCancelBillingDispatchRun } from "../../application/hooks/useBillingDispatchRuns";
import type { DispatchRunStatus } from "../../domain/billingDispatchRun.types";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import {
  canCancelDispatchRun,
  canConfirmForceResend,
  canConfirmSend,
  canRefreshPreview,
} from "../utils/dispatchRunPreviewBuckets";

const copy = dispatchRunsCopy.detail;
const tabCopy = dispatchRunsCopy.tab;
const cancelCopy = dispatchRunsCopy.tab.cancelDialog;

interface DispatchRunActionsProps {
  runId: string;
  status: DispatchRunStatus;
  periodLabel?: string;
  variant?: "dropdown" | "buttons";
  readyCount?: number;
  selectedResendCount?: number;
  hasZeroSelected?: boolean;
  hasResendZeroSelected?: boolean;
  isPending?: boolean;
  previewPending?: boolean;
  onView?: (id: string) => void;
  onRefresh?: () => void;
  onConfirm?: () => void;
  onResend?: () => void;
  onCancelled?: () => void;
}

export function DispatchRunActions({
  runId,
  status,
  periodLabel = "",
  variant = "dropdown",
  readyCount = 0,
  selectedResendCount = 0,
  hasZeroSelected = false,
  hasResendZeroSelected = false,
  isPending = false,
  previewPending = false,
  onView,
  onRefresh,
  onConfirm,
  onResend,
  onCancelled,
}: DispatchRunActionsProps) {
  const { hasPermission } = usePermissions();
  const canExecute = hasPermission("invoices", "execute");
  const cancelMutation = useCancelBillingDispatchRun();
  const [cancelOpen, setCancelOpen] = useState(false);

  const showCancel = canExecute && canCancelDispatchRun(status);
  const showRefresh = canExecute && canRefreshPreview(status);
  const showConfirm = canExecute && canConfirmSend(status, readyCount);
  const showResend =
    canExecute && canConfirmForceResend(status, selectedResendCount);
  const busy = isPending || cancelMutation.isPending;

  const handleCancelConfirm = async () => {
    await cancelMutation.mutateAsync(runId);
    setCancelOpen(false);
    onCancelled?.();
  };

  const cancelDialog = (
    <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{cancelCopy.title}</AlertDialogTitle>
          <AlertDialogDescription>{cancelCopy.body}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancelMutation.isPending}>
            {cancelCopy.keepReviewing}
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={cancelMutation.isPending}
            onClick={(event) => {
              event.preventDefault();
              void handleCancelConfirm();
            }}
          >
            {cancelMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {cancelCopy.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (variant === "dropdown") {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={tabCopy.actions.menuAria(periodLabel || runId)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {onView ? (
              <DropdownMenuItem onSelect={() => onView(runId)}>
                {tabCopy.actions.open}
              </DropdownMenuItem>
            ) : null}
            {showCancel ? (
              <>
                {onView ? <DropdownMenuSeparator /> : null}
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onSelect={() => setCancelOpen(true)}
                >
                  {tabCopy.actions.cancel}
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
        {cancelDialog}
      </>
    );
  }

  const hasMore = showRefresh || showCancel || showResend;
  if (!showConfirm && !hasMore) {
    return null;
  }

  return (
    <>
      <div className="flex max-w-full flex-nowrap items-center justify-end gap-2">
        {showConfirm ? (
          <Button
            type="button"
            size="sm"
            disabled={busy || hasZeroSelected}
            onClick={onConfirm}
          >
            {copy.sendCta}
          </Button>
        ) : null}
        {hasMore ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={busy}
              >
                {copy.moreActions}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {showRefresh ? (
                <DropdownMenuItem
                  disabled={busy}
                  onSelect={() => onRefresh?.()}
                >
                  {previewPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  {copy.refreshPreview}
                </DropdownMenuItem>
              ) : null}
              {showResend ? (
                <DropdownMenuItem
                  disabled={busy || hasResendZeroSelected}
                  onSelect={() => onResend?.()}
                >
                  {copy.resendCta}
                </DropdownMenuItem>
              ) : null}
              {showCancel ? (
                <>
                  {showRefresh || showResend ? <DropdownMenuSeparator /> : null}
                  <DropdownMenuItem
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                    disabled={busy}
                    onSelect={() => setCancelOpen(true)}
                  >
                    {copy.cancelRun}
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      {cancelDialog}
    </>
  );
}
