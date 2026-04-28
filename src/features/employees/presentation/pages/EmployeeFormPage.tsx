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
import { EmployeeFormInner } from "../components/EmployeeFormInner";
import { useEmployee } from "../../application/hooks/useEmployees";

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-9 w-9 bg-muted rounded-md" />
        <div className="h-7 w-48 bg-muted rounded" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-9 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EmployeeFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const { data: existingData, isLoading: isLoadingEmployee } = useEmployee(
    id!,
    isEditing,
  );
  const existing = existingData?.data;

  // Montar el formulario solo cuando la data de edición ya está lista.
  // Evita carreras de hidratación entre RHF + values + selects controlados.
  if (isEditing && isLoadingEmployee) {
    return <FormSkeleton />;
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
