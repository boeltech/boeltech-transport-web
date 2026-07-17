import { useNavigate, useParams } from "react-router-dom";
import { Building2 } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import { useToast } from "@shared/hooks";
import {
  getErrorMessage,
  isApiError,
} from "@shared/api/interceptors/error-handler";
import { BranchStatus } from "../../domain";
import { useBranch, useUpdateBranch } from "../../application";
import { BranchForm } from "../components";
import { BranchStatusBadge } from "../config/branchStatusConfig";
import { branchesCopy } from "../copy/branchesCopy";
import { branchFormToUpdateDTO, type BranchFormData } from "../validation/branchSchema";
import { getBranchMutationErrorToast } from "../utils/branchMutationErrors";

export function BranchEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const branchId = id ?? "";

  const { data: branch, isLoading, isError } = useBranch(branchId);

  const updateMutation = useUpdateBranch({
    onSuccess: () => {
      toast({
        title: branchesCopy.edit.toasts.successTitle,
        description: branchesCopy.edit.toasts.successDescription,
        variant: "success",
      });
      navigate(`/branches/${branchId}`);
    },
    onError: (error) => {
      const known = getBranchMutationErrorToast(error);
      if (known) {
        toast({
          title: known.title,
          description: known.description,
          variant: "destructive",
        });
        return;
      }

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
    if (!branchId) return;
    updateMutation.mutate({
      id: branchId,
      data: branchFormToUpdateDTO(values),
    });
  };

  const handleCancel = () => {
    navigate(`/branches/${branchId}`);
  };

  return (
    <FormPageShell
      className="mx-auto max-w-4xl p-4 sm:p-6"
      isLoading={isLoading}
      notFound={!isLoading && (isError || !branch)}
      notFoundConfig={{
        icon: <Building2 />,
        title: branchesCopy.edit.notFound.title,
        description: branchesCopy.edit.notFound.description,
        backHref: "/branches",
        backLabel: branchesCopy.edit.notFound.backLabel,
      }}
      header={{
        backHref: `/branches/${branchId}`,
        backLabel: branchesCopy.edit.backLabel,
        icon: <Building2 className="h-5 w-5" />,
        iconVariant:
          branch &&
          (!branch.isActive || branch.status === BranchStatus.INACTIVE)
            ? "muted"
            : "primary",
        title: branch
          ? branchesCopy.edit.titleWithName(branch.name)
          : branchesCopy.edit.title,
        subtitle: branch ? branchesCopy.edit.subtitle(branch.code) : undefined,
        trailing: branch ? (
          <div className="flex flex-wrap items-center gap-2">
            <BranchStatusBadge status={branch.status} showIcon size="sm" />
            {branch.isMain ? (
              <Badge variant="info" tone="soft">
                {branchesCopy.card.mainBadge}
              </Badge>
            ) : null}
          </div>
        ) : undefined,
      }}
    >
      {branch ? (
        <BranchForm
          key={branch.id}
          branch={branch}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={updateMutation.isPending}
        />
      ) : null}
    </FormPageShell>
  );
}
