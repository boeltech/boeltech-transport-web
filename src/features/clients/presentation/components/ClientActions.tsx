/**
 * ClientActions Component
 * Clean Architecture - Presentation Layer
 *
 * Menú de acciones para cliente: editar, activar/desactivar, eliminar.
 * Soporta dos variantes: dropdown (tabla) y buttons (detalle).
 *
 * Ubicación: src/features/clients/presentation/components/ClientActions.tsx
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  MoreHorizontal,
  Eye,
  Pencil,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react";
// import { usePermissions } from "@shared/hooks/use-permissions";
import { usePermissions } from "@shared/permissions";

import type { ClientListItem } from "../../domain";
import {
  useActivateClient,
  useDeactivateClient,
  useDeleteClient,
} from "../../application";

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
   * Útil para abrir un Sheet/Drawer de edición desde la página de detalle.
   */
  onEdit?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ClientActions({
  client,
  variant = "dropdown",
  showView = false,
  onEdit,
}: ClientActionsProps) {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  // Mutations
  const activateMutation = useActivateClient();
  const deactivateMutation = useDeactivateClient();
  const deleteMutation = useDeleteClient();

  // Dialogs state
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Permissions
  const canEdit = hasPermission("clients", "update");
  const canDelete = hasPermission("clients", "delete");

  // Handlers
  const handleView = () => {
    navigate(`/clients/${client.id}`);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
      return;
    }
    // Backward-compat: navega a la URL de edición.
    // El detalle del cliente intercepta `?edit=true` para abrir el Sheet.
    navigate(`/clients/${client.id}?edit=true`);
  };

  const handleActivate = () => {
    activateMutation.mutate(client.id);
  };

  const handleDeactivate = () => {
    deactivateMutation.mutate(client.id);
    setShowDeactivateDialog(false);
  };

  const handleDelete = () => {
    deleteMutation.mutate(client.id, {
      onSuccess: () => {
        setShowDeleteDialog(false);
        // Si estamos en el detalle, navegar a la lista
        if (variant === "buttons") {
          navigate("/clients", { replace: true });
        }
      },
    });
  };

  const isLoading =
    activateMutation.isPending ||
    deactivateMutation.isPending ||
    deleteMutation.isPending;

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: Dropdown variant (para tabla)
  // ══════════════════════════════════════════════════════════════════════════
  if (variant === "dropdown") {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={isLoading}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleView}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalle
            </DropdownMenuItem>

            {canEdit && (
              <DropdownMenuItem onClick={handleEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
            )}

            {canEdit && (
              <>
                <DropdownMenuSeparator />
                {client.isActive ? (
                  <DropdownMenuItem
                    onClick={() => setShowDeactivateDialog(true)}
                  >
                    <PowerOff className="mr-2 h-4 w-4" />
                    Desactivar
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={handleActivate}>
                    <Power className="mr-2 h-4 w-4" />
                    Activar
                  </DropdownMenuItem>
                )}
              </>
            )}

            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dialogs */}
        <DeactivateDialog
          open={showDeactivateDialog}
          onOpenChange={setShowDeactivateDialog}
          onConfirm={handleDeactivate}
          clientName={client.legalName}
          isLoading={deactivateMutation.isPending}
        />

        <DeleteDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleDelete}
          clientName={client.legalName}
          isLoading={deleteMutation.isPending}
        />
      </>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: Buttons variant (para detalle — alineado con DriverActions / Employee)
  // ══════════════════════════════════════════════════════════════════════════
  if (!canEdit && !canDelete && !showView) {
    return null;
  }

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {showView && (
          <Button variant="outline" size="sm" onClick={handleView}>
            <Eye className="mr-2 h-4 w-4" />
            Ver
          </Button>
        )}

        {canEdit && (
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        )}

        {canEdit && client.isActive && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeactivateDialog(true)}
            disabled={isLoading}
          >
            <PowerOff className="mr-2 h-4 w-4" />
            Desactivar
          </Button>
        )}

        {canEdit && !client.isActive && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleActivate}
            disabled={isLoading}
          >
            <Power className="mr-2 h-4 w-4" />
            Activar
          </Button>
        )}

        {canDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        )}
      </div>

      {/* Dialogs */}
      <DeactivateDialog
        open={showDeactivateDialog}
        onOpenChange={setShowDeactivateDialog}
        onConfirm={handleDeactivate}
        clientName={client.legalName}
        isLoading={deactivateMutation.isPending}
      />

      <DeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        clientName={client.legalName}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}

// ============================================================================
// DIALOGS
// ============================================================================

interface DeactivateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  clientName: string;
  isLoading: boolean;
}

function DeactivateDialog({
  open,
  onOpenChange,
  onConfirm,
  clientName,
  isLoading,
}: DeactivateDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Desactivar cliente?</AlertDialogTitle>
          <AlertDialogDescription>
            El cliente <strong>{clientName}</strong> seguirá en el catálogo, pero
            quedará <strong>inactivo</strong> (no podrá asignarse a nuevos
            viajes). Podrás reactivarlo cuando quieras. No elimina el registro
            del sistema.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Desactivando..." : "Desactivar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  clientName: string;
  isLoading: boolean;
}

function DeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  clientName,
  isLoading,
}: DeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
          <AlertDialogDescription>
            Se dará de baja a <strong>{clientName}</strong> (
            <strong>borrado lógico</strong>). A diferencia de desactivar, deja
            de mostrarse como cliente disponible en el listado y no podrás
            seguir operando su ficha como hasta ahora.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ClientActions;
