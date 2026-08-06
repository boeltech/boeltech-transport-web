import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, RefreshCw, Trash2 } from "lucide-react";

import { invitationsApi } from "@features/invitations";
import { ROLE_LABELS, type UserRole } from "@shared/constants/roles";
import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import { mapBackendError } from "@shared/utils/errorMapper";
import { formatDateTime } from "@shared/utils/dateUtils";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { cn } from "@shared/lib/utils/cn";

import { usersCopy } from "../copy/usersCopy";
import { invitationsPendingQueryKey } from "./invitationsPendingQueryKey";

interface PendingInvitationsPanelProps {
  className?: string;
}

/**
 * Invitaciones pendientes con reenvío y cancelación (API).
 * Solo visible con permiso de listado de usuarios.
 */
export function PendingInvitationsPanel({
  className,
}: PendingInvitationsPanelProps) {
  const copy = usersCopy.invitations;
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canList = hasPermission("users", "read");
  const canManage = hasPermission("users", "create");

  const { data, isLoading, isError } = useQuery({
    queryKey: invitationsPendingQueryKey,
    queryFn: () => invitationsApi.listPending({ limit: 30 }),
    enabled: canList,
  });

  const resend = useMutation({
    mutationFn: (id: string) => invitationsApi.resend(id),
    onSuccess: (r) => {
      toast({ title: r.message, variant: "success" });
      void queryClient.invalidateQueries({ queryKey: invitationsPendingQueryKey });
    },
    onError: (e: unknown) => {
      toast({
        title: copy.resendError,
        description: mapBackendError(e).message,
        variant: "destructive",
      });
    },
  });

  const cancel = useMutation({
    mutationFn: (id: string) => invitationsApi.cancel(id),
    onSuccess: (r) => {
      toast({ title: r.message, variant: "success" });
      void queryClient.invalidateQueries({ queryKey: invitationsPendingQueryKey });
    },
    onError: (e: unknown) => {
      toast({
        title: copy.cancelError,
        description: mapBackendError(e).message,
        variant: "destructive",
      });
    },
  });

  if (!canList) {
    return null;
  }

  const rows = data?.data ?? [];

  if (!isLoading && rows.length === 0 && !isError) {
    return null;
  }

  return (
    <Card className={cn("border-dashed", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <div>
            <CardTitle className="text-base">{copy.title}</CardTitle>
            <CardDescription>{copy.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {copy.loading}
          </div>
        ) : isError ? (
          <p className="text-sm text-destructive">{copy.error}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{copy.columns.email}</TableHead>
                <TableHead>{copy.columns.role}</TableHead>
                <TableHead>{copy.columns.expires}</TableHead>
                <TableHead className="text-right">
                  {copy.columns.actions}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.email}</TableCell>
                  <TableCell>
                    {ROLE_LABELS[inv.role as UserRole] ?? inv.role}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(inv.expiresAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage ? (
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title={copy.resend}
                          aria-label={copy.resend}
                          disabled={resend.isPending || cancel.isPending}
                          onClick={() => resend.mutate(inv.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title={copy.cancel}
                          aria-label={copy.cancel}
                          disabled={resend.isPending || cancel.isPending}
                          onClick={() => cancel.mutate(inv.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
