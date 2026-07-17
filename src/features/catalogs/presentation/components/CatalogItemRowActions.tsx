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
import type { CatalogItem } from "../../domain";
import { useDeleteCatalogItem } from "../../application/hooks/useCatalogItemMutations";
import { catalogsCopy } from "../copy/catalogsCopy";

interface CatalogItemRowActionsProps {
  typeCode: string;
  item: CatalogItem;
  onEdit: (item: CatalogItem) => void;
}

export function CatalogItemRowActions({
  typeCode,
  item,
  onEdit,
}: CatalogItemRowActionsProps) {
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission("catalogs", "update");
  const canDelete = hasPermission("catalogs", "delete");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteMutation = useDeleteCatalogItem({
    onSuccess: () => setDeleteOpen(false),
  });

  if (!canUpdate && !canDelete) {
    return <span className="text-muted-foreground">—</span>;
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
          {canUpdate ? (
            <DropdownMenuItem onClick={() => onEdit(item)}>
              <Pencil className="mr-2 h-4 w-4" />
              {catalogsCopy.itemActions.edit}
            </DropdownMenuItem>
          ) : null}
          {canDelete ? (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {catalogsCopy.itemActions.delete}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{catalogsCopy.deleteConfirm.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {catalogsCopy.deleteConfirm.description(item.code)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{catalogsCopy.deleteConfirm.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() =>
                deleteMutation.mutate({ typeCode, code: item.code })
              }
            >
              {catalogsCopy.deleteConfirm.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
