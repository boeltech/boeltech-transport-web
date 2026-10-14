import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useIncomingFrom } from "@shared/utils/listQueueFrom";
import { navigatePreservingFrom } from "@shared/utils/masterWayfinding";
import { Building2 } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import { UnsavedChangesDialog } from "@shared/ui/form";
import { useToast, useUnsavedChangesGuard } from "@shared/hooks";
import {
  getErrorMessage,
  isApiError,
} from "@shared/api/interceptors/error-handler";
import { BranchStatus } from "../../domain";
import { useBranch, useUpdateBranch } from "../../application";
import { BranchForm } from "../components";
import { branchesCopy } from "../copy/branchesCopy";
import { branchFormToUpdateDTO, type BranchFormData } from "../validation/branchSchema";
import { getBranchMutationErrorToast } from "../utils/branchMutationErrors";

export function BranchEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const incomingFrom = useIncomingFrom();
  const { toast } = useToast();
  const branchId = id ?? "";
  const [isDirty, setIsDirty] = useState(false);
  const { blocker, allowLeave, resetAllowLeave } = useUnsavedChangesGuard({
    isDirty,
  });
  const wasSubmittingRef = useRef(false);

  const { data: branch, isLoading, isError } = useBranch(branchId);

  const updateMutation = useUpdateBranch({
    onSuccess: () => {
      toast({
        title: branchesCopy.edit.toasts.successTitle,
        description: branchesCopy.edit.toasts.successDescription,
        variant: "success",
      });
      navigatePreservingFrom(navigate, `/branches/${branchId}`, incomingFrom);
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
    (values: BranchFormData) => {
      if (!branchId) return;
      allowLeave();
      updateMutation.mutate({
        id: branchId,
        data: branchFormToUpdateDTO(values),
      });
    },
    [allowLeave, branchId, updateMutation],
  );

  const handleCancel = useCallback(() => {
    navigatePreservingFrom(navigate, `/branches/${branchId}`, incomingFrom);
  }, [navigate, branchId, incomingFrom]);

  return (
    <FormPageShell
      className="p-4 sm:p-6"
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
        subtitle: branch
          ? branchesCopy.edit.subtitle(branch.code, branch.isMain)
          : undefined,
        trailing:
          branch?.isMain ? (
            <Badge variant="info" tone="soft">
              {branchesCopy.edit.mainBadge}
            </Badge>
          ) : undefined,
      }}
    >
      {branch ? (
        <BranchForm
          key={branch.id}
          branch={branch}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onDirtyChange={setIsDirty}
          isSubmitting={updateMutation.isPending}
        />
      ) : null}
      <UnsavedChangesDialog blocker={blocker} />
    </FormPageShell>
  );
}
