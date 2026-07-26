/**
 * Tab Datos — datos personales + meta de cuenta.
 */

import { useCallback } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useAuth,
  useUpdateMyProfile,
  myProfileSchema,
  type MyProfileFormData,
} from "@features/auth";
import { ROLE_LABELS, type UserRole } from "@shared/constants/roles";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { RHFTextField } from "@shared/ui/form";
import { useToast } from "@shared/hooks/useToast";
import { mapBackendError } from "@shared/utils/errorMapper";
import { formatDateTime } from "@shared/utils/dateUtils";
import { accountCopy } from "./accountCopy";

export function AccountProfilePage() {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { updateProfile, isPending: isSaving } = useUpdateMyProfile();

  const form = useForm<MyProfileFormData, unknown, MyProfileFormData>({
    resolver: zodResolver(myProfileSchema) as Resolver<MyProfileFormData>,
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
    values: user
      ? {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        }
      : undefined,
  });

  const handleRefresh = useCallback(async () => {
    try {
      await refreshProfile();
      toast({
        title: accountCopy.toast.refreshedTitle,
        description: accountCopy.toast.refreshedDescription,
        variant: "success",
      });
    } catch (error) {
      const mapped = mapBackendError(error);
      toast({
        title: accountCopy.toast.refreshFailedTitle,
        description: mapped.message,
        variant: "destructive",
      });
    }
  }, [refreshProfile, toast]);

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await updateProfile({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
      });
      toast({
        title: accountCopy.toast.savedTitle,
        description: accountCopy.toast.savedDescription,
        variant: "success",
      });
    } catch (error) {
      const mapped = mapBackendError(error);
      toast({
        title: accountCopy.toast.saveFailedTitle,
        description: mapped.message,
        variant: "destructive",
      });
    }
  });

  if (!user) return null;

  const roleLabel = ROLE_LABELS[user.role as UserRole] ?? user.role;
  const lastLoginLabel = user.lastLogin
    ? formatDateTime(user.lastLogin.toISOString())
    : accountCopy.meta.lastLoginEmpty;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{accountCopy.personal.title}</CardTitle>
          <CardDescription>{accountCopy.personal.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <RHFTextField
                control={form.control}
                name="firstName"
                label={accountCopy.personal.firstName}
                autoComplete="given-name"
                disabled={isSaving}
              />
              <RHFTextField
                control={form.control}
                name="lastName"
                label={accountCopy.personal.lastName}
                autoComplete="family-name"
                disabled={isSaving}
              />
            </div>
            <RHFTextField
              control={form.control}
              name="email"
              label={accountCopy.personal.email}
              type="email"
              autoComplete="email"
              disabled={isSaving}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSaving || !form.formState.isDirty}
              >
                {isSaving ? (
                  <>
                    <Loader2
                      className="mr-2 h-4 w-4 animate-spin"
                      aria-hidden
                    />
                    {accountCopy.personal.saving}
                  </>
                ) : (
                  accountCopy.personal.save
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>{accountCopy.meta.title}</CardTitle>
            <CardDescription>{accountCopy.meta.description}</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-2"
            disabled={isSaving}
            onClick={() => void handleRefresh()}
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            {accountCopy.meta.refresh}
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          <dl className="grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {accountCopy.meta.role}
              </dt>
              <dd className="mt-1 text-sm font-medium">{roleLabel}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {accountCopy.meta.organization}
              </dt>
              <dd className="mt-1 text-sm font-medium">
                {user.getTenantName()}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {accountCopy.meta.subdomain}
              </dt>
              <dd className="mt-1 font-mono text-sm">{user.getSubdomain()}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {accountCopy.meta.lastLogin}
              </dt>
              <dd className="mt-1 text-sm">{lastLoginLabel}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

export default AccountProfilePage;
