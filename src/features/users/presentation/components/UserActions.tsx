import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, MoreHorizontal, Pencil, Power, PowerOff } from "lucide-react";
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

interface UserActionsProps {
  userId: string;
  userName: string;
  status: UserStatusType;
  variant?: "dropdown" | "buttons";
  onStatusChange?: (id: string, status: UserStatusType) => void;
}

export function UserActions({
  userId,
  userName,
  status,
  variant = "dropdown",
  onStatusChange,
}: UserActionsProps) {
  const navigate = useNavigate();
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

  if (variant === "buttons") {
    return (
      <>
        <div className="flex items-center gap-2">
          {canUpdate ? (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/users/${userId}/edit`);
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
                className={`mr-2 h-4 w-4 ${
                  nextStatus === UserStatus.ACTIVE
                    ? "text-success"
                    : "text-destructive"
                }`}
              />
              {statusActionLabel}
            </Button>
          ) : null}
        </div>
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
            className="h-8 w-8"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Acciones</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => navigate(`/users/${userId}`)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver detalle
          </DropdownMenuItem>
          {canUpdate ? (
            <DropdownMenuItem onClick={() => navigate(`/users/${userId}/edit`)}>
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
            <AlertDialogAction onClick={handleStatusChange}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
