/**
 * DriverEditPage
 * Clean Architecture - Presentation Layer (Pages)
 *
 * Página para editar un conductor existente.
 *
 * Ubicación: src/features/drivers/presentation/pages/DriverEditPage.tsx
 */

import { useParams, useNavigate } from "react-router-dom";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import { UserCog, User } from "lucide-react";

import { useToast } from "@shared/hooks";
import { useDriver, useUpdateDriver } from "../../application";
import { DriverForm } from "../components/DriverForm";
import {
  driverFormDataToUpdateDriverDTO,
  type DriverFormData,
} from "../validation/driverSchema";
import { formatDriverName } from "../config/driverStatusConfig";

// ============================================================================
// COMPONENT
// ============================================================================

export function DriverEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const driverId = id || "";

  // ══════════════════════════════════════════════════════════════════════════
  // QUERIES
  // ══════════════════════════════════════════════════════════════════════════

  const { data: driver, isLoading, isError } = useDriver(driverId);

  // ══════════════════════════════════════════════════════════════════════════
  // MUTATIONS
  // ══════════════════════════════════════════════════════════════════════════

  const updateMutation = useUpdateDriver({
    onSuccess: () => {
      toast({
        title: "Conductor actualizado",
        description: "Los cambios han sido guardados exitosamente",
        variant: "success",
      });
      navigate(`/drivers/${driverId}`);
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar conductor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // ══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

  const handleSubmit = (data: DriverFormData) => {
    if (!driver) return;
    updateMutation.mutate({
      id: driverId,
      data: driverFormDataToUpdateDriverDTO(data, {
        status: driver.status,
        isActive: driver.isActive,
      }),
    });
  };

  const handleCancel = () => {
    navigate(`/drivers/${driverId}`);
  };

  const fullName = driver?.employee
    ? formatDriverName(driver.employee)
    : "Conductor";

  return (
    <FormPageShell
      isLoading={isLoading}
      notFound={!isLoading && (isError || !driver)}
      notFoundConfig={{
        icon: <User />,
        title: "Conductor no encontrado",
        description:
          "El conductor que buscas no existe o fue eliminado.",
        backHref: "/drivers",
        backLabel: "Volver a Conductores",
      }}
      header={{
        backHref: `/drivers/${driverId}`,
        icon: <UserCog className="h-5 w-5" />,
        title: "Editar Conductor",
        subtitle: driver ? fullName : undefined,
      }}
      className="p-6"
    >
      {driver ? (
        <DriverForm
          mode="edit"
          driver={driver}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={updateMutation.isPending}
        />
      ) : null}
    </FormPageShell>
  );
}

export default DriverEditPage;
