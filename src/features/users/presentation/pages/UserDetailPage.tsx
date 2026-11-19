import { Link, useParams } from "react-router-dom";
import {
  MODULE_LIST_PATH_LABELS,
  resolveDetailCrumbs,
  useMasterActionFrom,
} from "@shared/utils/masterWayfinding";
import { useIncomingWayfinding } from "@shared/utils/listQueueFrom";
import { AlertCircle, Clock, KeyRound, Shield, UserRound } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { DetailPageShell } from "@shared/ui/page-shells/DetailPageShell";
import { InfoRow, type StatCardProps } from "@shared/ui/data-display";
import { ROLE_LABELS } from "@shared/constants/roles";
import { useToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import {
  PolicyOrphanConfirmDialog,
  usePolicyOrphanConfirmation,
} from "@features/approval-policies";
import { useUpdateUserStatus, useUser } from "../../application";
import { UserActions, UserActivitySection } from "../components";
import { UserStatusBadge } from "../config/userStatusConfig";
import { USER_STATUS_LABELS, UserStatus, type UserStatusType } from "../../domain";
import { usersCopy } from "../copy/usersCopy";
import { formatDateTime } from "@shared/utils/dateUtils";
import { USERS_LIST_PATH } from "../utils/userWayfinding";

/** Sin max-w propio: mismo techo que el listado (`LayoutShell` max-w-7xl). */
const DETAIL_SHELL_CLASS = "w-full p-4 sm:p-6";
const USERS_MODULE_LABEL =
  MODULE_LIST_PATH_LABELS[USERS_LIST_PATH] ?? "Usuarios";

function useUserDetailCrumbs(currentLabel: string) {
  const incoming = useIncomingWayfinding();
  return resolveDetailCrumbs({
    from: incoming?.from,
    fromLabel: incoming?.fromLabel,
    module: { listPath: USERS_LIST_PATH, label: USERS_MODULE_LABEL },
    current: { label: currentLabel },
  });
}

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const userId = id ?? "";
  const fromState = useMasterActionFrom(USERS_LIST_PATH);
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canReadEmployees = hasPermission("employees", "read");

  const { data: user, isLoading, isError } = useUser(userId);
  const crumbs = useUserDetailCrumbs(
    user
      ? `${user.firstName} ${user.lastName}`.trim() || "Usuario"
      : "Usuario",
  );

  const orphanGuard = usePolicyOrphanConfirmation();
  const statusMutation = useUpdateUserStatus({
    onSuccess: () => {
      toast({
        title: usersCopy.detail.toasts.statusSuccess,
        variant: "success",
      });
    },
    onError: (error, variables) => {
      const retry = () =>
        statusMutation.mutate({
          ...variables,
          data: { ...variables.data, confirmPolicyOrphan: true },
        });
      if (orphanGuard.intercept(error, retry)) return;
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
          crumbs,
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
          crumbs,
          title: "Usuario",
        }}
      />
    );
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim();
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
        crumbs,
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
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        ),
        actions: (
          <UserActions
            userId={user.id}
            userName={fullName}
            status={user.status}
            variant="buttons"
            fromState={fromState}
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
              {user.employeeId && canReadEmployees ? (
                <div className="mt-3">
                  <Button type="button" size="sm" variant="outline" asChild>
                    <Link
                      to={`/employees/${user.employeeId}`}
                      state={{ from: `/users/${user.id}`, fromLabel: fullName }}
                    >
                      {usersCopy.detail.viewEmployee}
                    </Link>
                  </Button>
                </div>
              ) : null}
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

        <UserActivitySection
          userId={user.id}
          fromState={{ from: `/users/${user.id}` }}
        />
      </div>
      <PolicyOrphanConfirmDialog
        {...orphanGuard.dialog}
        pending={statusMutation.isPending}
      />
    </DetailPageShell>
  );
}
