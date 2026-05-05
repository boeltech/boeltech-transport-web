/**
 * Employee dynamic-like catalogs (frontend controlled, phase 1).
 *
 * NOTE:
 * - These options are intentionally local for compatibility rollout.
 * - In phase 2 they should be replaced by tenant-managed catalogs.
 */

export interface EmployeeCatalogOption {
  value: string;
  label: string;
}

export const DEPARTMENT_OPTIONS: EmployeeCatalogOption[] = [
  { value: "Operaciones", label: "Operaciones" },
  { value: "Logistica", label: "Logistica" },
  { value: "Trafico", label: "Trafico" },
  { value: "Mantenimiento", label: "Mantenimiento" },
  { value: "Administracion", label: "Administracion" },
  { value: "Finanzas", label: "Finanzas" },
  { value: "Recursos Humanos", label: "Recursos Humanos" },
  { value: "Seguridad", label: "Seguridad" },
];

export const POSITION_OPTIONS: EmployeeCatalogOption[] = [
  { value: "Conductor", label: "Conductor" },
  { value: "Despachador", label: "Despachador" },
  { value: "Ayudante general", label: "Ayudante general" },
  { value: "Auxiliar de trafico", label: "Auxiliar de trafico" },
  { value: "Coordinador de logistica", label: "Coordinador de logistica" },
  { value: "Supervisor operativo", label: "Supervisor operativo" },
  { value: "Mecanico", label: "Mecanico" },
  { value: "Auxiliar administrativo", label: "Auxiliar administrativo" },
];

export const WORK_LOCATION_OPTIONS: EmployeeCatalogOption[] = [
  { value: "Matriz", label: "Matriz" },
  { value: "Patio Norte", label: "Patio Norte" },
  { value: "Patio Sur", label: "Patio Sur" },
  { value: "Taller", label: "Taller" },
  { value: "Remoto", label: "Remoto" },
];

export const EMERGENCY_RELATIONSHIP_OPTIONS: EmployeeCatalogOption[] = [
  { value: "Conyuge", label: "Conyuge" },
  { value: "Madre", label: "Madre" },
  { value: "Padre", label: "Padre" },
  { value: "Hermano(a)", label: "Hermano(a)" },
  { value: "Hijo(a)", label: "Hijo(a)" },
  { value: "Familiar", label: "Familiar" },
  { value: "Amigo(a)", label: "Amigo(a)" },
  { value: "Tutor", label: "Tutor" },
];

