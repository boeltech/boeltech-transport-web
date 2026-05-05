/**
 * EmployeeFormPage
 * Crear o editar un empleado.
 *
 * UX improvements (2026-04-23):
 *  - Tab error indicators (dot rojo / verde por sección)
 *  - Auto-navegación al tab con el primer error al hacer submit
 *  - Footer sticky siempre visible
 *  - Barra de progreso de campos requeridos
 *  - Selects opcionales con opción "Sin especificar"
 *  - Input de salario con prefijo "$" y type="text"
 *  - Notas médicas consolidadas con notas generales en tab Laboral
 *  - h1 font-medium (estándar de diseño del ERP)
 *  - Texto de ayuda redundante eliminado del domicilio
 */

import { useParams } from "react-router-dom";
import { AlertCircle, User } from "lucide-react";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import { EmployeeFormInner } from "../components/EmployeeFormInner";
import { useEmployee } from "../../application/hooks/useEmployees";

// ============================================================================
// COMPONENT
// ============================================================================

export function EmployeeFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const {
    data: existingData,
    isLoading: isLoadingEmployee,
    isError: isEmployeeError,
  } = useEmployee(id!, isEditing);
  const existing = existingData?.data;

  const editShellHeader = {
    backHref: id ? `/employees/${id}` : "/employees",
    icon: <User className="h-5 w-5" />,
    title: "Editar empleado",
  };

  if (isEditing && isLoadingEmployee) {
    return (
      <FormPageShell isLoading header={editShellHeader} className="p-6">
        <></>
      </FormPageShell>
    );
  }

  if (isEditing && (isEmployeeError || !existing)) {
    return (
      <FormPageShell
        isLoading={false}
        notFound
        notFoundConfig={{
          icon: <AlertCircle />,
          title: "Empleado no encontrado",
          description:
            "El empleado que intentas editar no existe o fue eliminado.",
          backHref: "/employees",
          backLabel: "Volver al listado",
        }}
        header={editShellHeader}
        className="p-6"
      >
        <></>
      </FormPageShell>
    );
  }

  return (
    <EmployeeFormInner
      key={isEditing ? id : "new"}
      id={id}
      isEditing={isEditing}
      existing={existing}
    />
  );
}
