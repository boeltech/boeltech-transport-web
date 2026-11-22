/**
 * Sheet «Cambiar correo» — pedir contraseña → enlace enviado (MC4).
 */

import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  emailChangeRequestSchema,
  useRequestEmailChange,
  useResendEmailChange,
  type EmailChangeRequestFormData,
} from "@features/auth";
import { AlertWithIcon } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import {
  Form,
  FormField,
  FormFieldShell,
  getFieldErrorAriaProps,
  RHFTextField,
} from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { useToast } from "@shared/hooks/useToast";
import { mapBackendError } from "@shared/utils/errorMapper";
import { accountCopy } from "../accountCopy";

type ChangeEmailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
};

export function ChangeEmailSheet({
  open,
  onOpenChange,
  currentEmail,
}: ChangeEmailSheetProps) {
  const { toast } = useToast();
  const { requestEmailChange, isPending: isRequesting } =
    useRequestEmailChange();
  const { resendEmailChange, isPending: isResending } = useResendEmailChange();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<
    EmailChangeRequestFormData,
    unknown,
    EmailChangeRequestFormData
  >({
    resolver: zodResolver(
      emailChangeRequestSchema,
    ) as Resolver<EmailChangeRequestFormData>,
    defaultValues: {
      newEmail: "",
      currentPassword: "",
    },
    mode: "onSubmit",
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSentTo(null);
      setShowPassword(false);
      form.reset({ newEmail: "", currentPassword: "" });
    }
    onOpenChange(next);
  };

  const busy = isRequesting || isResending;

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      const result = await requestEmailChange({
        newEmail: data.newEmail.trim(),
        currentPassword: data.currentPassword,
      });
      setSentTo(result.pendingEmail);
      toast({
        title: accountCopy.toast.emailChangeSentTitle,
        description: accountCopy.toast.emailChangeSentDescription,
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
  });

  const handleResend = async () => {
    try {
      const result = await resendEmailChange();
      setSentTo(result.pendingEmail);
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

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md"
      >
        {sentTo ? (
          <>
            <SheetHeader className="text-left">
              <SheetTitle>{accountCopy.emailSheet.sentTitle(sentTo)}</SheetTitle>
              <SheetDescription>
                {accountCopy.emailSheet.sentBody}
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-1 flex-col gap-4 px-1 pb-6 pt-2">
              <AlertWithIcon
                variant="info"
                title={accountCopy.emailSheet.sentAlertTitle}
              >
                <p className="text-sm">
                  {accountCopy.emailSheet.sentAlertBody(currentEmail)}
                </p>
              </AlertWithIcon>
            </div>
            <SheetFooter className="flex flex-row justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => void handleResend()}
              >
                {isResending ? (
                  <>
                    <Loader2
                      className="mr-2 h-4 w-4 animate-spin"
                      aria-hidden
                    />
                    {accountCopy.email.pendingResending}
                  </>
                ) : (
                  accountCopy.emailSheet.sentResend
                )}
              </Button>
              <Button
                type="button"
                disabled={busy}
                onClick={() => handleOpenChange(false)}
              >
                {accountCopy.emailSheet.sentDone}
              </Button>
            </SheetFooter>
          </>
        ) : (
          <>
            <SheetHeader className="text-left">
              <SheetTitle>{accountCopy.emailSheet.title}</SheetTitle>
              <SheetDescription>
                {accountCopy.emailSheet.description}
              </SheetDescription>
            </SheetHeader>
            <Form {...form}>
              <form
                onSubmit={onSubmit}
                className="flex flex-1 flex-col gap-5 px-1 pb-6 pt-2"
                noValidate
              >
                <FormFieldShell
                  fieldId="email-change-current"
                  label={accountCopy.emailSheet.currentEmail}
                >
                  <Input
                    id="email-change-current"
                    value={currentEmail}
                    readOnly
                    tabIndex={-1}
                    className="bg-muted text-muted-foreground"
                  />
                </FormFieldShell>
                <RHFTextField
                  control={form.control}
                  name="newEmail"
                  label={accountCopy.emailSheet.newEmail}
                  type="email"
                  autoComplete="email"
                  disabled={busy}
                />
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field, fieldState }) => {
                    const fieldId = "email-change-current-password";
                    const errorMessage = fieldState.error?.message;
                    return (
                      <FormFieldShell
                        fieldId={fieldId}
                        label={accountCopy.emailSheet.currentPassword}
                        description={accountCopy.emailSheet.passwordHint}
                        errorMessage={errorMessage}
                      >
                        <div className="flex min-w-0 flex-1 gap-2">
                          <Input
                            id={fieldId}
                            {...field}
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            disabled={busy}
                            className="min-w-0 flex-1"
                            error={Boolean(fieldState.error)}
                            {...getFieldErrorAriaProps(fieldId, errorMessage)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            aria-label={
                              showPassword
                                ? "Ocultar contraseña"
                                : "Mostrar contraseña"
                            }
                            disabled={busy}
                            onClick={() => setShowPassword((prev) => !prev)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" aria-hidden />
                            ) : (
                              <Eye className="h-4 w-4" aria-hidden />
                            )}
                          </Button>
                        </div>
                      </FormFieldShell>
                    );
                  }}
                />
                <SheetFooter className="mt-auto flex flex-row justify-end gap-2 border-t pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => handleOpenChange(false)}
                  >
                    {accountCopy.emailSheet.cancel}
                  </Button>
                  <Button type="submit" disabled={busy}>
                    {isRequesting ? (
                      <>
                        <Loader2
                          className="mr-2 h-4 w-4 animate-spin"
                          aria-hidden
                        />
                        {accountCopy.emailSheet.submitting}
                      </>
                    ) : (
                      accountCopy.emailSheet.submit
                    )}
                  </Button>
                </SheetFooter>
              </form>
            </Form>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
