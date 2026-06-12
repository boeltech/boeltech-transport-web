import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
import { branchesCopy } from "../copy/branchesCopy";

interface BranchActionsProps {
  branchId: string;
  branchName: string;
  variant?: "dropdown" | "buttons";
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

export function BranchActions({
  branchId,
  branchName,
  variant = "dropdown",
  onDelete,
  isDeleting = false,
}: BranchActionsProps) {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const canUpdate = hasPermission("branches", "update");
  const canDelete = hasPermission("branches", "delete");

  const handleDelete = () => {
    onDelete?.(branchId);
    setConfirmDeleteOpen(false);
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

  if (variant === "buttons") {
    return (
      <>
        <div className="flex items-center gap-2">
          {canUpdate ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/branches/${branchId}/edit`)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              {branchesCopy.actions.edit}
            </Button>
          ) : null}
          {canDelete ? (
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={() => setConfirmDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {branchesCopy.actions.delete}
            </Button>
          ) : null}
        </div>
        {deleteDialog}
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
          {canUpdate ? (
            <DropdownMenuItem onClick={() => navigate(`/branches/${branchId}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              {branchesCopy.actions.edit}
            </DropdownMenuItem>
          ) : null}
          {canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                disabled={isDeleting}
                onClick={() => setConfirmDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {branchesCopy.actions.delete}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      {deleteDialog}
    </>
  );
}
