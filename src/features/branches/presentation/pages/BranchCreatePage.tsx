import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { WizardPageShell } from "@shared/ui/page-shells/WizardPageShell";
import type { WizardStepRenderHelpers } from "@shared/ui/page-shells/WizardPageShell";
import { UnsavedChangesDialog } from "@shared/ui/form";
import { useToast, useUnsavedChangesGuard } from "@shared/hooks";
import {
  getErrorMessage,
  isApiError,
} from "@shared/api/interceptors/error-handler";
import { useCreateBranch } from "../../application";
import { BranchForm, type BranchFormRef } from "../components";
import { branchesCopy } from "../copy/branchesCopy";
import { branchFormToCreateDTO, type BranchFormData } from "../validation/branchSchema";

export function BranchCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const formRef = useRef<BranchFormRef>(null);
  const [isDirty, setIsDirty] = useState(false);
  const { blocker, allowLeave, resetAllowLeave } = useUnsavedChangesGuard({
    isDirty,
  });
  const wasSubmittingRef = useRef(false);

  const createMutation = useCreateBranch({
    onSuccess: (data) => {
      toast({
        title: branchesCopy.create.toasts.successTitle,
        description: branchesCopy.create.toasts.success(data.name),
        variant: "success",
      });
      navigate(`/branches/${data.id}`);
    },
    onError: (error) => {
      if (isApiError(error) && error.code === "BRANCH_LIMIT_REACHED") {
        toast({
          title: branchesCopy.limitReached.title,
          description: error.message || branchesCopy.limitReached.description,
          variant: "destructive",
        });
        return;
      }

      if (isApiError(error) && error.code === "BRANCH_CODE_EXISTS") {
        toast({
          title: branchesCopy.errors.codeExists.title,
          description:
            error.message || branchesCopy.errors.codeExists.description,
          variant: "destructive",
        });
        return;
      }

      if (isApiError(error) && error.code === "MAIN_BRANCH_EXISTS") {
        toast({
          title: branchesCopy.errors.mainExists.title,
          description:
            error.message || branchesCopy.errors.mainExists.description,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: branchesCopy.create.toasts.errorTitle,
        description: isApiError(error)
          ? error.getDetailedMessage(3)
          : getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (createMutation.isPending) {
      wasSubmittingRef.current = true;
      return;
    }
    if (wasSubmittingRef.current) {
      wasSubmittingRef.current = false;
      resetAllowLeave();
    }
  }, [createMutation.isPending, resetAllowLeave]);

  const handleSubmit = useCallback(
    (values: BranchFormData) => {
      allowLeave();
      createMutation.mutate(branchFormToCreateDTO(values));
    },
    [allowLeave, createMutation],
  );

  const handleCancel = useCallback(() => navigate("/branches"), [navigate]);

  const shellHeader = useMemo(
    () => ({
      backHref: "/branches",
      backLabel: branchesCopy.create.backLabel,
      icon: <Building2 className="h-5 w-5" />,
      title: branchesCopy.create.title,
      subtitle: branchesCopy.create.subtitle,
    }),
    [],
  );

  const isSubmitting = createMutation.isPending;

  const renderStep = useCallback(
    (currentStep: number, helpers?: WizardStepRenderHelpers) => {
      const stepHint =
        currentStep === 0
          ? branchesCopy.create.stepHints.general
          : currentStep === 1
            ? branchesCopy.create.stepHints.address
            : null;

      return (
        <>
          {stepHint ? (
            <p className="mb-4 max-w-xl text-sm text-muted-foreground">
              {stepHint}
            </p>
          ) : null}
          <BranchForm
            ref={formRef}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            wizardMode
            wizardStepIndex={currentStep}
            onEditStep={helpers?.goToStep}
            onDirtyChange={setIsDirty}
          />
        </>
      );
    },
    [handleSubmit, isSubmitting],
  );

  return (
    <>
      <WizardPageShell
        steps={[...branchesCopy.create.steps]}
        formRef={formRef}
        header={shellHeader}
        headerBackMode="wizard"
        renderStep={renderStep}
        isSubmitting={isSubmitting}
        submitLabel={branchesCopy.create.submitLabel}
        submittingLabel={branchesCopy.create.submittingLabel}
        onCancel={handleCancel}
        stepsAriaLabel={branchesCopy.create.stepsAriaLabel}
      />
      <UnsavedChangesDialog blocker={blocker} />
    </>
  );
}
