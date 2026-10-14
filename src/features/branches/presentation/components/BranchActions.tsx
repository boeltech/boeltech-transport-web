/**
 * BranchActions
 *
 * - dropdown (lista activa): ver / editar — sin Dar de baja (D1).
 * - dropdown (Eliminadas): ver / restaurar.
 * - buttons (detalle): Editar primary; Baja outline; Restaurar si !isActive (D2/D7).
 * Errores baja/restaurar: Alert inline en Dialog (D11).
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMasterActionFrom } from "@shared/utils/masterWayfinding";
import {
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Button } from "@shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@shared/ui/tooltip";
import { cn } from "@shared/lib/utils/cn";
import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import {
  getErrorMessage,
  isApiError,
} from "@shared/api/interceptors/error-handler";
import { useDeleteBranch, useRestoreBranch } from "../../application";
import { branchesCopy } from "../copy/branchesCopy";
import { getBranchMutationErrorToast } from "../utils/branchMutationErrors";

export interface BranchActionsProps {
  branchId: string;
  branchName: string;
  isActive?: boolean;
  isMain?: boolean;
  variant?: "dropdown" | "buttons";
  fromState?: { from: string };
  /** Clase del trigger ⋯ (p. ej. entityListCardMenuTriggerClassName en cards). */
  menuTriggerClassName?: string;
  /** aria-label del trigger ⋯. */
  menuAriaLabel?: string;
}

function formatBranchActionError(error: Error): string {
  const known = getBranchMutationErrorToast(error);
  if (known?.description) return known.description;
  if (known?.title) return known.title;
  return isApiError(error)
    ? error.getDetailedMessage(3)
    : getErrorMessage(error);
}

export function BranchActions({
  branchId,
  branchName,
  isActive = true,
  isMain = false,
  variant = "dropdown",
  fromState: fromStateProp,
  menuTriggerClassName,
  menuAriaLabel = branchesCopy.card.actionsAria,
}: BranchActionsProps) {
  const navigate = useNavigate();
  const masterFrom = useMasterActionFrom("/branches");
  const fromState = fromStateProp ?? masterFrom;
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const canUpdate = hasPermission("branches", "update");
  const canDelete = hasPermission("branches", "delete");
  const canRestore = canUpdate && !isActive;
  /** Baja solo en detalle (D1); listado activo no ofrece delete. */
  const canDeleteInDetail =
    variant === "buttons" && canDelete && isActive && !isMain;
  const showMainDeleteDisabled =
    variant === "buttons" && canDelete && isActive && isMain;

  const deleteMutation = useDeleteBranch({
    onSuccess: () => {
      setDeleteError(null);
      setConfirmDeleteOpen(false);
      toast({
        title: branchesCopy.list.toasts.deleteSuccess,
        variant: "success",
      });
      if (variant === "buttons") {
        navigate(fromState?.from ?? "/branches", { replace: true });
      }
    },
    onError: (error) => {
      setDeleteError(formatBranchActionError(error));
    },
  });

  const restoreMutation = useRestoreBranch({
    onSuccess: () => {
      setRestoreError(null);
      setConfirmRestoreOpen(false);
      toast({
        title: branchesCopy.list.toasts.restoreSuccess,
        variant: "success",
      });
    },
    onError: (error) => {
      setRestoreError(formatBranchActionError(error));
    },
  });

  const isLoading = deleteMutation.isPending || restoreMutation.isPending;

  const openDeleteDialog = () => {
    setDeleteError(null);
    setConfirmDeleteOpen(true);
  };

  const openRestoreDialog = () => {
    setRestoreError(null);
    setConfirmRestoreOpen(true);
  };

  const closeDeleteDialog = () => {
    if (deleteMutation.isPending) return;
    setDeleteError(null);
    setConfirmDeleteOpen(false);
  };

  const closeRestoreDialog = () => {
    if (restoreMutation.isPending) return;
    setRestoreError(null);
    setConfirmRestoreOpen(false);
  };

  const handleDelete = () => {
    if (deleteMutation.isPending) return;
    setDeleteError(null);
    deleteMutation.mutate(branchId);
  };

  const handleRestore = () => {
    if (restoreMutation.isPending) return;
    setRestoreError(null);
    restoreMutation.mutate(branchId);
  };

  const handleView = () => {
    navigate(`/branches/${branchId}`, { state: fromState });
  };

  const handleEdit = () => {
    navigate(`/branches/${branchId}/edit`, { state: fromState });
  };

  const deleteDialog = (
    <Dialog
      open={confirmDeleteOpen}
      onOpenChange={(open) => {
        if (!open) closeDeleteDialog();
        else openDeleteDialog();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{branchesCopy.actions.deleteTitle}</DialogTitle>
          <DialogDescription>
            {branchesCopy.actions.deleteDescription(branchName)}
          </DialogDescription>
        </DialogHeader>
        {deleteError ? (
          <Alert variant="destructive">
            <AlertTitle>{branchesCopy.actions.deleteErrorTitle}</AlertTitle>
            <AlertDescription className="select-text whitespace-pre-wrap break-words">
              {deleteError}
            </AlertDescription>
          </Alert>
        ) : null}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={closeDeleteDialog}
            disabled={deleteMutation.isPending}
          >
            {branchesCopy.actions.cancel}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {deleteMutation.isPending
              ? branchesCopy.actions.deleting
              : branchesCopy.actions.delete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const restoreDialog = (
    <Dialog
      open={confirmRestoreOpen}
      onOpenChange={(open) => {
        if (!open) closeRestoreDialog();
        else openRestoreDialog();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{branchesCopy.actions.restoreTitle}</DialogTitle>
          <DialogDescription>
            {branchesCopy.actions.restoreDescription(branchName)}
          </DialogDescription>
        </DialogHeader>
        {restoreError ? (
          <Alert variant="destructive">
            <AlertTitle>{branchesCopy.actions.restoreErrorTitle}</AlertTitle>
            <AlertDescription className="select-text whitespace-pre-wrap break-words">
              {restoreError}
            </AlertDescription>
          </Alert>
        ) : null}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={closeRestoreDialog}
            disabled={restoreMutation.isPending}
          >
            {branchesCopy.actions.cancel}
          </Button>
          <Button
            onClick={handleRestore}
            disabled={restoreMutation.isPending}
          >
            {restoreMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {restoreMutation.isPending
              ? branchesCopy.actions.restoring
              : branchesCopy.actions.restore}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (variant === "dropdown") {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", menuTriggerClassName)}
              disabled={isLoading}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">{menuAriaLabel}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleView}>
              <Eye className="mr-2 h-4 w-4" />
              {branchesCopy.actions.viewDetail}
            </DropdownMenuItem>
            {canUpdate && isActive ? (
              <DropdownMenuItem onClick={handleEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                {branchesCopy.actions.edit}
              </DropdownMenuItem>
            ) : null}
            {canRestore ? (
              <DropdownMenuItem
                disabled={restoreMutation.isPending}
                onClick={openRestoreDialog}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {branchesCopy.actions.restore}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
        {restoreDialog}
      </>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Buttons (detalle — D2 / D7)
  // ══════════════════════════════════════════════════════════════════════════

  if (!canUpdate && !canDelete && !canRestore) {
    return null;
  }

  const deleteButton = showMainDeleteDisabled ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {branchesCopy.actions.delete}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{branchesCopy.actions.mainDeleteDisabled}</TooltipContent>
    </Tooltip>
  ) : canDeleteInDetail ? (
    <Button
      variant="outline"
      size="sm"
      disabled={isLoading}
      onClick={openDeleteDialog}
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 className="mr-2 h-4 w-4" />
      {branchesCopy.actions.delete}
    </Button>
  ) : null;

  return (
    <>
      <div className="flex max-w-full flex-nowrap items-center justify-end gap-2">
        {canUpdate && isActive ? (
          <Button
            variant="default"
            size="sm"
            onClick={handleEdit}
            disabled={isLoading}
          >
            <Pencil className="mr-2 h-4 w-4" />
            {branchesCopy.actions.edit}
          </Button>
        ) : null}
        {canRestore ? (
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={openRestoreDialog}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {branchesCopy.actions.restore}
          </Button>
        ) : null}
        {deleteButton}
      </div>
      {deleteDialog}
      {restoreDialog}
    </>
  );
}
