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

const WIZARD_STEPS = [
  {
    id: "emp",
    title: "Empleado",
    description: "Vincular un empleado existente",
  },
  {
    id: "lic",
    title: "Licencia y salud",
    description: "Licencia federal y certificado médico",
  },
  {
    id: "exam",
    title: "Exámenes y equipo",
    description: "Psicométrico, antidoping, GPS y notas",
  },
  {
    id: "rev",
    title: "Revisión",
    description: "Confirmar antes de registrar",
  },
];

export function DriverCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const formRef = useRef<DriverFormRef>(null);

  const createMutation = useCreateDriver({
    onSuccess: (driver) => {
      toast({
        title: "Conductor registrado",
        description: "El conductor ha sido registrado exitosamente",
        variant: "success",
      });
      navigate(`/drivers/${driver.id}`);
    },
    onError: (error) => {
      if (isApiError(error)) {
        toast({
          title: "Error al registrar conductor",
          description: error.getDetailedMessage(),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error al registrar conductor",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      }
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
            Completa los campos obligatorios del paso para continuar.
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
      title: "Registrar Conductor",
      subtitle:
        "Completa los pasos para registrar un empleado como conductor",
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
      submitLabel="Registrar conductor"
      submittingLabel="Registrando..."
      stepsAriaLabel="Pasos para registrar un conductor"
      onCancel={handleCancel}
    />
  );
}

export default DriverCreatePage;
