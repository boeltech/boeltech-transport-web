/**
 * EmployeeEditPage
 * Edición de empleado — patrón DriverEditPage / EditVehiclePage.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useIncomingFrom } from "@shared/utils/listQueueFrom";
import { resolveInternalAppHref } from "@shared/utils/resolveInternalAppHref";
import { User, UserCog } from "lucide-react";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import { UnsavedChangesDialog } from "@shared/ui/form";
import { useToast, useUnsavedChangesGuard } from "@shared/hooks";

import { useEmployee } from "../../application/hooks/useEmployees";
import { EmployeeFormInner } from "../components/EmployeeFormInner";
import { EmployeeStatusBadge } from "../config/employeeStatusConfig";
import { employeesCopy } from "../copy";

const copy = employeesCopy.form;

export function EmployeeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const incomingFrom = useIncomingFrom();
  const { toast } = useToast();
  const employeeId = id ?? "";
  const [isDirty, setIsDirty] = useState(false);
  const { blocker, allowLeave, resetAllowLeave } = useUnsavedChangesGuard({
    isDirty,
  });
  const wasSubmittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: response, isLoading, isError } = useEmployee(
    employeeId,
    Boolean(employeeId),
  );
  const employee = response?.data;

  const detailFallback = employeeId ? `/employees/${employeeId}` : "/employees";
  const backHref = resolveInternalAppHref(incomingFrom, detailFallback);

  useEffect(() => {
    if (isSubmitting) {
      wasSubmittingRef.current = true;
      return;
    }
    if (wasSubmittingRef.current) {
      wasSubmittingRef.current = false;
      resetAllowLeave();
    }
  }, [isSubmitting, resetAllowLeave]);

  const handleCancel = useCallback(() => {
    navigate(backHref);
  }, [navigate, backHref]);

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
        backHref,
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
          onDirtyChange={setIsDirty}
          onAllowLeave={allowLeave}
          onSubmittingChange={setIsSubmitting}
          onSaveSuccess={() => {
            toast({
              title: copy.edit.toast.successTitle,
              description: copy.edit.toast.successDescription,
              variant: "success",
            });
            navigate(backHref);
          }}
        />
      ) : null}
      <UnsavedChangesDialog blocker={blocker} />
    </FormPageShell>
  );
}

export default EmployeeEditPage;
