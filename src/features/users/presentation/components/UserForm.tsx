import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useMemo, useState } from "react";
import { Copy, Eye, EyeOff, Save, Shield, Sparkles, UserPlus } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { FormSectionCard } from "@shared/ui/form-section-card";
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
  });

  const watchedRole = useWatch({ control: form.control, name: "role" }) as UserRole | undefined;
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormSectionCard
          title={isCreate ? "Nuevo usuario" : "Editar usuario"}
          icon={isCreate ? <UserPlus className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
          description="Datos de acceso y rol del usuario"
          contentClassName="grid gap-4 sm:grid-cols-2"
        >
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre *</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido *</FormLabel>
                <FormControl>
                  <Input placeholder="Apellido" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Email *</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      placeholder="usuario@empresa.com"
                      type="email"
                      className="min-w-0 flex-1"
                      {...field}
                    />
                  </FormControl>
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
                <FormMessage />
              </FormItem>
            )}
          />

          {isCreate ? (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Contraseña inicial *</FormLabel>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                    <div className="flex min-w-0 flex-1 gap-2">
                      <FormControl>
                        <Input
                          placeholder="Mínimo 8 caracteres (mayúscula, minúscula y número)"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          className="min-w-0 flex-1"
                          {...field}
                        />
                      </FormControl>
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
                  <FormDescription>
                    Entre 8 y 128 caracteres, con mayúscula, minúscula y número. Puedes usar
                    «Generar segura». El usuario podrá cambiarla después con recuperación de acceso.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
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

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Rol *</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!isCreate && roleOptions.length <= 1}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {isCreate
                    ? "Solo se listan los roles que tu usuario puede delegar en este tenant."
                    : "Al reducir el nivel del rol, revisa permisos y sesiones activas del usuario."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSectionCard>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isCreate ? "Crear usuario" : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
