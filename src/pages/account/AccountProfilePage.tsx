/**
 * Tab Datos — personales, correo (fuera del form), Tu acceso, tarjeta Seguridad (MC4–MC6).
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Mail } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  authApi,
  MFA_STATUS_QUERY_KEY,
  myProfileSchema,
  useAuth,
  useCancelEmailChange,
  useResendEmailChange,
  useUpdateMyProfile,
  type MyProfileFormData,
} from "@features/auth";
import { ROLE_LABELS, type UserRole } from "@shared/constants/roles";
import { AlertWithIcon } from "@shared/ui/alert";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { FormStickyActions, RHFTextField } from "@shared/ui/form";
import { useToast } from "@shared/hooks/useToast";
import { mapBackendError } from "@shared/utils/errorMapper";
import { formatDateTime } from "@shared/utils/dateUtils";
import { accountCopy } from "./accountCopy";
import { ChangeEmailSheet } from "./components/ChangeEmailSheet";

function dirtySummary(
  dirtyFields: Partial<Record<keyof MyProfileFormData, boolean>>,
): string {
  const first = Boolean(dirtyFields.firstName);
  const last = Boolean(dirtyFields.lastName);
  if (first && last) return accountCopy.personal.dirtyBoth;
  if (first) return accountCopy.personal.dirtyFirstName;
  if (last) return accountCopy.personal.dirtyLastName;
  return accountCopy.personal.dirtyBoth;
}

function formatPendingExpiry(expiresAt: Date | null | undefined): string {
  if (!expiresAt) return "en 24 horas";
  try {
    return formatDateTime(expiresAt.toISOString());
  } catch {
    return "en 24 horas";
  }
}

export function AccountProfilePage() {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { updateProfile, isPending: isSaving } = useUpdateMyProfile();
  const { cancelEmailChange, isPending: isCanceling } = useCancelEmailChange();
  const { resendEmailChange, isPending: isResendingPending } =
    useResendEmailChange();

  const [emailSheetOpen, setEmailSheetOpen] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);

  const mfaQuery = useQuery({
    queryKey: MFA_STATUS_QUERY_KEY,
    queryFn: () => authApi.getMfaStatus(),
    enabled: Boolean(user),
  });

  const form = useForm<MyProfileFormData, unknown, MyProfileFormData>({
    resolver: zodResolver(myProfileSchema) as Resolver<MyProfileFormData>,
    defaultValues: {
      firstName: "",
      lastName: "",
    },
    values: user
      ? {
          firstName: user.firstName,
          lastName: user.lastName,
        }
      : undefined,
  });

  const isDirty = form.formState.isDirty;

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await updateProfile({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
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

  const handleDiscard = () => {
    form.reset({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
    });
  };

  const handleResendVerification = async () => {
    setResendingVerification(true);
    try {
      const result = await authApi.resendEmailVerification();
      toast({
        title: accountCopy.toast.verificationResentTitle,
        description: result.message,
        variant: "success",
      });
    } catch (error) {
      const mapped = mapBackendError(error);
      toast({
        title: accountCopy.toast.emailChangeFailedTitle,
        description: mapped.message,
        variant: "destructive",
      });
    } finally {
      setResendingVerification(false);
    }
  };

  const handleConfirmVerification = async () => {
    setCheckingVerification(true);
    try {
      const updated = await refreshProfile();
      if (updated?.emailVerifiedAt != null) {
        toast({
          title: accountCopy.toast.verificationConfirmedTitle,
          variant: "success",
        });
        return;
      }
      toast({
        title: accountCopy.toast.verificationStillPending,
        variant: "default",
      });
    } catch (error) {
      const mapped = mapBackendError(error);
      toast({
        title: accountCopy.toast.saveFailedTitle,
        description: mapped.message,
        variant: "destructive",
      });
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleResendPending = async () => {
    try {
      await resendEmailChange();
      toast({
        title: accountCopy.toast.emailChangeResentTitle,
        variant: "success",
      });
    } catch (error) {
      const mapped = mapBackendError(error);
      toast({
        title: accountCopy.toast.emailChangeFailedTitle,
        description: mapped.message,
        variant: "destructive",
      });
    }
  };

  const handleCancelPending = async () => {
    try {
      await cancelEmailChange();
      toast({
        title: accountCopy.toast.emailChangeCanceledTitle,
        variant: "success",
      });
    } catch (error) {
      const mapped = mapBackendError(error);
      toast({
        title: accountCopy.toast.emailChangeCancelFailedTitle,
        description: mapped.message,
        variant: "destructive",
      });
    }
  };

  const securityDescription = useMemo(() => {
    if (mfaQuery.isLoading) return accountCopy.securityCard.mfaLoading;
    if (mfaQuery.data?.enabled) return accountCopy.securityCard.mfaOn;
    return accountCopy.securityCard.mfaOff;
  }, [mfaQuery.data?.enabled, mfaQuery.isLoading]);

  if (!user) return null;

  const roleLabel = ROLE_LABELS[user.role as UserRole] ?? user.role;
  const lastLoginLabel = user.lastLogin
    ? formatDateTime(user.lastLogin.toISOString())
    : accountCopy.access.lastLoginEmpty;
  const emailVerified = user.emailVerifiedAt != null;
  const pendingEmail =
    typeof user.pendingEmail === "string" && user.pendingEmail.trim()
      ? user.pendingEmail.trim()
      : null;
  const pendingBusy = isResendingPending || isCanceling;
  const verificationBusy = resendingVerification || checkingVerification;

  return (
    <div className="space-y-6 pb-24">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)]">
        <div className="space-y-6 min-w-0">
          <Card>
            <CardHeader>
              <CardTitle>{accountCopy.personal.title}</CardTitle>
              <CardDescription>
                {accountCopy.personal.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                id="account-profile-form"
                onSubmit={onSubmit}
                className="space-y-4"
                noValidate
              >
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
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>{accountCopy.email.title}</CardTitle>
                  <Badge
                    variant={emailVerified ? "success" : "warning"}
                    tone="soft"
                  >
                    {emailVerified
                      ? accountCopy.email.badgeVerified
                      : accountCopy.email.badgeUnverified}
                  </Badge>
                </div>
                <CardDescription>
                  {emailVerified
                    ? accountCopy.email.descriptionVerified
                    : accountCopy.email.descriptionUnverified}
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                disabled={Boolean(pendingEmail) || isSaving}
                onClick={() => setEmailSheetOpen(true)}
              >
                {accountCopy.email.changeCta}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex min-h-9 items-center gap-2.5 text-sm">
                <Mail
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span className="min-w-0 break-all">{user.email}</span>
              </div>

              {pendingEmail ? (
                <div className="space-y-3">
                  <AlertWithIcon
                    variant="info"
                    title={accountCopy.email.pendingTitle(pendingEmail)}
                  >
                    <p className="text-sm">
                      {accountCopy.email.pendingBody(
                        formatPendingExpiry(user.pendingEmailExpiresAt),
                      )}
                    </p>
                  </AlertWithIcon>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pendingBusy}
                      onClick={() => void handleResendPending()}
                    >
                      {isResendingPending ? (
                        <>
                          <Loader2
                            className="mr-2 h-4 w-4 animate-spin"
                            aria-hidden
                          />
                          {accountCopy.email.pendingResending}
                        </>
                      ) : (
                        accountCopy.email.pendingResend
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={pendingBusy}
                      onClick={() => void handleCancelPending()}
                    >
                      {isCanceling
                        ? accountCopy.email.pendingCanceling
                        : accountCopy.email.pendingCancel}
                    </Button>
                  </div>
                </div>
              ) : null}

              {!emailVerified && !pendingEmail ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={verificationBusy}
                    onClick={() => void handleResendVerification()}
                  >
                    {resendingVerification
                      ? accountCopy.email.resendVerificationSending
                      : accountCopy.email.resendVerification}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={verificationBusy}
                    onClick={() => void handleConfirmVerification()}
                  >
                    {checkingVerification
                      ? accountCopy.email.confirmVerificationChecking
                      : accountCopy.email.confirmVerification}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {accountCopy.access.title}
              </CardTitle>
              <CardDescription>{accountCopy.access.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">
                    {accountCopy.access.organization}
                  </dt>
                  <dd className="text-right font-medium">
                    {user.getTenantName()}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">
                    {accountCopy.access.companyCode}
                  </dt>
                  <dd className="font-mono text-right">
                    {user.getSubdomain()}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">
                    {accountCopy.access.role}
                  </dt>
                  <dd className="text-right font-medium">{roleLabel}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">
                    {accountCopy.access.lastLogin}
                  </dt>
                  <dd className="text-right">{lastLoginLabel}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {accountCopy.securityCard.title}
              </CardTitle>
              <CardDescription>{securityDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild type="button" variant="outline" size="sm">
                <Link to="/account/security">
                  {accountCopy.securityCard.goSecurity}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      {isDirty ? (
        <FormStickyActions sticky className="justify-between gap-4">
          <span className="text-xs text-muted-foreground">
            {dirtySummary(form.formState.dirtyFields)}
          </span>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              disabled={isSaving}
              onClick={handleDiscard}
            >
              {accountCopy.personal.discard}
            </Button>
            <Button
              type="submit"
              form="account-profile-form"
              disabled={isSaving}
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
        </FormStickyActions>
      ) : null}

      <ChangeEmailSheet
        open={emailSheetOpen}
        onOpenChange={setEmailSheetOpen}
        currentEmail={user.email}
      />
    </div>
  );
}

export default AccountProfilePage;
