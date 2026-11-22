import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useIncomingWayfinding } from "@shared/utils/listQueueFrom";
import {
  MODULE_LIST_PATH_LABELS,
  navigatePreservingFrom,
  resolveDetailCrumbs,
} from "@shared/utils/masterWayfinding";
import { usersCopy } from "../copy/usersCopy";
import { USERS_LIST_PATH } from "../utils/userWayfinding";
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

const USERS_MODULE_LABEL =
  MODULE_LIST_PATH_LABELS[USERS_LIST_PATH] ?? "Usuarios";

export function UserEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const incoming = useIncomingWayfinding();
  const incomingFrom = incoming?.from;
  const { toast } = useToast();
  const userId = id ?? "";
  const detailFallback = userId ? `/users/${userId}` : USERS_LIST_PATH;
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
      navigatePreservingFrom(navigate, detailFallback, incomingFrom);
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
    navigatePreservingFrom(navigate, detailFallback, incomingFrom);
  }, [navigate, detailFallback, incomingFrom]);

  const displayName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : undefined;
  const crumbs = useMemo(
    () =>
      resolveDetailCrumbs({
        from: incomingFrom ?? detailFallback,
        fromLabel: incoming?.fromLabel ?? displayName,
        module: {
          listPath: USERS_LIST_PATH,
          label: USERS_MODULE_LABEL,
        },
        current: { label: "Editar" },
      }),
    [detailFallback, displayName, incoming?.fromLabel, incomingFrom],
  );

  return (
    <FormPageShell
      isLoading={isLoading}
      notFound={!user}
      notFoundConfig={{
        icon: <UserRound />,
        title: "Usuario no encontrado",
        description: "No existe el usuario que intentas editar.",
        backHref: USERS_LIST_PATH,
        backLabel: usersCopy.detail.backToList,
      }}
      header={{
        crumbs,
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
