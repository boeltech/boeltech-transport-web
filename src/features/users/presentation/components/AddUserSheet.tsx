import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Copy, Eye, EyeOff, Send, Sparkles, UserPlus } from "lucide-react";

import { useAuth } from "@features/auth";
import { useActiveClients } from "@features/clients";
import { formatDriverName, useDrivers } from "@features/drivers";
import { invitationsApi } from "@features/invitations";
import { mapBackendError } from "@shared/utils/errorMapper";
import { isApiError } from "@shared/api/interceptors/error-handler";
import {
  getDefaultAssignableRoleForUserCreate,
  getRoleOptionsForUserManagementForm,
  ROLES,
  type UserRole,
} from "@shared/constants/roles";
import { Button } from "@shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import {
  FormFieldShell,
  FormValidationSummary,
  RHFSelectField,
  RHFTextField,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { copyToClipboard } from "@shared/utils/copyToClipboard";
import { generateSecurePassword } from "@shared/utils/generateSecurePassword";
import { useToast } from "@shared/hooks";
import { useCreateUser } from "../../application";
import { usersCopy } from "../copy/usersCopy";
import {
  createUserFormSchemaWithRoleAllowlist,
  userFormToCreateDTO,
  type UserFormData,
} from "../validation/userSchema";

const roleEnum = z.enum(Object.values(ROLES) as [UserRole, ...UserRole[]]);

const inviteUserSchema = z
  .object({
    email: z.string().min(1, "Correo requerido").email("Correo inválido"),
    role: roleEnum,
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === ROLES.CLIENT || data.role === ROLES.DRIVER) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Usa «Registrar» con vínculo a cliente o conductor; la invitación no admite estos roles.",
        path: ["role"],
      });
    }
  });

type InviteUserForm = z.infer<typeof inviteUserSchema>;
export type AddUserSheetMode = "invite" | "register";

export interface AddUserSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted?: () => void;
  /** @deprecated use onCompleted */
  onInvited?: () => void;
}

export function AddUserSheet({
  open,
  onOpenChange,
  onCompleted,
  onInvited,
}: AddUserSheetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const copy = usersCopy.addUser;
  const [mode, setMode] = useState<AddUserSheetMode>("invite");
  const [isInviting, setIsInviting] = useState(false);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const allRoleOptions = useMemo(() => {
    if (!user?.role) return [];
    return getRoleOptionsForUserManagementForm(user.role, "create");
  }, [user?.role]);

  /** Invite cannot carry client/driver ownership links — exclude those roles. */
  const inviteRoleOptions = useMemo(
    () =>
      allRoleOptions.filter(
        (o) => o.value !== ROLES.CLIENT && o.value !== ROLES.DRIVER,
      ),
    [allRoleOptions],
  );

  const roleOptions = allRoleOptions;

  const allowedRoleSet = useMemo(
    () => new Set(roleOptions.map((o) => o.value)),
    [roleOptions],
  );

  const defaultRole = useMemo(() => {
    if (!user?.role) return "operator" as UserRole;
    return getDefaultAssignableRoleForUserCreate(user.role);
  }, [user?.role]);

  const inviteForm = useForm<InviteUserForm, unknown, InviteUserForm>({
    resolver: zodResolver(inviteUserSchema) as Resolver<InviteUserForm>,
    defaultValues: {
      email: "",
      role: defaultRole,
      firstName: "",
      lastName: "",
    },
    mode: "onChange",
  });

  const registerSchema = useMemo(
    () => createUserFormSchemaWithRoleAllowlist(allowedRoleSet),
    [allowedRoleSet],
  );

  const registerForm = useForm<UserFormData>({
    resolver: zodResolver(registerSchema) as never,
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: defaultRole,
    },
    mode: "onChange",
  });

  const createMutation = useCreateUser({
    onSuccess: (data) => {
      toast({
        title: copy.toasts.registerSuccess,
        description: copy.toasts.registerSuccessDescription(data.fullName),
        variant: "success",
      });
      handleOpenChange(false);
      onCompleted?.();
      onInvited?.();
    },
    onError: (error) => {
      if (isApiError(error) && error.code === "USER_LIMIT_REACHED") {
        toast({
          title: usersCopy.limitReached.title,
          description: error.message || usersCopy.limitReached.description,
          variant: "error",
        });
        return;
      }
      toast({
        title: copy.toasts.registerError,
        description: mapBackendError(error).message,
        variant: "error",
      });
    },
  });

  const resetForms = useCallback(
    (role: UserRole) => {
      inviteForm.reset({
        email: "",
        role,
        firstName: "",
        lastName: "",
      });
      registerForm.reset({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role,
      });
      setShowValidationSummary(false);
      setShowPassword(false);
    },
    [inviteForm, registerForm],
  );

  useEffect(() => {
    if (!open || !user?.role) return;
    setMode("invite");
    resetForms(getDefaultAssignableRoleForUserCreate(user.role));
  }, [open, user?.role, resetForms]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      onOpenChange(next);
      if (!next) {
        setMode("invite");
        resetForms(defaultRole);
      }
    },
    [defaultRole, onOpenChange, resetForms],
  );

  const handleModeChange = useCallback((next: string) => {
    setMode(next === "register" ? "register" : "invite");
    setShowValidationSummary(false);
  }, []);

  const onInviteSubmit = useCallback(
    async (data: InviteUserForm) => {
      setIsInviting(true);
      try {
        const { message } = await invitationsApi.create({
          email: data.email.trim().toLowerCase(),
          role: data.role,
          firstName: data.firstName?.trim() || undefined,
          lastName: data.lastName?.trim() || undefined,
        });
        toast({
          title: copy.toasts.inviteSuccess,
          description: message,
          variant: "success",
        });
        handleOpenChange(false);
        onCompleted?.();
        onInvited?.();
      } catch (err: unknown) {
        if (isApiError(err) && err.code === "USER_LIMIT_REACHED") {
          toast({
            title: usersCopy.limitReached.title,
            description: err.message || usersCopy.limitReached.description,
            variant: "error",
          });
          return;
        }

        toast({
          title: copy.toasts.inviteError,
          description: mapBackendError(err).message,
          variant: "error",
        });
      } finally {
        setIsInviting(false);
      }
    },
    [copy.toasts, handleOpenChange, onCompleted, onInvited, toast],
  );

  const handleInviteFormSubmit = inviteForm.handleSubmit(
    (data) => {
      setShowValidationSummary(false);
      void onInviteSubmit(data);
    },
    () => {
      setShowValidationSummary(true);
    },
  );

  const handleRegisterFormSubmit = registerForm.handleSubmit(
    (values) => {
      setShowValidationSummary(false);
      createMutation.mutate(userFormToCreateDTO(values));
    },
    () => {
      setShowValidationSummary(true);
    },
  );

  const handleGeneratePassword = useCallback(() => {
    const next = generateSecurePassword(16);
    registerForm.setValue("password", next, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setShowPassword(true);
    toast({
      title: copy.toasts.passwordGenerated,
      description: copy.toasts.passwordGeneratedDescription,
      variant: "success",
    });
  }, [copy.toasts, registerForm, toast]);

  const handleCopyPassword = useCallback(
    async (password: string) => {
      const ok = await copyToClipboard(password);
      toast(
        ok
          ? { title: copy.toasts.passwordCopied, variant: "success" }
          : { title: copy.toasts.copyFailed, variant: "error" },
      );
    },
    [copy.toasts, toast],
  );

  const registerRole = useWatch({
    control: registerForm.control,
    name: "role",
  }) as UserRole | undefined;

  const { data: activeClients } = useActiveClients({
    enabled: mode === "register" && registerRole === ROLES.CLIENT,
  });
  const { data: driversPage } = useDrivers(
    { page: 1, limit: 100 },
    { enabled: mode === "register" && registerRole === ROLES.DRIVER },
  );

  const clientOptions = useMemo(
    () =>
      (activeClients ?? []).map((c) => ({
        value: c.id,
        label: c.tradeName || c.legalName || c.taxId || c.id,
      })),
    [activeClients],
  );

  const employeeOptions = useMemo(
    () =>
      (driversPage?.data ?? []).map((d) => ({
        value: d.employeeId,
        label:
          d.employee.fullName?.trim() ||
          formatDriverName(d.employee) ||
          d.employeeId,
      })),
    [driversPage?.data],
  );

  const inviteValidationMessages = collectFieldErrorMessages(
    inviteForm.formState.errors,
  );
  const registerValidationMessages = collectFieldErrorMessages(
    registerForm.formState.errors,
  );
  const isSubmitting = isInviting || createMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg">
        <SheetHeader className="space-y-3 text-left">
          <SheetTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {copy.title}
          </SheetTitle>
          <Tabs value={mode} onValueChange={handleModeChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="invite">{copy.modes.invite}</TabsTrigger>
              <TabsTrigger value="register">{copy.modes.register}</TabsTrigger>
            </TabsList>
          </Tabs>
          <SheetDescription>
            {mode === "invite" ? copy.inviteDescription : copy.registerDescription}
          </SheetDescription>
        </SheetHeader>

        {mode === "invite" ? (
          <form
            onSubmit={handleInviteFormSubmit}
            className="flex flex-1 flex-col gap-4 px-1 py-4"
          >
            <RHFTextField
              control={inviteForm.control}
              name="email"
              label={copy.fields.email}
              required
              type="email"
              autoComplete="email"
            />

            <RHFSelectField
              control={inviteForm.control}
              name="role"
              label={copy.fields.role}
              required
              placeholder={copy.fields.role}
              description={copy.roleHint}
              options={inviteRoleOptions.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
            />

            <div className="space-y-3 border-t pt-4">
              <p className="text-xs font-medium text-muted-foreground">
                {copy.optionalSection}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <RHFTextField
                  control={inviteForm.control}
                  name="firstName"
                  label={copy.fields.firstName}
                />
                <RHFTextField
                  control={inviteForm.control}
                  name="lastName"
                  label={copy.fields.lastName}
                />
              </div>
            </div>

            {showValidationSummary && inviteValidationMessages.length > 0 ? (
              <FormValidationSummary
                title={copy.validationInvite}
                messages={inviteValidationMessages}
              />
            ) : null}

            <SheetFooter className="mt-auto gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                {copy.cancel}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isInviting ? (
                  copy.submittingInvite
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {copy.submitInvite}
                  </>
                )}
              </Button>
            </SheetFooter>
          </form>
        ) : (
          <form
            onSubmit={handleRegisterFormSubmit}
            className="flex flex-1 flex-col gap-4 px-1 py-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <RHFTextField
                control={registerForm.control}
                name="firstName"
                label={copy.fields.firstName}
                required
              />
              <RHFTextField
                control={registerForm.control}
                name="lastName"
                label={copy.fields.lastName}
                required
              />
            </div>

            <RHFTextField
              control={registerForm.control}
              name="email"
              label={copy.fields.email}
              required
              type="email"
              autoComplete="email"
            />

            <Controller
              control={registerForm.control}
              name="password"
              render={({ field, fieldState }) => (
                <FormFieldShell
                  fieldId="add-user-password"
                  label={copy.fields.password}
                  required
                  errorMessage={fieldState.error?.message}
                  description={copy.fields.passwordHint}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex min-w-0 gap-2">
                      <Input
                        id="add-user-password"
                        placeholder={copy.fields.passwordPlaceholder}
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        className="min-w-0 flex-1"
                        {...field}
                        error={Boolean(fieldState.error)}
                        {...getFieldErrorAriaProps(
                          "password",
                          fieldState.error?.message,
                        )}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        aria-label={
                          showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                        }
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        aria-label="Copiar contraseña"
                        disabled={!field.value?.trim()}
                        onClick={() => void handleCopyPassword(String(field.value ?? ""))}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full sm:w-auto sm:self-start"
                      onClick={handleGeneratePassword}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {copy.generatePassword}
                    </Button>
                  </div>
                </FormFieldShell>
              )}
            />

            <RHFSelectField
              control={registerForm.control}
              name="role"
              label={copy.fields.role}
              required
              placeholder={copy.fields.role}
              description={copy.roleHint}
              options={roleOptions.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
            />

            {registerRole === ROLES.CLIENT ? (
              <RHFSelectField
                control={registerForm.control}
                name="clientId"
                label="Cliente vinculado"
                required
                placeholder="Selecciona un cliente"
                options={clientOptions}
              />
            ) : null}

            {registerRole === ROLES.DRIVER ? (
              <RHFSelectField
                control={registerForm.control}
                name="employeeId"
                label="Empleado conductor"
                required
                placeholder="Selecciona un conductor"
                options={employeeOptions}
              />
            ) : null}

            {showValidationSummary && registerValidationMessages.length > 0 ? (
              <FormValidationSummary
                title={copy.validationRegister}
                messages={registerValidationMessages}
              />
            ) : null}

            <SheetFooter className="mt-auto gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                {copy.cancel}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {createMutation.isPending ? (
                  copy.submittingRegister
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {copy.submitRegister}
                  </>
                )}
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** @deprecated Prefer `AddUserSheet`. */
export const AddUserDialog = AddUserSheet;
/** @deprecated Prefer `AddUserSheet`. */
export const InviteUserDialog = AddUserSheet;
export type AddUserDialogMode = AddUserSheetMode;
export type AddUserDialogProps = AddUserSheetProps;
