/**
 * EmployeeEditPage
 * Edición de empleado — patrón DriverEditPage / EditVehiclePage.
 */

import { useParams, useNavigate } from "react-router-dom";
import { User, UserCog } from "lucide-react";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import { useToast } from "@shared/hooks";

import { useEmployee } from "../../application/hooks/useEmployees";
import { EmployeeFormInner } from "../components/EmployeeFormInner";
import { EmployeeStatusBadge } from "../config/employeeStatusConfig";
import { employeesCopy } from "../copy";

const copy = employeesCopy.form;

export function EmployeeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const employeeId = id ?? "";

  const { data: response, isLoading, isError } = useEmployee(
    employeeId,
    Boolean(employeeId),
  );
  const employee = response?.data;

  const handleCancel = () => {
    navigate(`/employees/${employeeId}`);
  };

  return (
    <FormPageShell
      isLoading={isLoading}
      notFound={!isLoading && (isError || !employee)}
      notFoundConfig={{
        icon: <User />,
        title: copy.state.notFoundTitle,
        description: copy.state.notFoundDescription,
        backHref: "/employees",
        backLabel: copy.state.backToList,
      }}
      header={{
        backHref: employeeId ? `/employees/${employeeId}` : "/employees",
        icon: <UserCog className="h-5 w-5" />,
        title: copy.edit.title,
        subtitle: employee
          ? copy.edit.subtitle(
              employee.fullName,
              employee.employeeNumber,
              employee.position,
              employee.department,
            )
          : undefined,
        trailing: employee ? (
          <EmployeeStatusBadge status={employee.status} showIcon size="sm" />
        ) : undefined,
      }}
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
              title: copy.edit.toast.successTitle,
              description: copy.edit.toast.successDescription,
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
