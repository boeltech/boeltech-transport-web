/**
 * Mi cuenta — autoservicio: lectura, refresco desde API y edición (PATCH /auth/profile).
 */

import { useCallback } from "react";
import { Loader2, RefreshCw, User } from "lucide-react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import { useToast } from "@shared/hooks/useToast";
import { mapBackendError } from "@shared/utils/errorMapper";
import { formatDateTime } from "@shared/utils/dateUtils";
import { PasswordChangeSection } from "./components/PasswordChangeSection";

function ProfilePage() {
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
        title: "Datos actualizados",
        description: "Tu información se sincronizó con el servidor.",
        variant: "success",
      });
    } catch (error) {
      const mapped = mapBackendError(error);
      toast({
        title: "No se pudo actualizar",
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
        title: "Perfil guardado",
        description: "Los cambios se aplicaron correctamente.",
        variant: "success",
      });
    } catch (error) {
      const mapped = mapBackendError(error);
      toast({
        title: "No se pudo guardar",
        description: mapped.message,
        variant: "destructive",
      });
    }
  });

  if (!user) {
    return null;
  }

  const roleLabel = ROLE_LABELS[user.role as UserRole] ?? user.role;
  const lastLoginLabel = user.lastLogin
    ? formatDateTime(user.lastLogin.toISOString())
    : "—";

  return (
    <FormPageShell
      isLoading={false}
      header={{
        backHref: "/dashboard",
        backLabel: "Volver al panel",
        icon: <User className="h-5 w-5" aria-hidden />,
        title: "Mi cuenta",
        subtitle: user.getFullName(),
      }}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos personales</CardTitle>
            <CardDescription>
              Nombre, apellido y correo asociados a tu usuario en este tenant.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            autoComplete="given-name"
                            disabled={isSaving}
                          />
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
                        <FormLabel>Apellido</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            autoComplete="family-name"
                            disabled={isSaving}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          autoComplete="email"
                          disabled={isSaving}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
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
                        Guardando…
                      </>
                    ) : (
                      "Guardar cambios"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <PasswordChangeSection />

        <Card>
          <CardHeader className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <CardTitle>Información de la cuenta</CardTitle>
              <CardDescription>
                Rol, organización y último acceso. Usa el botón para volver a
                cargar desde el servidor sin guardar el formulario.
              </CardDescription>
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
              Actualizar datos
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <dl className="grid gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Rol
                </dt>
                <dd className="mt-1 text-sm font-medium">{roleLabel}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Organización
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  {user.getTenantName()}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Subdominio
                </dt>
                <dd className="mt-1 font-mono text-sm">{user.getSubdomain()}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Último acceso
                </dt>
                <dd className="mt-1 text-sm">{lastLoginLabel}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </FormPageShell>
  );
}

export default ProfilePage;
