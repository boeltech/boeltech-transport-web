/**
 * CreateVehiclePage
 *
 * Página para registrar un nuevo vehículo en la flota.
 *
 * Ubicación: src/features/vehicles/presentation/pages/CreateVehiclePage.tsx
 */

import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@shared/ui/button";
import { useToast } from "@shared/hooks";
import { VehicleForm } from "../components/VehicleForm";
import { useCreateVehicle } from "@features/vehicles/application";
import type { CreateVehicleFormData } from "../validation";
import {
  getErrorMessage,
  isApiError,
} from "@shared/api/interceptors/error-handler";

// ============================================================================
// COMPONENT
// ============================================================================

export function CreateVehiclePage() {
  const navigate = useNavigate();
  const { toast } = useToast();

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
        // Opción 1: Mensaje corto (1 línea)
        // toast({
        //   title: "Error al crear vehículo",
        //   description: error.getToastMessage(),
        //   variant: "destructive",
        // });

        // Opción 2: Mensaje detallado (múltiples líneas)
        toast({
          title: "Error al crear vehículo",
          description: error.getDetailedMessage(3),
          variant: "destructive",
        });

        // Opción 3: Ver lista completa de errores
        // console.log(error.getErrorList());
        // [{ field: "insurance_expiry", label: "Vencimiento del seguro", message: "Invalid date" }]

        // Opción 4: Para React Hook Form
        // const fieldErrors = error.getFieldErrors();
        // Object.entries(fieldErrors).forEach(([field, message]) => {
        //   form.setError(field, { message });
        // });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/vehicles")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuevo Vehículo</h1>
          <p className="text-muted-foreground">
            Registrar un nuevo vehículo en la flota
          </p>
        </div>
      </div>

      {/* Form */}
      <VehicleForm
        onSubmit={handleSubmit}
        isSubmitting={createVehicle.isPending}
      />
    </div>
  );
}
