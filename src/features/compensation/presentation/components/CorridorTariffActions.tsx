import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { useDeleteCorridorTariff } from "../../application/hooks";
import type { RouteCorridorTariff } from "../../domain/entities";
import { compensationCopy } from "../copy/compensationCopy";

const copy = compensationCopy.corridorActions;

interface CorridorTariffActionsProps {
  corridor: RouteCorridorTariff;
  onEdit?: (corridor: RouteCorridorTariff) => void;
  onActionComplete?: () => void;
}

export function CorridorTariffActions({
  corridor,
  onEdit,
  onActionComplete,
}: CorridorTariffActionsProps) {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission("settlements", "update");
  const canDelete = hasPermission("settlements", "delete");
  const deleteMutation = useDeleteCorridorTariff();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (!canUpdate && !canDelete) {
    return null;
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(corridor.id);
      toast({ title: copy.toasts.deleteSuccess, variant: "success" });
      setDeleteDialogOpen(false);
      onActionComplete?.();
    } catch (error) {
      toast({
        title: copy.toasts.deleteError,
        description: getErrorMessage(error),
        variant: "error",
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{copy.openMenuSr}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56" onClick={(event) => event.stopPropagation()}>
          {canUpdate && onEdit ? (
            <DropdownMenuItem onClick={() => onEdit(corridor)}>
              <Pencil className="mr-2 h-4 w-4" />
              {copy.edit}
            </DropdownMenuItem>
          ) : null}
          {canDelete ? (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {copy.delete}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.deleteDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{copy.deleteDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.deleteDialog.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {deleteMutation.isPending ? copy.deleteDialog.pending : copy.deleteDialog.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
