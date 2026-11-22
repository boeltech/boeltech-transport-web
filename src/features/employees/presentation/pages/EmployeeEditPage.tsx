/**
 * EmployeeEditPage
 * Edición de empleado — patrón DriverEditPage / EditVehiclePage.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useIncomingWayfinding } from "@shared/utils/listQueueFrom";
import {
  EMPLOYEES_LIST_PATH,
  MODULE_LIST_PATH_LABELS,
  resolveDetailCrumbs,
} from "@shared/utils/masterWayfinding";
import { resolveInternalAppHref } from "@shared/utils/resolveInternalAppHref";
import { User } from "lucide-react";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import { UnsavedChangesDialog } from "@shared/ui/form";
import { useToast, useUnsavedChangesGuard } from "@shared/hooks";

import { useEmployee } from "../../application/hooks/useEmployees";
import { EmployeeFormInner } from "../components/EmployeeFormInner";
import { EmployeeStatusBadge } from "../config/employeeStatusConfig";
import { employeesCopy } from "../copy";

const copy = employeesCopy.form;
const EMPLOYEES_MODULE_LABEL =
  MODULE_LIST_PATH_LABELS[EMPLOYEES_LIST_PATH] ?? "Empleados";

export function EmployeeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const incoming = useIncomingWayfinding();
  const incomingFrom = incoming?.from;
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

  const detailFallback = employeeId
    ? `${EMPLOYEES_LIST_PATH}/${employeeId}`
    : EMPLOYEES_LIST_PATH;
  // S5-01: Cancelar/guardar debe volver al origen (p. ej. alta de pago), no al detalle.
  const exitHref = resolveInternalAppHref(incomingFrom, detailFallback);

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
    navigate(exitHref);
  }, [navigate, exitHref]);

  const crumbs = useMemo(
    () =>
      resolveDetailCrumbs({
        from: incomingFrom ?? detailFallback,
        fromLabel: incoming?.fromLabel ?? employee?.fullName,
        module: {
          listPath: EMPLOYEES_LIST_PATH,
          label: EMPLOYEES_MODULE_LABEL,
        },
        current: { label: "Editar" },
      }),
    [
      detailFallback,
      employee?.fullName,
      incoming?.fromLabel,
      incomingFrom,
    ],
  );

  return (
    <FormPageShell
      isLoading={isLoading}
      notFound={!isLoading && (isError || !employee)}
      notFoundConfig={{
        icon: <User />,
        title: copy.state.notFoundTitle,
        description: copy.state.notFoundDescription,
        backHref: EMPLOYEES_LIST_PATH,
        backLabel: copy.state.backToList,
      }}
      header={{
        crumbs,
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
            navigate(exitHref);
          }}
        />
      ) : null}
      <UnsavedChangesDialog blocker={blocker} />
    </FormPageShell>
  );
}

export default EmployeeEditPage;
