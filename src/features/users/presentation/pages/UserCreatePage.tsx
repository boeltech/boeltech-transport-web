import { useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useAuth } from "@features/auth";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import { useToast } from "@shared/hooks";
import {
  getErrorMessage,
  isApiError,
} from "@shared/api/interceptors/error-handler";
import { useCreateUser } from "../../application";
import { UserForm } from "../components";
import { usersCopy } from "../copy/usersCopy";
import { userFormToCreateDTO, type UserFormData } from "../validation/userSchema";

export function UserCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: authUser } = useAuth();

  const createMutation = useCreateUser({
    onSuccess: (data) => {
      toast({
        title: usersCopy.create.toasts.successTitle,
        description: usersCopy.create.toasts.successDescription(data.fullName),
        variant: "success",
      });
      navigate("/users");
    },
    onError: (error) => {
      if (isApiError(error) && error.code === "USER_LIMIT_REACHED") {
        toast({
          title: usersCopy.limitReached.title,
          description: error.message || usersCopy.limitReached.description,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: usersCopy.create.toasts.errorTitle,
        description: isApiError(error)
          ? error.getDetailedMessage(3)
          : getErrorMessage(error),
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
        title: usersCopy.create.title,
        subtitle: usersCopy.create.subtitle,
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
