import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useIncomingFrom } from "@shared/utils/listQueueFrom";
import { navigatePreservingFrom } from "@shared/utils/masterWayfinding";
import { usersCopy } from "../copy/usersCopy";
import { UserRound } from "lucide-react";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import { UnsavedChangesDialog } from "@shared/ui/form";
import { useToast, useUnsavedChangesGuard } from "@shared/hooks";
import {
  PolicyOrphanConfirmDialog,
  usePolicyOrphanConfirmation,
} from "@features/approval-policies";
import { useUpdateUser, useUser } from "../../application";
import { UserForm } from "../components/UserForm";
import { userFormToUpdateDTO, type UserFormData } from "../validation/userSchema";

export function UserEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const incomingFrom = useIncomingFrom();
  const { toast } = useToast();
  const userId = id ?? "";
  const [isDirty, setIsDirty] = useState(false);
  const { blocker, allowLeave, resetAllowLeave } = useUnsavedChangesGuard({
    isDirty,
  });
  const wasSubmittingRef = useRef(false);

  const { data: user, isLoading } = useUser(userId);

  const orphanGuard = usePolicyOrphanConfirmation();
  const updateMutation = useUpdateUser({
    onSuccess: () => {
      toast({
        title: "Usuario actualizado",
        description: "Los cambios se guardaron correctamente",
        variant: "success",
      });
      navigatePreservingFrom(navigate, `/users/${userId}`, incomingFrom);
    },
    onError: (error, variables) => {
      const retry = () =>
        updateMutation.mutate({
          ...variables,
          data: { ...variables.data, confirmPolicyOrphan: true },
        });
      if (orphanGuard.intercept(error, retry)) return;
      toast({
        title: "Error al actualizar usuario",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (updateMutation.isPending) {
      wasSubmittingRef.current = true;
      return;
    }
    if (wasSubmittingRef.current) {
      wasSubmittingRef.current = false;
      resetAllowLeave();
    }
  }, [updateMutation.isPending, resetAllowLeave]);

  const handleSubmit = useCallback(
    (values: UserFormData) => {
      if (!userId) return;
      allowLeave();
      updateMutation.mutate({
        id: userId,
        data: userFormToUpdateDTO(values),
      });
    },
    [allowLeave, updateMutation, userId],
  );

  const handleCancel = useCallback(() => {
    navigatePreservingFrom(navigate, `/users/${userId}`, incomingFrom);
  }, [navigate, userId, incomingFrom]);

  return (
    <FormPageShell
      isLoading={isLoading}
      notFound={!user}
      notFoundConfig={{
        icon: <UserRound />,
        title: "Usuario no encontrado",
        description: "No existe el usuario que intentas editar.",
        backHref: "/users",
        backLabel: usersCopy.detail.backToList,
      }}
      header={{
        backHref: `/users/${userId}`,
        icon: <UserRound className="h-5 w-5" />,
        title: user ? `Editar ${user.firstName} ${user.lastName}` : "Editar usuario",
        subtitle: user?.email,
      }}
    >
      {user ? (
        <UserForm
          key={user.id}
          mode="edit"
          user={user}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onDirtyChange={setIsDirty}
          isSubmitting={updateMutation.isPending}
        />
      ) : null}
      <PolicyOrphanConfirmDialog
        {...orphanGuard.dialog}
        pending={updateMutation.isPending}
      />
      <UnsavedChangesDialog blocker={blocker} />
    </FormPageShell>
  );
}
