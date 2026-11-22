/**
 * EmployeeFormPage
 * Alta de empleado (wizard canónico con WizardPageShell).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIncomingFrom } from "@shared/utils/listQueueFrom";
import {
  EMPLOYEES_LIST_PATH,
  MODULE_LIST_PATH_LABELS,
} from "@shared/utils/masterWayfinding";
import { resolveInternalAppHref } from "@shared/utils/resolveInternalAppHref";
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
const EMPLOYEES_MODULE_LABEL =
  MODULE_LIST_PATH_LABELS[EMPLOYEES_LIST_PATH] ?? "Empleados";

export function EmployeeFormPage() {
  const navigate = useNavigate();
  const incomingFrom = useIncomingFrom();
  const cancelHref = resolveInternalAppHref(incomingFrom, EMPLOYEES_LIST_PATH);
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

  const handleCancel = useCallback(
    () => navigate(cancelHref),
    [navigate, cancelHref],
  );

  const shellHeader = useMemo(
    () => ({
      crumbs: [
        { label: EMPLOYEES_MODULE_LABEL, to: EMPLOYEES_LIST_PATH },
        { label: fc.create.title },
      ],
      exitHref: EMPLOYEES_LIST_PATH,
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
        createReturnFrom={cancelHref}
        onSubmittingChange={setIsSubmitting}
        onDirtyChange={setIsDirty}
        onAllowLeave={allowLeave}
      />
    ),
    [allowLeave, cancelHref],
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
        className="pb-8"
      />
      <UnsavedChangesDialog blocker={blocker} />
    </>
  );
}

export default EmployeeFormPage;
