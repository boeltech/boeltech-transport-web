/**
 * DriverCreatePage
 * Clean Architecture - Presentation Layer (Pages)
 *
 * Página para registrar un nuevo conductor (wizard con WizardPageShell).
 */

import { useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { WizardPageShell } from "@shared/ui/page-shells/WizardPageShell";
import { useToast } from "@shared/hooks";
import { useCreateDriver } from "../../application";
import {
  DriverForm,
  type DriverFormRef,
} from "../components/DriverForm";
import {
  driverFormDataToCreateDriverDTO,
  type DriverFormData,
} from "../validation/driverSchema";
import {
  getErrorMessage,
  isApiError,
} from "@shared/api/interceptors/error-handler";
import { driversCopy } from "../copy";

const wizardStepsCopy = driversCopy.form.create.wizard.steps;
const createCopy = driversCopy.form.create;

const WIZARD_STEPS = [
  {
    id: "emp",
    title: wizardStepsCopy.employee.title,
    description: wizardStepsCopy.employee.description,
  },
  {
    id: "lic",
    title: wizardStepsCopy.licenses.title,
    description: wizardStepsCopy.licenses.description,
  },
  {
    id: "exam",
    title: wizardStepsCopy.exams.title,
    description: wizardStepsCopy.exams.description,
  },
  {
    id: "rev",
    title: wizardStepsCopy.review.title,
    description: wizardStepsCopy.review.description,
  },
];

export function DriverCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const formRef = useRef<DriverFormRef>(null);

  const createMutation = useCreateDriver({
    onSuccess: (driver) => {
      toast({
        title: createCopy.toast.successTitle,
        description: createCopy.toast.successDescription,
        variant: "success",
      });
      navigate(`/drivers/${driver.id}`);
    },
    onError: (error) => {
      if (isApiError(error) && error.hasValidationErrors()) {
        formRef.current?.applyApiValidationErrors(
          error.validationErrors.map((entry) => ({
            field: entry.field,
            message: entry.message,
          })),
        );
        toast({
          title: createCopy.toast.errorTitle,
          description: error.getToastMessage(),
          variant: "destructive",
        });
        return;
      }

      const description = isApiError(error)
        ? error.getDetailedMessage()
        : getErrorMessage(error);
      formRef.current?.setApiAlertMessages(
        description ? [description] : [getErrorMessage(error)],
      );
      toast({
        title: createCopy.toast.errorTitle,
        description,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = useCallback(
    (data: DriverFormData) => {
      createMutation.mutate(driverFormDataToCreateDriverDTO(data));
    },
    [createMutation],
  );

  const isSubmitting = createMutation.isPending;
  const handleCancel = useCallback(() => navigate("/drivers"), [navigate]);

  const renderStep = useCallback(
    (currentStep: number) => (
      <>
        {currentStep < 3 ? (
          <p className="mb-4 max-w-md text-sm text-muted-foreground">
            {createCopy.stepHelper}
          </p>
        ) : null}
        <DriverForm
          ref={formRef}
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          wizardMode
          wizardStepIndex={currentStep}
        />
      </>
    ),
    [handleCancel, handleSubmit, isSubmitting],
  );

  const shellHeader = useMemo(
    () => ({
      backHref: "/drivers",
      backLabel: "Volver a la lista de conductores",
      icon: <UserPlus className="h-5 w-5" />,
      title: createCopy.title,
      subtitle: createCopy.subtitle,
    }),
    [],
  );

  return (
    <WizardPageShell
      steps={WIZARD_STEPS}
      formRef={formRef}
      header={shellHeader}
      renderStep={renderStep}
      isSubmitting={isSubmitting}
      submitLabel={driversCopy.form.action.register}
      submittingLabel="Registrando..."
      stepsAriaLabel="Pasos para registrar un conductor"
      onCancel={handleCancel}
    />
  );
}

export default DriverCreatePage;
