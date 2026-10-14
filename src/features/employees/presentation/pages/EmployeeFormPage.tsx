/**
 * EmployeeFormPage
 * Alta de empleado (wizard canónico con WizardPageShell).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import {
  WizardPageShell,
  type WizardFormRef,
} from "@shared/ui/page-shells/WizardPageShell";
import { UnsavedChangesDialog } from "@shared/ui/form";
import { useUnsavedChangesGuard } from "@shared/hooks";
import {
  EmployeeFormInner,
} from "../components/EmployeeFormInner";
import { EMPLOYEE_WIZARD_STEPS } from "../components/employeeWizardSteps";
import { employeesCopy } from "../copy";

const fc = employeesCopy.form;

export function EmployeeFormPage() {
  const navigate = useNavigate();
  const formRef = useRef<WizardFormRef | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const { blocker, allowLeave, resetAllowLeave } = useUnsavedChangesGuard({
    isDirty,
  });
  const wasSubmittingRef = useRef(false);

  useEffect(() => {
    if (isSubmitting) {
      wasSubmittingRef.current = true;
      return;
    }
    if (wasSubmittingRef.current) {
      wasSubmittingRef.current = false;
      resetAllowLeave();
    }
  }, [isSubmitting, resetAllowLeave]);

  const handleCancel = useCallback(() => navigate("/employees"), [navigate]);

  const shellHeader = useMemo(
    () => ({
      backHref: "/employees",
      backLabel: fc.create.backLabel,
      icon: <UserPlus className="h-5 w-5" />,
      title: fc.create.title,
      subtitle: fc.create.subtitle,
    }),
    [],
  );

  const renderStep = useCallback(
    (currentStep: number) => (
      <EmployeeFormInner
        ref={formRef}
        key="new"
        isEditing={false}
        embeddedInWizardShell
        wizardStepIndex={currentStep}
        onSubmittingChange={setIsSubmitting}
        onDirtyChange={setIsDirty}
        onAllowLeave={allowLeave}
      />
    ),
    [allowLeave],
  );

  return (
    <>
      <WizardPageShell
        steps={EMPLOYEE_WIZARD_STEPS}
        formRef={formRef}
        header={shellHeader}
        renderStep={renderStep}
        isSubmitting={isSubmitting}
        submitLabel={fc.create.submit}
        submittingLabel={fc.create.submittingLabel}
        stepsAriaLabel={fc.create.wizardAriaLabel}
        onCancel={handleCancel}
        headerBackMode="wizard"
        className="pb-8"
      />
      <UnsavedChangesDialog blocker={blocker} />
    </>
  );
}

export default EmployeeFormPage;
