/**
 * DriverCreatePage
 * Clean Architecture - Presentation Layer (Pages)
 *
 * Página para registrar un nuevo conductor (wizard alineado a viajes).
 */

import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import {
  WizardNavigationBar,
  WizardProgressCard,
  WizardSteps,
} from "@shared/ui/wizard";
import type { WizardStep } from "@shared/ui/wizard";
import { ArrowLeft, Check, Loader2, UserPlus } from "lucide-react";

import { useToast } from "@shared/hooks";
import { useCreateDriver } from "../../application";
import {
  DriverForm,
  type DriverFormRef,
} from "../components/DriverForm";
import type { DriverFormData } from "../validation/driverSchema";
import {
  getErrorMessage,
  isApiError,
} from "@shared/api/interceptors/error-handler";

const WIZARD_STEPS: WizardStep[] = [
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

const LAST_STEP_INDEX = WIZARD_STEPS.length - 1;

export function DriverCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const formRef = useRef<DriverFormRef>(null);
  const [currentStep, setCurrentStep] = useState(0);

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

  const handleSubmit = (data: DriverFormData) => {
    createMutation.mutate(data);
  };

  const validateCurrentStep = useCallback(async () => {
    if (currentStep >= LAST_STEP_INDEX) return true;
    return (await formRef.current?.triggerStepValidation(currentStep)) ?? false;
  }, [currentStep]);

  const handleNext = async () => {
    const ok = await validateCurrentStep();
    if (ok && currentStep < LAST_STEP_INDEX) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleStepClick = async (stepIndex: number) => {
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
      return;
    }
    const ok = await validateCurrentStep();
    if (ok) setCurrentStep(stepIndex);
  };

  const handleConfirm = async () => {
    for (let i = 0; i < 3; i++) {
      const ok = (await formRef.current?.triggerStepValidation(i)) ?? false;
      if (!ok) {
        setCurrentStep(i);
        toast({
          title: "Revisa el formulario",
          description:
            "Corrige los errores en este paso antes de registrar al conductor.",
          variant: "destructive",
        });
        return;
      }
    }
    formRef.current?.requestSubmit();
  };

  const isSubmitting = createMutation.isPending;
  const isReview = currentStep === LAST_STEP_INDEX;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 pb-24">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => navigate("/drivers")}
          disabled={isSubmitting}
          aria-label="Volver a la lista de conductores"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Registrar Conductor
            </h1>
            <p className="text-sm text-muted-foreground">
              Completa los pasos para registrar un empleado como conductor
            </p>
          </div>
        </div>
      </div>

      <WizardProgressCard>
        <WizardSteps
          steps={WIZARD_STEPS}
          currentStep={currentStep}
          onStepClick={handleStepClick}
          allowNavigation
          ariaLabel="Pasos para registrar un conductor"
        />
      </WizardProgressCard>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {WIZARD_STEPS[currentStep]?.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DriverForm
            ref={formRef}
            mode="create"
            onSubmit={handleSubmit}
            onCancel={() => navigate("/drivers")}
            isSubmitting={isSubmitting}
            wizardMode
            wizardStepIndex={currentStep}
          />
        </CardContent>
      </Card>

      <WizardNavigationBar
        canGoBack={currentStep > 0 && !isSubmitting}
        isLastStep={isReview}
        onPrevious={handlePrevious}
        onCancel={() => navigate("/drivers")}
        onNext={handleNext}
        onSubmit={handleConfirm}
        isSubmitting={isSubmitting}
        submitLabel="Registrar conductor"
        submittingContent={<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Registrando...</>}
        submitIcon={<Check className="mr-2 h-4 w-4" />}
      />
    </div>
  );
}

export default DriverCreatePage;
