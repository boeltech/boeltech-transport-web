import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@shared/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { usePermissions } from "@shared/permissions";
import { AlertCircle } from "lucide-react";

import { useEmployee } from "../../application/hooks/useEmployees";
import {
  EmployeeCompensationTab,
  EmployeeContactTab,
  EmployeeDetailHeader,
  EmployeeEmploymentTab,
  EmployeePersonalTab,
  TerminateEmployeeDialog,
} from "../components/detail";

// ============================================================================
// COMPONENT
// ============================================================================

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const { data, isLoading, isError } = useEmployee(id!);
  const employee = data?.data;

  const [showTerminateDialog, setShowTerminateDialog] = useState(false);

  const canUpdate = hasPermission("employees", "update");
  const canDelete = hasPermission("employees", "delete");

  // --------------------------------------------------------------------------

  if (isLoading) return <DetailSkeleton />;

  if (isError || !employee) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Empleado no encontrado</p>
        <Button variant="outline" onClick={() => navigate("/employees")}>
          Volver al listado
        </Button>
      </div>
    );
  }

  const isTerminated = employee.status === "terminated";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <EmployeeDetailHeader
        employee={employee}
        employeeId={id!}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onTerminateClick={() => setShowTerminateDialog(true)}
      />

      {/* Tabs */}
      <Tabs defaultValue="personal" className="space-y-2">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 md:w-fit md:grid-cols-4">
          <TabsTrigger value="personal">Datos personales</TabsTrigger>
          <TabsTrigger value="contact">Contacto</TabsTrigger>
          <TabsTrigger value="employment">Laboral</TabsTrigger>
          <TabsTrigger value="compensation">Compensación</TabsTrigger>
        </TabsList>

        <EmployeePersonalTab employee={employee} />
        <EmployeeContactTab employee={employee} />
        <EmployeeEmploymentTab employee={employee} />
        <EmployeeCompensationTab employee={employee} />
      </Tabs>

      {!isTerminated && (
        <TerminateEmployeeDialog
          employeeId={id!}
          employeeName={employee.fullName}
          open={showTerminateDialog}
          onOpenChange={setShowTerminateDialog}
        />
      )}
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function DetailSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <div className="h-9 w-9 bg-muted rounded-md" />
        <div className="h-14 w-14 bg-muted rounded-full" />
        <div className="space-y-2">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  );
}
