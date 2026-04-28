/**
 * CreateVehiclePage
 *
 * Página para registrar un nuevo vehículo en la flota (wizard alineado a viajes).
 *
 * Ubicación: src/features/vehicles/presentation/pages/CreateVehiclePage.tsx
 */

import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Truck } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import {
  WizardNavigationBar,
  WizardProgressCard,
  WizardSteps,
} from "@shared/ui/wizard";
import type { WizardStep } from "@shared/ui/wizard";
import { useToast } from "@shared/hooks";
import {
  VehicleForm,
  type VehicleFormRef,
} from "../components/VehicleForm";
import { useCreateVehicle } from "@features/vehicles/application";
import type { CreateVehicleFormData } from "../validation";
import {
  getErrorMessage,
  isApiError,
} from "@shared/api/interceptors/error-handler";

const WIZARD_STEPS: WizardStep[] = [
  {
    id: "ident",
    title: "Identificación",
    description: "Unidad, placa y datos del vehículo",
  },
  {
    id: "docs",
    title: "Capacidad y documentación",
    description: "Cargas, seguros y permiso SCT",
  },
  {
    id: "carta",
    title: "Carta Porte",
    description: "Autotransporte SAT",
  },
  {
    id: "review",
    title: "Revisión",
    description: "Confirmar antes de crear",
  },
];

const LAST_STEP_INDEX = WIZARD_STEPS.length - 1;

export function CreateVehiclePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const formRef = useRef<VehicleFormRef>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const createVehicle = useCreateVehicle({
    onSuccess: (data) => {
      toast({
        title: "Vehículo creado",
        description: `${data.unitNumber} registrado exitosamente`,
        variant: "success",
      });
      navigate("/vehicles");
    },
    onError: (error) => {
      if (isApiError(error)) {
        toast({
          title: "Error al crear vehículo",
          description: error.getDetailedMessage(3),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error al crear vehículo",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      }
    },
  });

  const handleSubmit = (data: CreateVehicleFormData) => {
    createVehicle.mutate(data);
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

  const handleConfirmCreate = async () => {
    for (let i = 0; i < 3; i++) {
      const ok = (await formRef.current?.triggerStepValidation(i)) ?? false;
      if (!ok) {
        setCurrentStep(i);
        toast({
          title: "Revisa el formulario",
          description: "Corrige los errores en este paso antes de crear el vehículo.",
          variant: "destructive",
        });
        return;
      }
    }
    formRef.current?.requestSubmit();
  };

  const isSubmitting = createVehicle.isPending;
  const isReview = currentStep === LAST_STEP_INDEX;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 pb-24">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => navigate("/vehicles")}
          disabled={isSubmitting}
          aria-label="Volver a la lista de vehículos"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Truck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nuevo Vehículo</h1>
            <p className="text-sm text-muted-foreground">
              Completa los pasos para registrar un vehículo en la flota
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
          ariaLabel="Pasos para registrar un vehículo"
        />
      </WizardProgressCard>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {WIZARD_STEPS[currentStep]?.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VehicleForm
            ref={formRef}
            onSubmit={handleSubmit}
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
        onCancel={() => navigate("/vehicles")}
        onNext={handleNext}
        onSubmit={handleConfirmCreate}
        isSubmitting={isSubmitting}
        submitLabel="Crear vehículo"
        submittingContent={<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando...</>}
        submitIcon={<Check className="mr-2 h-4 w-4" />}
      />
    </div>
  );
}
