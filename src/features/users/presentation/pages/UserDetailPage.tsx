import { useParams } from "react-router-dom";
import { AlertCircle, Clock, KeyRound, Shield, User, UserRound } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { DetailPageShell } from "@shared/ui/page-shells/DetailPageShell";
import { InfoRow, type StatCardProps } from "@shared/ui/data-display";
import { ROLE_LABELS } from "@shared/constants/roles";
import { useToast } from "@shared/hooks";
import { useUpdateUserStatus, useUser } from "../../application";
import { UserActions, UserActivitySection } from "../components";
import { UserStatusBadge } from "../config/userStatusConfig";
import { USER_STATUS_LABELS, UserStatus, type UserStatusType } from "../../domain";
import { usersCopy } from "../copy/usersCopy";
import { formatDateTime } from "@shared/utils/dateUtils";

/** Sin max-w propio: mismo techo que el listado (`LayoutShell` max-w-7xl). */
const DETAIL_SHELL_CLASS = "w-full p-4 sm:p-6";

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const userId = id ?? "";
  const { toast } = useToast();

  const { data: user, isLoading, isError } = useUser(userId);

  const statusMutation = useUpdateUserStatus({
    onSuccess: () => {
      toast({
        title: usersCopy.detail.toasts.statusSuccess,
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: usersCopy.detail.toasts.statusError,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (targetUserId: string, status: UserStatusType) => {
    statusMutation.mutate({
      id: targetUserId,
      data: { status },
    });
  };

  if (isLoading) {
    return (
      <DetailPageShell
        className={DETAIL_SHELL_CLASS}
        isLoading
        header={{
          backHref: "/users",
          backLabel: "Volver al listado",
          icon: <User className="h-6 w-6" />,
          iconShape: "circle",
          title: "Usuario",
        }}
      />
    );
  }

  if (isError || !user) {
    return (
      <DetailPageShell
        className={DETAIL_SHELL_CLASS}
        isLoading={false}
        notFound
        notFoundConfig={{
          icon: <AlertCircle />,
          title: "Usuario no encontrado",
          description: "No se encontró el usuario solicitado.",
          backHref: "/users",
          backLabel: "Volver al listado",
        }}
        header={{
          backHref: "/users",
          icon: <User className="h-6 w-6" />,
          iconShape: "circle",
          title: "Usuario",
        }}
      />
    );
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const isInactive = user.status !== UserStatus.ACTIVE;
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;

  const userStats: StatCardProps[] = [
    {
      title: "Rol",
      value: roleLabel,
      tone: "info",
      icon: <Shield className="h-5 w-5" />,
    },
    {
      title: "Estado",
      value: USER_STATUS_LABELS[user.status],
      tone:
        user.status === UserStatus.ACTIVE
          ? "success"
          : user.status === UserStatus.SUSPENDED
            ? "warning"
            : "neutral",
      icon: <UserRound className="h-5 w-5" />,
    },
    {
      title: "Último acceso",
      value: user.lastLogin ? formatDateTime(user.lastLogin) : "Sin registro",
      tone: user.lastLogin ? "primary" : "neutral",
      icon: <Clock className="h-5 w-5" />,
    },
  ];

  return (
    <DetailPageShell
      className={DETAIL_SHELL_CLASS}
      isLoading={false}
      header={{
        backHref: "/users",
        backLabel: "Volver al listado",
        icon: <User className="h-6 w-6" />,
        iconVariant: isInactive ? "muted" : "primary",
        iconShape: "circle",
        title: (
          <span className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1">
            <span className="shrink-0">{fullName}</span>
            <UserStatusBadge status={user.status} showIcon size="sm" />
            <Badge variant="neutral" tone="soft" className="text-xs font-medium">
              {roleLabel}
            </Badge>
          </span>
        ),
        subtitle: (
          <div className="space-y-0.5">
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        ),
        actions: (
          <UserActions
            userId={user.id}
            userName={fullName}
            status={user.status}
            variant="buttons"
            onStatusChange={handleStatusChange}
          />
        ),
      }}
      stats={userStats}
      metadata={{
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        createdBy:
          user.createdByName?.trim() || user.createdBy?.trim() || undefined,
        updatedBy: user.updatedByName?.trim() || undefined,
      }}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserRound className="h-4 w-4" />
                Identidad
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <InfoRow variant="inline" label="Nombre completo" value={fullName} copyable />
              <InfoRow
                variant="inline"
                label={usersCopy.detail.email}
                value={user.email}
                copyable
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <KeyRound className="h-4 w-4" />
                Acceso y seguridad
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <InfoRow variant="inline" label="Rol" value={roleLabel} />
              <InfoRow
                variant="inline"
                label="Último acceso"
                value={formatDateTime(user.lastLogin)}
              />
              <InfoRow
                variant="inline"
                label="Contraseña"
                value="No disponible aquí: solo se almacena un hash seguro. Copia la contraseña al crear el usuario o usa recuperación de acceso."
              />
            </CardContent>
          </Card>
        </div>

        <UserActivitySection userId={user.id} />
      </div>
    </DetailPageShell>
  );
}
