import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Send } from "lucide-react";

import { useAuth } from "@features/auth";
import { invitationsApi } from "@features/invitations";
import { mapBackendError } from "@shared/utils/errorMapper";
import { getRoleOptionsForUserManagementForm } from "@shared/constants/roles";
import type { UserRole } from "@shared/constants/roles";
import {
  getDefaultAssignableRoleForUserCreate,
  ROLES,
} from "@shared/constants/roles";
import { Button } from "@shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { useToast } from "@shared/hooks";

const roleEnum = z.enum(
  Object.values(ROLES) as [UserRole, ...UserRole[]],
);

const inviteUserSchema = z.object({
  email: z.string().min(1, "Email requerido").email("Email inválido"),
  role: roleEnum,
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
});

type InviteUserForm = z.infer<typeof inviteUserSchema>;

export interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvited?: () => void;
}

export function InviteUserDialog({
  open,
  onOpenChange,
  onInvited,
}: InviteUserDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleOptions = useMemo(() => {
    if (!user?.role) return [];
    return getRoleOptionsForUserManagementForm(user.role, "create");
  }, [user?.role]);

  const defaultRole = useMemo(() => {
    if (!user?.role) return "operator" as UserRole;
    return getDefaultAssignableRoleForUserCreate(user.role);
  }, [user?.role]);

  const form = useForm<InviteUserForm, unknown, InviteUserForm>({
    resolver: zodResolver(inviteUserSchema) as Resolver<InviteUserForm>,
    defaultValues: {
      email: "",
      role: defaultRole,
      firstName: "",
      lastName: "",
    },
  });

  useEffect(() => {
    if (!open || !user?.role) return;
    form.reset({
      email: "",
      role: getDefaultAssignableRoleForUserCreate(user.role),
      firstName: "",
      lastName: "",
    });
  }, [open, user?.role, form]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      onOpenChange(next);
      if (!next) {
        form.reset({
          email: "",
          role: defaultRole,
          firstName: "",
          lastName: "",
        });
      }
    },
    [defaultRole, form, onOpenChange],
  );

  const onSubmit = useCallback(
    async (data: InviteUserForm) => {
      setIsSubmitting(true);
      try {
        const { message } = await invitationsApi.create({
          email: data.email.trim().toLowerCase(),
          role: data.role,
          firstName: data.firstName?.trim() || undefined,
          lastName: data.lastName?.trim() || undefined,
        });
        toast({
          title: "Invitación enviada",
          description: message,
          variant: "success",
        });
        handleOpenChange(false);
        onInvited?.();
      } catch (err: unknown) {
        toast({
          title: "No se pudo enviar la invitación",
          description: mapBackendError(err).message,
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [handleOpenChange, onInvited, toast],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invitar usuario
          </DialogTitle>
          <DialogDescription>
            Se enviará un correo con un enlace para crear la cuenta y definir contraseña.
            El enlace caduca en varios días según configuración del servidor.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roleOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Apellido (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  "Enviando…"
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar invitación
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
