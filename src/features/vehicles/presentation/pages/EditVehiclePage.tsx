/**
 * EditVehiclePage
 *
 * Página para editar un vehículo existente.
 *
 * Ubicación: src/features/vehicles/presentation/pages/EditVehiclePage.tsx
 */

import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Skeleton } from "@shared/ui/skeleton";
import { useToast } from "@shared/hooks";
import { VehicleForm } from "../components/VehicleForm";
import { useVehicle, useUpdateVehicle } from "@features/vehicles/application";
import type { CreateVehicleFormData } from "../validation";
import type { UpdateVehiclePayload } from "@features/vehicles/domain";

// ============================================================================
// COMPONENT
// ============================================================================

export function EditVehiclePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, isLoading } = useVehicle(id!);

  const vehicle = data?.data;

  const updateVehicle = useUpdateVehicle({
    onSuccess: () => {
      toast({
        title: "Vehículo actualizado",
        description: "Los datos se actualizaron exitosamente",
        variant: "success",
      });
      navigate(`/vehicles/${id}`);
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CreateVehicleFormData) => {
    // Strip unitNumber since it can't be updated, and strip empty strings
    const { unitNumber, ...rest } = data;
    const payload: UpdateVehiclePayload = {};

    for (const [key, value] of Object.entries(rest)) {
      if (value !== "" && value !== undefined) {
        (payload as Record<string, unknown>)[key] = value;
      }
    }

    updateVehicle.mutate({ id: id!, data: payload });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Vehículo no encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/vehicles/${id}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Editar Vehículo {vehicle.unitNumber}
          </h1>
          <p className="text-muted-foreground">
            {vehicle.brand} {vehicle.model} ({vehicle.year})
          </p>
        </div>
      </div>

      {/* Form */}
      <VehicleForm
        vehicle={vehicle}
        onSubmit={handleSubmit}
        isSubmitting={updateVehicle.isPending}
      />
    </div>
  );
}
