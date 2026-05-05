import { useNavigate, useParams } from "react-router-dom";
import { UserRound } from "lucide-react";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import { useToast } from "@shared/hooks";
import { useUpdateUser, useUser } from "../../application";
import { UserForm } from "../components";
import { userFormToUpdateDTO, type UserFormData } from "../validation/userSchema";

export function UserEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: user, isLoading } = useUser(id ?? "");

  const updateMutation = useUpdateUser({
    onSuccess: () => {
      toast({
        title: "Usuario actualizado",
        description: "Los cambios se guardaron correctamente",
        variant: "success",
      });
      navigate(`/users/${id}`);
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar usuario",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: UserFormData) => {
    if (!id) return;
    updateMutation.mutate({
      id,
      data: userFormToUpdateDTO(values),
    });
  };

  return (
    <FormPageShell
      isLoading={isLoading}
      notFound={!user}
      notFoundConfig={{
        icon: <UserRound />,
        title: "Usuario no encontrado",
        description: "No existe el usuario que intentas editar.",
        backHref: "/users",
        backLabel: "Volver a usuarios",
      }}
      header={{
        backHref: `/users/${id}`,
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
          isSubmitting={updateMutation.isPending}
        />
      ) : null}
    </FormPageShell>
  );
}
