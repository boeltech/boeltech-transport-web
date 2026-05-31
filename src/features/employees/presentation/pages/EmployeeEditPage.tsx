/**
 * EmployeeEditPage
 * Edición de empleado — mismo patrón que DriverEditPage / ClientEditPage / EditVehiclePage.
 */

import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle, UserCog } from "lucide-react";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import { useToast } from "@shared/hooks";

import { useEmployee } from "../../application/hooks/useEmployees";
import { EmployeeFormInner } from "../components/EmployeeFormInner";

export function EmployeeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const employeeId = id ?? "";

  const { data: response, isLoading, isError } = useEmployee(employeeId, Boolean(employeeId));
  const employee = response?.data;

  const handleCancel = () => {
    navigate(`/employees/${employeeId}`);
  };

  return (
    <FormPageShell
      isLoading={isLoading}
      notFound={!isLoading && (isError || !employee)}
      notFoundConfig={{
        icon: <AlertCircle />,
        title: "Empleado no encontrado",
        description: "El empleado que intentas editar no existe o fue eliminado.",
        backHref: "/employees",
        backLabel: "Volver al listado",
      }}
      header={{
        backHref: employeeId ? `/employees/${employeeId}` : "/employees",
        icon: <UserCog className="h-5 w-5" />,
        title: "Editar Empleado",
        subtitle: employee?.fullName,
      }}
      className="p-6"
    >
      {employee ? (
        <EmployeeFormInner
          key={employee.id}
          id={employeeId}
          isEditing
          existing={employee}
          onCancel={handleCancel}
          onSaveSuccess={() => {
            toast({
              title: "Empleado actualizado",
              description: "Los cambios han sido guardados exitosamente",
              variant: "success",
            });
            navigate(`/employees/${employeeId}`);
          }}
        />
      ) : null}
    </FormPageShell>
  );
}

export default EmployeeEditPage;
