/**
 * DriverCreatePage
 * Clean Architecture - Presentation Layer (Pages)
 *
 * Página para registrar un nuevo conductor.
 *
 * Flujo:
 * 1. Usuario selecciona un empleado existente
 * 2. Usuario completa datos de licencia y certificados
 * 3. Se crea el registro de conductor vinculado al empleado
 */

import { useNavigate } from "react-router-dom";
import { Button } from "@shared/ui/button";
import { ArrowLeft, UserPlus } from "lucide-react";

import { useToast } from "@shared/hooks";
import { useCreateDriver } from "../../application";
import { DriverForm } from "../components/DriverForm";
import {
  type DriverFormData,
  // toApiCreateDriver,
} from "../validation/driverSchema";
import {
  getErrorMessage,
  isApiError,
} from "@shared/api/interceptors/error-handler";

// ============================================================================
// Component
// ============================================================================

export function DriverCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // ══════════════════════════════════════════════════════════════════════════
  // Mutations
  // ══════════════════════════════════════════════════════════════════════════

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

  // ══════════════════════════════════════════════════════════════════════════
  // Handlers
  // ══════════════════════════════════════════════════════════════════════════

  const handleSubmit = (data: DriverFormData) => {
    // Transformar a formato API (snake_case)
    // const apiData = toApiCreateDriver(data);
    createMutation.mutate(data);
  };

  const handleCancel = () => {
    navigate("/drivers");
  };

  // ══════════════════════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/drivers")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Registrar Conductor</h1>
            <p className="text-sm text-muted-foreground">
              Registrar un empleado existente como conductor
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <DriverForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}

export default DriverCreatePage;
