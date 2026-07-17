import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, MoreHorizontal, Pencil, RotateCcw, Trash2 } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@shared/ui/tooltip";
import { usePermissions } from "@shared/permissions";
import { branchesCopy } from "../copy/branchesCopy";

interface BranchActionsProps {
  branchId: string;
  branchName: string;
  isActive?: boolean;
  isMain?: boolean;
  variant?: "dropdown" | "buttons";
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  isDeleting?: boolean;
  isRestoring?: boolean;
}

export function BranchActions({
  branchId,
  branchName,
  isActive = true,
  isMain = false,
  variant = "dropdown",
  onDelete,
  onRestore,
  isDeleting = false,
  isRestoring = false,
}: BranchActionsProps) {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);

  const canUpdate = hasPermission("branches", "update");
  const canDelete = hasPermission("branches", "delete");
  const canRestore = canUpdate && Boolean(onRestore) && !isActive;
  const canDeleteBranch = canDelete && Boolean(onDelete) && isActive && !isMain;

  const handleDelete = () => {
    onDelete?.(branchId);
    setConfirmDeleteOpen(false);
  };

  const handleRestore = () => {
    onRestore?.(branchId);
    setConfirmRestoreOpen(false);
  };

  const deleteDialog = (
    <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{branchesCopy.actions.deleteTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {branchesCopy.actions.deleteDescription(branchName)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {branchesCopy.actions.cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? branchesCopy.actions.deleting : branchesCopy.actions.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const restoreDialog = (
    <AlertDialog open={confirmRestoreOpen} onOpenChange={setConfirmRestoreOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{branchesCopy.actions.restoreTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {branchesCopy.actions.restoreDescription(branchName)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRestoring}>
            {branchesCopy.actions.cancel}
          </AlertDialogCancel>
          <AlertDialogAction disabled={isRestoring} onClick={handleRestore}>
            {isRestoring
              ? branchesCopy.actions.restoring
              : branchesCopy.actions.restore}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const deleteButton =
    isMain && isActive && canDelete ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button variant="destructive" size="sm" disabled>
              <Trash2 className="mr-2 h-4 w-4" />
              {branchesCopy.actions.delete}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>{branchesCopy.actions.mainDeleteDisabled}</TooltipContent>
      </Tooltip>
    ) : canDeleteBranch ? (
      <Button
        variant="destructive"
        size="sm"
        disabled={isDeleting}
        onClick={() => setConfirmDeleteOpen(true)}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        {isDeleting ? branchesCopy.actions.deleting : branchesCopy.actions.delete}
      </Button>
    ) : null;

  if (variant === "buttons") {
    return (
      <>
        <div className="flex items-center gap-2">
          {canUpdate && isActive ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/branches/${branchId}/edit`)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              {branchesCopy.actions.edit}
            </Button>
          ) : null}
          {canRestore ? (
            <Button
              variant="outline"
              size="sm"
              disabled={isRestoring}
              onClick={() => setConfirmRestoreOpen(true)}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {isRestoring
                ? branchesCopy.actions.restoring
                : branchesCopy.actions.restore}
            </Button>
          ) : null}
          {deleteButton}
        </div>
        {deleteDialog}
        {restoreDialog}
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Acciones</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => navigate(`/branches/${branchId}`)}>
            <Eye className="mr-2 h-4 w-4" />
            {branchesCopy.actions.viewDetail}
          </DropdownMenuItem>
          {canUpdate && isActive ? (
            <DropdownMenuItem onClick={() => navigate(`/branches/${branchId}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              {branchesCopy.actions.edit}
            </DropdownMenuItem>
          ) : null}
          {canRestore ? (
            <DropdownMenuItem
              disabled={isRestoring}
              onClick={() => setConfirmRestoreOpen(true)}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {branchesCopy.actions.restore}
            </DropdownMenuItem>
          ) : null}
          {canDelete && isActive ? (
            <>
              <DropdownMenuSeparator />
              {isMain ? (
                <DropdownMenuItem disabled>
                  {branchesCopy.actions.mainDeleteDisabled}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  disabled={isDeleting}
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {branchesCopy.actions.delete}
                </DropdownMenuItem>
              )}
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      {deleteDialog}
      {restoreDialog}
    </>
  );
}
