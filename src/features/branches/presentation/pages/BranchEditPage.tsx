import { useNavigate, useParams } from "react-router-dom";
import { Building2 } from "lucide-react";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import { useToast } from "@shared/hooks";
import {
  getErrorMessage,
  isApiError,
} from "@shared/api/interceptors/error-handler";
import { useBranch, useUpdateBranch } from "../../application";
import { BranchForm } from "../components";
import { branchesCopy } from "../copy/branchesCopy";
import { branchFormToUpdateDTO, type BranchFormData } from "../validation/branchSchema";

export function BranchEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: branch, isLoading } = useBranch(id ?? "");

  const updateMutation = useUpdateBranch({
    onSuccess: () => {
      toast({
        title: branchesCopy.edit.toasts.successTitle,
        description: branchesCopy.edit.toasts.successDescription,
        variant: "success",
      });
      navigate(`/branches/${id}`);
    },
    onError: (error) => {
      toast({
        title: branchesCopy.edit.toasts.errorTitle,
        description: isApiError(error)
          ? error.getDetailedMessage(3)
          : getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: BranchFormData) => {
    if (!id) return;
    updateMutation.mutate({
      id,
      data: branchFormToUpdateDTO(values),
    });
  };

  return (
    <FormPageShell
      isLoading={isLoading}
      notFound={!branch}
      notFoundConfig={{
        icon: <Building2 />,
        title: branchesCopy.edit.notFound.title,
        description: branchesCopy.edit.notFound.description,
        backHref: "/branches",
        backLabel: branchesCopy.edit.notFound.backLabel,
      }}
      header={{
        backHref: `/branches/${id}`,
        icon: <Building2 className="h-5 w-5" />,
        title: branch
          ? branchesCopy.edit.titleWithName(branch.name)
          : branchesCopy.edit.title,
        subtitle: branch ? branchesCopy.edit.subtitle(branch.code) : undefined,
      }}
    >
      {branch ? (
        <BranchForm
          key={branch.id}
          branch={branch}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
        />
      ) : null}
    </FormPageShell>
  );
}
