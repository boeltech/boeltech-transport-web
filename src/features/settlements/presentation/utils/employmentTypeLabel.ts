/** Etiquetas humanas del tipo de empleado (C14). Alineado a employees. */
const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  permanent: "Planta",
  temporary: "Eventual",
  contractor: "Contratista",
  employee: "Planta",
};

export function employmentTypeLabel(raw: string | null | undefined): string {
  if (!raw) return "";
  return EMPLOYMENT_TYPE_LABELS[raw] ?? raw;
}
