import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Send } from "lucide-react";

import { useAuth } from "@features/auth";
import { invitationsApi } from "@features/invitations";
import { mapBackendError } from "@shared/utils/errorMapper";
import { isApiError } from "@shared/api/interceptors/error-handler";
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
  FormValidationSummary,
  RHFSelectField,
  RHFTextField,
} from "@shared/ui/form";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { useToast } from "@shared/hooks";
import { usersCopy } from "../copy/usersCopy";

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
  const [showValidationSummary, setShowValidationSummary] = useState(false);

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
    mode: "onChange",
  });

  const { control } = form;

  useEffect(() => {
    if (!open || !user?.role) return;
    form.reset({
      email: "",
      role: getDefaultAssignableRoleForUserCreate(user.role),
      firstName: "",
      lastName: "",
    });
    setShowValidationSummary(false);
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
        setShowValidationSummary(false);
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
        if (isApiError(err) && err.code === "USER_LIMIT_REACHED") {
          toast({
            title: usersCopy.limitReached.title,
            description: err.message || usersCopy.limitReached.description,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: usersCopy.invite.toasts.errorTitle,
          description: mapBackendError(err).message,
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [handleOpenChange, onInvited, toast],
  );

  const handleFormSubmit = form.handleSubmit(
    (data) => {
      setShowValidationSummary(false);
      void onSubmit(data);
    },
    () => {
      setShowValidationSummary(true);
    },
  );

  const validationMessages = collectFieldErrorMessages(form.formState.errors);

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

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <RHFTextField
            control={control}
            name="email"
            label="Correo"
            required
            type="email"
            autoComplete="email"
          />

          <RHFSelectField
            control={control}
            name="role"
            label="Rol"
            required
            placeholder="Rol"
            options={roleOptions.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <RHFTextField
              control={control}
              name="firstName"
              label="Nombre (opcional)"
            />
            <RHFTextField
              control={control}
              name="lastName"
              label="Apellido (opcional)"
            />
          </div>

          {showValidationSummary && validationMessages.length > 0 ? (
            <FormValidationSummary
              title="Revisa los datos de la invitación"
              messages={validationMessages}
            />
          ) : null}

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
      </DialogContent>
    </Dialog>
  );
}
