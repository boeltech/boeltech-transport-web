/**
 * CreateVehiclePage
 *
 * Página para registrar un nuevo vehículo en la flota (wizard alineado a viajes).
 *
 * Ubicación: src/features/vehicles/presentation/pages/CreateVehiclePage.tsx
 */

import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Truck } from "lucide-react";
import { WizardPageShell } from "@shared/ui/page-shells/WizardPageShell";
import { useToast } from "@shared/hooks";
import { Switch } from "@shared/ui/switch";
import { Label } from "@shared/ui/label";
import {
  VehicleForm,
  type VehicleFormRef,
} from "../components/VehicleForm";
import { useCreateVehicle } from "@features/vehicles/application";
import type { CreateVehiclePayload } from "@features/vehicles/domain";
import type { CreateVehicleFormData } from "../validation";
import {
  getErrorMessage,
  isApiError,
} from "@shared/api/interceptors/error-handler";

const WIZARD_STEPS = [
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

export function CreateVehiclePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const formRef = useRef<VehicleFormRef>(null);
  const [showSatCodes, setShowSatCodes] = useState(false);

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
    const payload: CreateVehiclePayload = {
      ...data,
      currentMileage: data.currentMileage ?? 0,
    };
    createVehicle.mutate(payload);
  };

  const isSubmitting = createVehicle.isPending;

  return (
    <WizardPageShell
      steps={WIZARD_STEPS}
      formRef={formRef}
      header={{
        backHref: "/vehicles",
        backLabel: "Volver a la lista de vehículos",
        icon: <Truck className="h-5 w-5" />,
        title: "Nuevo Vehículo",
        subtitle: "Completa los pasos para registrar un vehículo en la flota",
      }}
      renderStep={(currentStep) => (
        <div className="space-y-3">
          {currentStep < WIZARD_STEPS.length - 1 ? (
            <div className="flex items-center justify-end rounded-lg border bg-muted/30 px-3 py-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="vehicle-show-sat-codes"
                  checked={showSatCodes}
                  onCheckedChange={setShowSatCodes}
                  aria-label="Mostrar claves SAT en etiquetas del formulario"
                />
                <Label
                  htmlFor="vehicle-show-sat-codes"
                  className="cursor-pointer text-xs text-muted-foreground"
                >
                  Mostrar claves SAT en etiquetas
                </Label>
              </div>
            </div>
          ) : null}
          <VehicleForm
            ref={formRef}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            wizardMode
            wizardStepIndex={currentStep}
            showSatCodes={showSatCodes}
          />
        </div>
      )}
      isSubmitting={isSubmitting}
      submitLabel="Crear vehículo"
      submittingLabel="Creando..."
      stepsAriaLabel="Pasos para registrar un vehículo"
      onCancel={() => navigate("/vehicles")}
    />
  );
}
