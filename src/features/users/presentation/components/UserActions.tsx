/**
 * UserActions
 *
 * - dropdown (lista): ver / editar / Activar|Desactivar (D1 — excepción acceso admin).
 * - buttons (detalle): Editar primary; Activar/Desactivar outline (D6).
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMasterActionFrom } from "@shared/utils/masterWayfinding";
import { Eye, MoreHorizontal, Pencil, Power, PowerOff } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
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
import { UserStatus, type UserStatusType } from "../../domain";
import { usersCopy } from "../copy/usersCopy";

interface UserActionsProps {
  userId: string;
  userName: string;
  status: UserStatusType;
  variant?: "dropdown" | "buttons";
  fromState?: { from: string };
  onStatusChange?: (id: string, status: UserStatusType) => void;
  /** Clase del trigger ⋯ (p. ej. entityListCardMenuTriggerClassName en cards). */
  menuTriggerClassName?: string;
  /** aria-label del trigger ⋯. */
  menuAriaLabel?: string;
}

export function UserActions({
  userId,
  userName,
  status,
  variant = "dropdown",
  fromState: fromStateProp,
  onStatusChange,
  menuTriggerClassName,
  menuAriaLabel = usersCopy.list.card.actionsAria,
}: UserActionsProps) {
  const navigate = useNavigate();
  const listFromState = useMasterActionFrom("/users");
  const fromState = fromStateProp ?? listFromState;
  const { hasPermission } = usePermissions();
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);

  const canUpdate = hasPermission("users", "update");
  const canUpdateStatus = hasPermission("users", "delete");

  const nextStatus = useMemo<UserStatusType>(
    () => (status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE),
    [status],
  );

  const statusActionLabel =
    nextStatus === UserStatus.ACTIVE ? "Activar usuario" : "Desactivar usuario";
  const StatusIcon = nextStatus === UserStatus.ACTIVE ? Power : PowerOff;

  const handleStatusChange = () => {
    onStatusChange?.(userId, nextStatus);
    setConfirmStatusOpen(false);
  };

  const statusConfirmDialog = (
    <AlertDialog open={confirmStatusOpen} onOpenChange={setConfirmStatusOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{statusActionLabel}</AlertDialogTitle>
          <AlertDialogDescription>
            {nextStatus === UserStatus.ACTIVE
              ? `Se reactivará el acceso de ${userName}.`
              : `Se bloqueará el inicio de sesión de ${userName}. Las sesiones con refresh token suelen invalidarse de inmediato en el servidor.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleStatusChange}>
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (variant === "buttons") {
    return (
      <>
        <div className="flex max-w-full flex-nowrap items-center justify-end gap-2">
          {canUpdate ? (
            <Button
              variant="default"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/users/${userId}/edit`, { state: fromState });
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          ) : null}
          {canUpdateStatus ? (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmStatusOpen(true);
              }}
            >
              <StatusIcon
                className={cn(
                  "mr-2 h-4 w-4",
                  nextStatus === UserStatus.ACTIVE
                    ? "text-success"
                    : "text-destructive",
                )}
              />
              {statusActionLabel}
            </Button>
          ) : null}
        </div>
        {statusConfirmDialog}
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", menuTriggerClassName)}
            aria-label={menuAriaLabel}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{menuAriaLabel}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() =>
              navigate(`/users/${userId}`, { state: fromState })
            }
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver detalle
          </DropdownMenuItem>
          {canUpdate ? (
            <DropdownMenuItem
              onClick={() =>
                navigate(`/users/${userId}/edit`, { state: fromState })
              }
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
          ) : null}
          {canUpdateStatus ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className={
                  nextStatus === UserStatus.ACTIVE
                    ? "text-success focus:text-success"
                    : "text-destructive focus:text-destructive focus:bg-destructive/10"
                }
                onClick={() => setConfirmStatusOpen(true)}
              >
                <StatusIcon className="mr-2 h-4 w-4" />
                {statusActionLabel}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      {statusConfirmDialog}
    </>
  );
}
