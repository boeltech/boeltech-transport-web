/**
 * Cambio de contraseña (Mi cuenta): flujo en Sheet + checklist de requisitos.
 */

import { useCallback, useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, Lock, Sparkles, Check, Circle } from "lucide-react";

import {
  useAuth,
  useChangePassword,
  changePasswordFormSchema,
  type ChangePasswordFormData,
} from "@features/auth";
import { userQueryKeys } from "@features/users";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { generateSecurePassword } from "@shared/utils/generateSecurePassword";
import { mapBackendError } from "@shared/utils/errorMapper";
import {
  arePasswordRequirementsMet,
  getPasswordRequirementStatus,
} from "@shared/utils/passwordRequirementStatus";
import { cn } from "@shared/lib/utils/cn";

function PasswordRequirementsList({ password }: { password: string }) {
  const s = getPasswordRequirementStatus(password);
  const items: { key: keyof typeof s; label: string; met: boolean }[] = [
    { key: "minLength", label: "Al menos 8 caracteres", met: s.minLength },
    { key: "hasUppercase", label: "Una letra mayúscula", met: s.hasUppercase },
    { key: "hasLowercase", label: "Una letra minúscula", met: s.hasLowercase },
    { key: "hasDigit", label: "Un número", met: s.hasDigit },
  ];

  return (
    <ul
      className="grid gap-1.5 text-sm sm:grid-cols-2"
      aria-label="Requisitos de la nueva contraseña"
    >
      {items.map(({ key, label, met }) => (
        <li
          key={key}
          className={cn(
            "flex items-center gap-2 rounded-md border px-2 py-1.5 transition-colors",
            met
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
              : "border-border bg-muted/30 text-muted-foreground",
          )}
        >
          {met ? (
            <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
          ) : (
            <Circle className="h-4 w-4 shrink-0 opacity-40" aria-hidden />
          )}
          <span>
            <span className="sr-only">{met ? "Cumplido: " : "Pendiente: "}</span>
            {label}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function PasswordChangeSection() {
  const queryClient = useQueryClient();
  const { user, applySessionTokens } = useAuth();
  const { toast } = useToast();
  const {
    changePassword,
    isPending: isPasswordSaving,
    reset: resetPasswordMutation,
  } = useChangePassword();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordForm = useForm<
    ChangePasswordFormData,
    unknown,
    ChangePasswordFormData
  >({
    resolver: zodResolver(
      changePasswordFormSchema,
    ) as Resolver<ChangePasswordFormData>,
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const currentPasswordValue = useWatch({
    control: passwordForm.control,
    name: "currentPassword",
    defaultValue: "",
  });
  const newPasswordValue = useWatch({
    control: passwordForm.control,
    name: "newPassword",
    defaultValue: "",
  });
  const confirmValue = useWatch({
    control: passwordForm.control,
    name: "confirmNewPassword",
    defaultValue: "",
  });

  const requirementStatus = getPasswordRequirementStatus(newPasswordValue);
  const requirementsMet = arePasswordRequirementsMet(requirementStatus);
  const passwordsMatch =
    newPasswordValue.length > 0 &&
    confirmValue.length > 0 &&
    newPasswordValue === confirmValue;

  const handleGenerateNewPassword = useCallback(() => {
    const next = generateSecurePassword(16);
    passwordForm.setValue("newPassword", next, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setShowNewPassword(true);
    toast({
      title: "Contraseña sugerida",
      description: "Puedes usarla o sustituirla por la que prefieras.",
      variant: "success",
    });
  }, [passwordForm, toast]);

  const onPasswordSubmit = passwordForm.handleSubmit(async (data) => {
    if (!user) return;
    try {
      const session = await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmNewPassword: data.confirmNewPassword,
      });
      applySessionTokens(session.accessToken, session.refreshToken);
      void queryClient.invalidateQueries({
        queryKey: userQueryKeys.activityRoot(user.id),
      });
      setSheetOpen(false);
      toast({
        title: "Contraseña actualizada",
        description:
          "Tu sesión en este dispositivo sigue activa con nuevos tokens. En otros dispositivos deberás iniciar sesión de nuevo.",
        variant: "success",
      });
    } catch (error) {
      const mapped = mapBackendError(error);
      toast({
        title: "No se pudo cambiar la contraseña",
        description: mapped.message,
        variant: "destructive",
      });
    }
  });

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      resetPasswordMutation();
    }
  };

  const canSubmit =
    passwordForm.formState.isDirty &&
    requirementsMet &&
    passwordsMatch &&
    currentPasswordValue.length > 0;

  if (!user) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4" aria-hidden />
            Contraseña
          </CardTitle>
          <CardDescription>
            Actualiza tu contraseña cuando quieras. Al guardar, esta sesión se
            renueva automáticamente; en otros navegadores o dispositivos hará
            falta volver a iniciar sesión.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={() => setSheetOpen(true)}>
            Cambiar contraseña
          </Button>
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md"
        >
          <SheetHeader className="text-left">
            <SheetTitle>Cambiar contraseña</SheetTitle>
            <SheetDescription>
              Confirma tu contraseña actual y define una nueva. Esta sesión se
              mantendrá activa; otras sesiones quedarán invalidadas.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-6 px-1 pb-6 pt-2">
            <Form {...passwordForm}>
              <form
                onSubmit={onPasswordSubmit}
                className="flex flex-col gap-5"
              >
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña actual</FormLabel>
                      <div className="flex min-w-0 flex-1 gap-2">
                        <FormControl>
                          <Input
                            {...field}
                            type={showCurrentPassword ? "text" : "password"}
                            autoComplete="current-password"
                            disabled={isPasswordSaving}
                            className="min-w-0 flex-1"
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          aria-label={
                            showCurrentPassword
                              ? "Ocultar contraseña"
                              : "Mostrar contraseña"
                          }
                          disabled={isPasswordSaving}
                          onClick={() =>
                            setShowCurrentPassword((prev) => !prev)
                          }
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nueva contraseña</FormLabel>
                        <div className="flex min-w-0 flex-1 gap-2">
                          <FormControl>
                            <Input
                              {...field}
                              type={showNewPassword ? "text" : "password"}
                              autoComplete="new-password"
                              disabled={isPasswordSaving}
                              className="min-w-0 flex-1"
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            aria-label={
                              showNewPassword
                                ? "Ocultar contraseña"
                                : "Mostrar contraseña"
                            }
                            disabled={isPasswordSaving}
                            onClick={() => setShowNewPassword((v) => !v)}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <PasswordRequirementsList password={newPasswordValue} />

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full sm:w-auto"
                    disabled={isPasswordSaving}
                    onClick={handleGenerateNewPassword}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Sugerir contraseña segura
                  </Button>
                </div>

                <FormField
                  control={passwordForm.control}
                  name="confirmNewPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar nueva contraseña</FormLabel>
                      <div className="flex min-w-0 flex-1 gap-2">
                        <FormControl>
                          <Input
                            {...field}
                            type={showConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            disabled={isPasswordSaving}
                            className="min-w-0 flex-1"
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          aria-label={
                            showConfirmPassword
                              ? "Ocultar contraseña"
                              : "Mostrar contraseña"
                          }
                          disabled={isPasswordSaving}
                          onClick={() =>
                            setShowConfirmPassword((prev) => !prev)
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {confirmValue.length > 0 &&
                        newPasswordValue.length > 0 &&
                        newPasswordValue !== confirmValue && (
                          <p className="text-sm text-destructive" role="alert">
                            Las contraseñas no coinciden
                          </p>
                        )}
                      {passwordsMatch && (
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">
                          Las contraseñas coinciden
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <SheetFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSheetOpenChange(false)}
                    disabled={isPasswordSaving}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPasswordSaving || !canSubmit}>
                    {isPasswordSaving ? (
                      <>
                        <Loader2
                          className="mr-2 h-4 w-4 animate-spin"
                          aria-hidden
                        />
                        Guardando…
                      </>
                    ) : (
                      "Guardar nueva contraseña"
                    )}
                  </Button>
                </SheetFooter>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
