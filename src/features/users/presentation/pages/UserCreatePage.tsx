import { useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useAuth } from "@features/auth";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import { useToast } from "@shared/hooks";
import { useCreateUser } from "../../application";
import { UserForm } from "../components";
import { userFormToCreateDTO, type UserFormData } from "../validation/userSchema";

export function UserCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: authUser } = useAuth();

  const createMutation = useCreateUser({
    onSuccess: (data) => {
      toast({
        title: "Usuario creado",
        description: `${data.fullName} se registró correctamente`,
        variant: "success",
      });
      navigate("/users");
    },
    onError: (error) => {
      toast({
        title: "Error al crear usuario",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: UserFormData) => {
    createMutation.mutate(userFormToCreateDTO(values));
  };

  return (
    <FormPageShell
      isLoading={false}
      header={{
        backHref: "/users",
        icon: <UserPlus className="h-5 w-5" />,
        title: "Nuevo usuario",
        subtitle: "Registra un usuario para este tenant",
      }}
    >
      <UserForm
        key={authUser?.role ?? "pending"}
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </FormPageShell>
  );
}
