/**
 * EmployeeFormPage
 * Alta de empleado (wizard canónico con WizardPageShell).
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import {
  WizardPageShell,
  type WizardFormRef,
} from "@shared/ui/page-shells/WizardPageShell";
import {
  EmployeeFormInner,
} from "../components/EmployeeFormInner";
import { EMPLOYEE_WIZARD_STEPS } from "../components/employeeWizardSteps";

export function EmployeeFormPage() {
  const navigate = useNavigate();
  const formRef = useRef<WizardFormRef | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shellHeader = useMemo(
    () => ({
      backHref: "/employees",
      backLabel: "Volver al listado",
      icon: <UserPlus className="h-5 w-5" />,
      title: "Nuevo Empleado",
      subtitle: "Completa los pasos para registrar un empleado",
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
      />
    ),
    [],
  );

  return (
    <WizardPageShell
      steps={EMPLOYEE_WIZARD_STEPS}
      formRef={formRef}
      header={shellHeader}
      renderStep={renderStep}
      isSubmitting={isSubmitting}
      submitLabel="Registrar empleado"
      submittingLabel="Registrando..."
      stepsAriaLabel="Pasos para registrar un empleado"
      onCancel={() => navigate("/employees")}
      headerBackMode="wizard"
      className="pb-8"
    />
  );
}

export default EmployeeFormPage;
