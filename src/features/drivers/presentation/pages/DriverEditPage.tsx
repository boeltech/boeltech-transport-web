/**
 * DriverEditPage
 * Clean Architecture - Presentation Layer (Pages)
 *
 * Página para editar un conductor existente.
 *
 * Ubicación: src/features/drivers/presentation/pages/DriverEditPage.tsx
 */

import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@shared/ui/button";
import { Skeleton } from "@shared/ui/skeleton";
import { Card, CardContent, CardHeader } from "@shared/ui/card";
import { ArrowLeft, UserCog, User } from "lucide-react";

import { useToast } from "@shared/hooks";
import { useDriver, useUpdateDriver } from "../../application";
import { DriverForm } from "../components/DriverForm";
import type { DriverFormData } from "../validation/driverSchema";
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
    updateMutation.mutate({
      id: driverId,
      data: {
        // No incluir employeeId en update (no se puede cambiar)
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
      },
    });
  };

  const handleCancel = () => {
    navigate(`/drivers/${driverId}`);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ══════════════════════════════════════════════════════════════════════════

  if (isLoading) {
    return <DriverEditSkeleton />;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ERROR / NOT FOUND STATE
  // ══════════════════════════════════════════════════════════════════════════

  if (isError || !driver) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <User className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Conductor no encontrado</h2>
        <p className="text-muted-foreground mb-4">
          El conductor que buscas no existe o fue eliminado.
        </p>
        <Button onClick={() => navigate("/drivers")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Conductores
        </Button>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  const fullName = driver.employee
    ? formatDriverName(driver.employee)
    : "Conductor";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/drivers/${driverId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <UserCog className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Editar Conductor</h1>
            <p className="text-sm text-muted-foreground">{fullName}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <DriverForm
        mode="edit"
        driver={driver}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function DriverEditSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Form cards */}
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

export default DriverEditPage;
