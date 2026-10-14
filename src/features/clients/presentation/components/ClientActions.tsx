/**
 * ClientActions Component
 * Clean Architecture - Presentation Layer
 *
 * Menú de acciones para cliente: editar, activar/desactivar, eliminar.
 * - dropdown (lista): ver / editar / eliminar — sin Activar/Desactivar (D1).
 * - buttons (detalle): Editar primaria; Activar/Desactivar outline; Eliminar outline (D7).
 * Errores de lifecycle/delete: Alert inline en Dialog (D11).
 *
 * Ubicación: src/features/clients/presentation/components/ClientActions.tsx
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMasterActionFrom } from "@shared/utils/masterWayfinding";
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
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  Loader2,
} from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { usePermissions } from "@shared/permissions";

import type { ClientListItem } from "../../domain";
import {
  useActivateClient,
  useDeactivateClient,
  useDeleteClient,
} from "../../application";
import { clientDetailCopy } from "../copy/clientDetailCopy";

const actionsCopy = clientDetailCopy.actions;

// ============================================================================
// TYPES
// ============================================================================

export interface ClientActionsProps {
  client: ClientListItem;
  variant?: "dropdown" | "buttons";
  showView?: boolean;
  /**
   * Override del handler de "Editar".
   * Si se pasa, se usa este callback en lugar de navegar a `/clients/:id/edit`.
   */
  onEdit?: () => void;
  /** Clase del trigger ⋯ (p. ej. entityListCardMenuTriggerClassName en cards). */
  menuTriggerClassName?: string;
  /** aria-label del trigger ⋯. */
  menuAriaLabel?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ClientActions({
  client,
  variant = "dropdown",
  showView = false,
  onEdit,
  menuTriggerClassName,
  menuAriaLabel = "Abrir menú",
}: ClientActionsProps) {
  const navigate = useNavigate();
  const fromState = useMasterActionFrom("/clients");
  const { hasPermission } = usePermissions();

  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const activateMutation = useActivateClient({
    onSuccess: () => {
      setLifecycleError(null);
      setShowActivateDialog(false);
    },
    onError: (error) => {
      setLifecycleError(error.message);
    },
  });

  const deactivateMutation = useDeactivateClient({
    onSuccess: () => {
      setLifecycleError(null);
      setShowDeactivateDialog(false);
    },
    onError: (error) => {
      setLifecycleError(error.message);
    },
  });

  const deleteMutation = useDeleteClient({
    onSuccess: () => {
      setDeleteError(null);
      setShowDeleteDialog(false);
      if (variant === "buttons") {
        navigate(fromState?.from ?? "/clients", { replace: true });
      }
    },
    onError: (error) => {
      setDeleteError(error.message);
    },
  });

  const canEdit = hasPermission("clients", "update");
  const canDelete = hasPermission("clients", "delete");

  const handleView = () => {
    navigate(`/clients/${client.id}`, { state: fromState });
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
      return;
    }
    navigate(`/clients/${client.id}/edit`, { state: fromState });
  };

  const openActivateDialog = () => {
    setLifecycleError(null);
    setShowActivateDialog(true);
  };

  const openDeactivateDialog = () => {
    setLifecycleError(null);
    setShowDeactivateDialog(true);
  };

  const openDeleteDialog = () => {
    setDeleteError(null);
    setShowDeleteDialog(true);
  };

  const closeActivateDialog = () => {
    if (activateMutation.isPending) return;
    setLifecycleError(null);
    setShowActivateDialog(false);
  };

  const closeDeactivateDialog = () => {
    if (deactivateMutation.isPending) return;
    setLifecycleError(null);
    setShowDeactivateDialog(false);
  };

  const closeDeleteDialog = () => {
    if (deleteMutation.isPending) return;
    setDeleteError(null);
    setShowDeleteDialog(false);
  };

  const handleActivate = () => {
    if (activateMutation.isPending) return;
    setLifecycleError(null);
    activateMutation.mutate(client.id);
  };

  const handleDeactivate = () => {
    if (deactivateMutation.isPending) return;
    setLifecycleError(null);
    deactivateMutation.mutate(client.id);
  };

  const handleDelete = () => {
    if (deleteMutation.isPending) return;
    setDeleteError(null);
    deleteMutation.mutate(client.id);
  };

  const isLoading =
    activateMutation.isPending ||
    deactivateMutation.isPending ||
    deleteMutation.isPending;

  const lifecycleDialogs = (
    <>
      <Dialog
        open={showActivateDialog}
        onOpenChange={(open) => {
          if (!open) closeActivateDialog();
          else openActivateDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionsCopy.activateTitle}</DialogTitle>
            <DialogDescription>
              {actionsCopy.activateDescription(client.legalName)}
            </DialogDescription>
          </DialogHeader>
          {lifecycleError ? (
            <Alert variant="destructive">
              <AlertTitle>{actionsCopy.lifecycleErrorTitle}</AlertTitle>
              <AlertDescription className="select-text whitespace-pre-wrap break-words">
                {lifecycleError}
              </AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeActivateDialog}
              disabled={activateMutation.isPending}
            >
              {actionsCopy.cancel}
            </Button>
            <Button
              onClick={handleActivate}
              disabled={activateMutation.isPending}
            >
              {activateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {actionsCopy.activate}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showDeactivateDialog}
        onOpenChange={(open) => {
          if (!open) closeDeactivateDialog();
          else openDeactivateDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionsCopy.deactivateTitle}</DialogTitle>
            <DialogDescription>
              {actionsCopy.deactivateDescription(client.legalName)}
            </DialogDescription>
          </DialogHeader>
          {lifecycleError ? (
            <Alert variant="destructive">
              <AlertTitle>{actionsCopy.lifecycleErrorTitle}</AlertTitle>
              <AlertDescription className="select-text whitespace-pre-wrap break-words">
                {lifecycleError}
              </AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDeactivateDialog}
              disabled={deactivateMutation.isPending}
            >
              {actionsCopy.cancel}
            </Button>
            <Button
              onClick={handleDeactivate}
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {actionsCopy.deactivate}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  const deleteDialog = (
    <Dialog
      open={showDeleteDialog}
      onOpenChange={(open) => {
        if (!open) closeDeleteDialog();
        else openDeleteDialog();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{actionsCopy.deleteTitle}</DialogTitle>
          <DialogDescription>
            {actionsCopy.deleteDescription(client.legalName)}
          </DialogDescription>
        </DialogHeader>
        {deleteError ? (
          <Alert variant="destructive">
            <AlertTitle>{actionsCopy.deleteErrorTitle}</AlertTitle>
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
            {actionsCopy.cancel}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {actionsCopy.delete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: Dropdown variant (lista) — sin Activar/Desactivar (D1)
  // ══════════════════════════════════════════════════════════════════════════
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
              Ver detalle
            </DropdownMenuItem>

            {canEdit ? (
              <DropdownMenuItem
                onClick={handleEdit}
                title={actionsCopy.editTitle}
              >
                <Pencil className="mr-2 h-4 w-4" />
                {actionsCopy.edit}
              </DropdownMenuItem>
            ) : null}

            {canDelete ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={openDeleteDialog}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {actionsCopy.delete}
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>

        {deleteDialog}
      </>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: Buttons variant (detalle — D7)
  // ══════════════════════════════════════════════════════════════════════════
  if (!canEdit && !canDelete && !showView) {
    return null;
  }

  return (
    <>
      <div className="flex max-w-full flex-nowrap items-center justify-end gap-2">
        {showView ? (
          <Button variant="outline" size="sm" onClick={handleView}>
            <Eye className="mr-2 h-4 w-4" />
            Ver
          </Button>
        ) : null}

        {canEdit ? (
          <Button
            variant="default"
            size="sm"
            onClick={handleEdit}
            title={actionsCopy.editTitle}
            disabled={isLoading}
          >
            <Pencil className="mr-2 h-4 w-4" />
            {actionsCopy.edit}
          </Button>
        ) : null}

        {canEdit && client.isActive ? (
          <Button
            variant="outline"
            size="sm"
            onClick={openDeactivateDialog}
            disabled={isLoading}
          >
            <PowerOff className="mr-2 h-4 w-4" />
            {actionsCopy.deactivate}
          </Button>
        ) : null}

        {canEdit && !client.isActive ? (
          <Button
            variant="outline"
            size="sm"
            onClick={openActivateDialog}
            disabled={isLoading}
          >
            <Power className="mr-2 h-4 w-4" />
            {actionsCopy.activate}
          </Button>
        ) : null}

        {canDelete ? (
          <Button
            variant="outline"
            size="sm"
            onClick={openDeleteDialog}
            disabled={isLoading}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {actionsCopy.delete}
          </Button>
        ) : null}
      </div>

      {lifecycleDialogs}
      {deleteDialog}
    </>
  );
}

export default ClientActions;
