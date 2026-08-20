/**
 * TrailerActions — Editar visible en la fila; Eliminar en menú (D5').
 * Baja siempre vía AlertDialog; nunca a un clic.
 */

import { useState } from "react";
import { Loader2, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@shared/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import {
  getErrorMessage,
  isApiError,
} from "@shared/api/interceptors/error-handler";
import { useDeleteTrailer } from "../../application";
import { trailersCopy } from "../copy/trailersCopy";

export interface TrailerActionsProps {
  trailerId: string;
  licensePlate: string;
  onEdit?: () => void;
}

export function TrailerActions({
  trailerId,
  licensePlate,
  onEdit,
}: TrailerActionsProps) {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const canEdit = hasPermission("trailers", "update");
  const canDelete = hasPermission("trailers", "delete");

  const deleteTrailer = useDeleteTrailer({
    onSuccess: () => {
      toast({
        title: trailersCopy.form.toast.deleteSuccess,
        variant: "success",
      });
      setConfirmDeleteOpen(false);
    },
    onError: (error) => {
      toast({
        title: trailersCopy.form.toast.deleteErrorTitle,
        description: isApiError(error)
          ? error.getDetailedMessage(3)
          : getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  if (!canEdit && !canDelete) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        {canEdit && onEdit ? (
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            {trailersCopy.actions.edit}
          </Button>
        ) : null}
        {canDelete ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">{trailersCopy.actions.menu}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                onSelect={() => setConfirmDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {trailersCopy.actions.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <AlertDialog
        open={confirmDeleteOpen}
        onOpenChange={(open) => {
          if (deleteTrailer.isPending) return;
          setConfirmDeleteOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {trailersCopy.actions.deleteTitle(licensePlate)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {trailersCopy.actions.deleteDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTrailer.isPending}>
              {trailersCopy.form.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteTrailer.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                deleteTrailer.mutate(trailerId);
              }}
            >
              {deleteTrailer.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {trailersCopy.actions.deleting}
                </>
              ) : (
                trailersCopy.actions.delete
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
