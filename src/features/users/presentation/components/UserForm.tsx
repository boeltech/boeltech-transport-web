import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Copy, Eye, EyeOff, Save, Shield, Sparkles, UserPlus } from "lucide-react";
import { useAuth } from "@features/auth";
import { useToast } from "@shared/hooks";
import { copyToClipboard } from "@shared/utils/copyToClipboard";
import { generateSecurePassword } from "@shared/utils/generateSecurePassword";
import {
  ROLES,
  ROLE_HIERARCHY,
  getDefaultAssignableRoleForUserCreate,
  getRoleOptionsForUserManagementForm,
  type UserRole,
} from "@shared/constants/roles";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { FormSectionCard } from "@shared/ui/form-section-card";
import {
  FormFieldShell,
  FormValidationSummary,
  RHFSelectField,
  RHFTextField,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import type { User } from "../../domain";
import {
  createUserFormSchemaWithRoleAllowlist,
  defaultCreateUserFormValues,
  updateUserFormSchemaWithRoleAllowlist,
  type UpdateUserFormData,
  type UserFormData,
} from "../validation/userSchema";

type UserFormMode = "create" | "edit";

interface UserFormProps {
  mode: UserFormMode;
  user?: User;
  onSubmit: (values: UserFormData) => void;
  isSubmitting?: boolean;
}

function userToUpdateFormData(user: User): UpdateUserFormData {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  };
}

export function UserForm({
  mode,
  user,
  onSubmit,
  isSubmitting = false,
}: UserFormProps) {
  const isCreate = mode === "create";
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showValidationSummary, setShowValidationSummary] = useState(false);

  const actorRole = authUser?.role ?? ROLES.ADMIN;

  const roleOptions = useMemo(
    () =>
      getRoleOptionsForUserManagementForm(
        actorRole,
        isCreate ? "create" : "edit",
        user?.role,
      ),
    [actorRole, isCreate, user?.role],
  );

  const allowedRoleSet = useMemo(
    () => new Set(roleOptions.map((o) => o.value)),
    [roleOptions],
  );

  const validationSchema = useMemo(
    () =>
      isCreate
        ? createUserFormSchemaWithRoleAllowlist(allowedRoleSet)
        : updateUserFormSchemaWithRoleAllowlist(allowedRoleSet),
    [allowedRoleSet, isCreate],
  );

  const createDefaults = useMemo(
    () => ({
      ...defaultCreateUserFormValues,
      role: getDefaultAssignableRoleForUserCreate(actorRole),
    }),
    [actorRole],
  );

  const form = useForm<UserFormData>({
    resolver: zodResolver(validationSchema) as never,
    defaultValues: isCreate ? createDefaults : user ? userToUpdateFormData(user) : undefined,
    mode: "onChange",
  });

  const { control } = form;

  const watchedRole = useWatch({ control, name: "role" }) as UserRole | undefined;
  const isRoleDowngrade =
    !isCreate &&
    user &&
    watchedRole &&
    ROLE_HIERARCHY[watchedRole] < ROLE_HIERARCHY[user.role];

  const handleGeneratePassword = useCallback(() => {
    const next = generateSecurePassword(16);
    form.setValue("password", next, { shouldValidate: true, shouldDirty: true });
    setShowPassword(true);
    toast({
      title: "Contraseña generada",
      description: "Puedes conservarla o sustituirla por la que prefieras.",
      variant: "success",
    });
  }, [form, toast]);

  const handleCopyEmail = useCallback(
    async (email: string) => {
      const ok = await copyToClipboard(email);
      toast(
        ok
          ? { title: "Email copiado", variant: "success" }
          : { title: "No se pudo copiar", variant: "destructive" },
      );
    },
    [toast],
  );

  const handleCopyPassword = useCallback(
    async (password: string) => {
      const ok = await copyToClipboard(password);
      toast(
        ok
          ? { title: "Contraseña copiada", variant: "success" }
          : { title: "No se pudo copiar", variant: "destructive" },
      );
    },
    [toast],
  );

  const handleFormSubmit = form.handleSubmit(
    (values) => {
      setShowValidationSummary(false);
      onSubmit(values);
    },
    () => {
      setShowValidationSummary(true);
    },
  );

  const validationMessages = collectFieldErrorMessages(form.formState.errors);

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <FormSectionCard
        title={isCreate ? "Nuevo usuario" : "Editar usuario"}
        icon={isCreate ? <UserPlus className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
        description="Datos de acceso y rol del usuario"
        contentClassName="grid gap-4 sm:grid-cols-2"
      >
        <RHFTextField
          control={control}
          name="firstName"
          label="Nombre"
          required
          placeholder="Nombre"
        />
        <RHFTextField
          control={control}
          name="lastName"
          label="Apellido"
          required
          placeholder="Apellido"
        />

        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <FormFieldShell
              fieldId="email"
              className="sm:col-span-2"
              label="Email"
              required
              errorMessage={fieldState.error?.message}
            >
              <div className="flex gap-2">
                <Input
                  id="email"
                  placeholder="usuario@empresa.com"
                  type="email"
                  className="min-w-0 flex-1"
                  {...field}
                  error={Boolean(fieldState.error)}
                  {...getFieldErrorAriaProps("email", fieldState.error?.message)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  aria-label="Copiar email"
                  disabled={!field.value?.trim()}
                  onClick={() => void handleCopyEmail(String(field.value ?? ""))}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </FormFieldShell>
          )}
        />

        {isCreate ? (
          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <FormFieldShell
                fieldId="password"
                className="sm:col-span-2"
                label="Contraseña inicial"
                required
                errorMessage={fieldState.error?.message}
                description="Entre 8 y 128 caracteres, con mayúscula, minúscula y número. Puedes usar «Generar segura». El usuario podrá cambiarla después con recuperación de acceso."
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <div className="flex min-w-0 flex-1 gap-2">
                    <Input
                      id="password"
                      placeholder="Mínimo 8 caracteres (mayúscula, minúscula y número)"
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
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
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
                    className="shrink-0 sm:self-start"
                    onClick={handleGeneratePassword}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generar segura
                  </Button>
                </div>
              </FormFieldShell>
            )}
          />
        ) : null}

        {isRoleDowngrade ? (
          <Alert variant="warning" className="sm:col-span-2">
            <AlertTitle>Rol con menos permisos</AlertTitle>
            <AlertDescription>
              Al guardar, el usuario puede perder acceso a módulos en su próximo inicio de
              sesión. Las sesiones activas pueden quedar invalidadas si el servidor revoca
              tokens al detectar el cambio.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="sm:col-span-2">
        <RHFSelectField
          control={control}
          name="role"
          label="Rol"
          required
          placeholder="Selecciona un rol"
          disabled={!isCreate && roleOptions.length <= 1}
          description={
            isCreate
              ? "Solo se listan los roles que tu usuario puede delegar en este tenant."
              : "Al reducir el nivel del rol, revisa permisos y sesiones activas del usuario."
          }
          options={roleOptions.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />
        </div>
      </FormSectionCard>

      {showValidationSummary && validationMessages.length > 0 ? (
        <FormValidationSummary
          title="Revisa los datos del usuario"
          messages={validationMessages}
        />
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          <Save className="mr-2 h-4 w-4" />
          {isCreate ? "Crear usuario" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
