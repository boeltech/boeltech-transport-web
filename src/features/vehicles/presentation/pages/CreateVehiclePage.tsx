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
      toast({
        title: "Error al crear vehículo",
        description: error.message,
        variant: "destructive",
      });
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
