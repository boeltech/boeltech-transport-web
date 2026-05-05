/**
 * EditVehiclePage
 *
 * Página para editar un vehículo existente.
 *
 * Ubicación: src/features/vehicles/presentation/pages/EditVehiclePage.tsx
 */

import { useNavigate, useParams } from "react-router-dom";
import { Truck } from "lucide-react";
import { useToast } from "@shared/hooks";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
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

  const vehicle = data;

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
    const rest = { ...data } as Record<string, unknown>;
    delete rest.unitNumber;
    const payload: UpdateVehiclePayload = {};

    for (const [key, value] of Object.entries(rest)) {
      if (value !== "" && value !== undefined) {
        (payload as Record<string, unknown>)[key] = value;
      }
    }

    updateVehicle.mutate({ id: id!, data: payload });
  };

  return (
    <FormPageShell
      isLoading={isLoading}
      notFound={!vehicle}
      notFoundConfig={{
        icon: <Truck />,
        title: "Vehículo no encontrado",
        description: "El vehículo que intentas editar no existe o fue eliminado.",
        backHref: "/vehicles",
        backLabel: "Volver a Vehículos",
      }}
      header={{
        backHref: `/vehicles/${id}`,
        icon: <Truck className="h-5 w-5" />,
        title: vehicle ? `Editar Vehículo ${vehicle.unitNumber}` : "Editar Vehículo",
        subtitle: vehicle
          ? `${vehicle.brand} ${vehicle.model} (${vehicle.year})`
          : undefined,
      }}
    >
      {vehicle ? (
        <VehicleForm
          vehicle={vehicle}
          onSubmit={handleSubmit}
          isSubmitting={updateVehicle.isPending}
        />
      ) : null}
    </FormPageShell>
  );
}
