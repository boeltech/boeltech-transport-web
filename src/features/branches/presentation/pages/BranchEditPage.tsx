import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useIncomingWayfinding } from "@shared/utils/listQueueFrom";
import {
  BRANCHES_LIST_PATH,
  MODULE_LIST_PATH_LABELS,
  navigatePreservingFrom,
  resolveDetailCrumbs,
} from "@shared/utils/masterWayfinding";
import { Building2 } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import { UnsavedChangesDialog } from "@shared/ui/form";
import { useToast, useUnsavedChangesGuard } from "@shared/hooks";
import {
  getErrorMessage,
  isApiError,
} from "@shared/api/interceptors/error-handler";
import { useBranch, useUpdateBranch } from "../../application";
import { BranchForm } from "../components";
import { branchesCopy } from "../copy/branchesCopy";
import { branchFormToUpdateDTO, type BranchFormData } from "../validation/branchSchema";
import { getBranchMutationErrorToast } from "../utils/branchMutationErrors";

const BRANCHES_MODULE_LABEL =
  MODULE_LIST_PATH_LABELS[BRANCHES_LIST_PATH] ?? "Sucursales";

export function BranchEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const incoming = useIncomingWayfinding();
  const incomingFrom = incoming?.from;
  const { toast } = useToast();
  const branchId = id ?? "";
  const detailFallback = branchId
    ? `${BRANCHES_LIST_PATH}/${branchId}`
    : BRANCHES_LIST_PATH;
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
      navigatePreservingFrom(navigate, detailFallback, incomingFrom);
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
    navigatePreservingFrom(navigate, detailFallback, incomingFrom);
  }, [navigate, detailFallback, incomingFrom]);

  const crumbs = useMemo(
    () =>
      resolveDetailCrumbs({
        from: incomingFrom ?? detailFallback,
        fromLabel: incoming?.fromLabel ?? branch?.name,
        module: {
          listPath: BRANCHES_LIST_PATH,
          label: BRANCHES_MODULE_LABEL,
        },
        current: { label: "Editar" },
      }),
    [branch?.name, detailFallback, incoming?.fromLabel, incomingFrom],
  );

  return (
    <FormPageShell
      className="p-4 sm:p-6"
      isLoading={isLoading}
      notFound={!isLoading && (isError || !branch)}
      notFoundConfig={{
        icon: <Building2 />,
        title: branchesCopy.edit.notFound.title,
        description: branchesCopy.edit.notFound.description,
        backHref: BRANCHES_LIST_PATH,
        backLabel: branchesCopy.edit.notFound.backLabel,
      }}
      header={{
        crumbs,
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
