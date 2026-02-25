/**
 * DriverCreatePage
 * Clean Architecture - Presentation Layer (Pages)
 *
 * Página para crear un nuevo conductor.
 *
 * Ubicación: src/features/drivers/presentation/pages/DriverCreatePage.tsx
 */

import { useNavigate } from "react-router-dom";
import { Button } from "@shared/ui/button";
import { ArrowLeft, UserPlus } from "lucide-react";

import { useToast } from "@shared/hooks";
import { useCreateDriver } from "../../application";
import { DriverForm } from "../components/DriverForm";
import type { DriverFormData } from "../validation/driverSchema";

// ============================================================================
// COMPONENT
// ============================================================================

export function DriverCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // ══════════════════════════════════════════════════════════════════════════
  // MUTATIONS
  // ══════════════════════════════════════════════════════════════════════════

  const createMutation = useCreateDriver({
    onSuccess: (driver) => {
      toast({
        title: "Conductor creado",
        description: "El conductor ha sido registrado exitosamente",
        variant: "success",
      });
      navigate(`/drivers/${driver.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error al crear conductor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // ══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

  const handleSubmit = (data: DriverFormData) => {
    createMutation.mutate({
      employeeId: data.employeeId,
      licenseNumber: data.licenseNumber,
      licenseType: data.licenseType,
      licenseExpiration: data.licenseExpiration,
      licenseIssuedDate: data.licenseIssuedDate || undefined,
      licenseIssuingState: data.licenseIssuingState || undefined,
      yearsOfExperience: data.yearsOfExperience,
      bloodType: data.bloodType || undefined,
      medicalCertificateExpiration:
        data.medicalCertificateExpiration || undefined,
      notes: data.notes || undefined,
      emergencyContactName: data.emergencyContactName || undefined,
      emergencyContactPhone: data.emergencyContactPhone || undefined,
      emergencyContactRelationship:
        data.emergencyContactRelationship || undefined,
    });
  };

  const handleCancel = () => {
    navigate("/drivers");
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
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
            <h1 className="text-2xl font-bold">Nuevo Conductor</h1>
            <p className="text-sm text-muted-foreground">
              Registrar un nuevo conductor en el sistema
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
