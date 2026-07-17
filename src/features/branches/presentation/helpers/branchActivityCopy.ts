import { BRANCH_STATUS_LABELS, type BranchStatusType } from "../../domain";

export function formatBranchActivityAction(action: string): string {
  switch (action) {
    case "branch_created":
      return "Sucursal creada";
    case "branch_updated":
      return "Sucursal actualizada";
    case "branch_deleted":
      return "Sucursal eliminada";
    case "branch_restored":
      return "Sucursal restaurada";
    default:
      return action;
  }
}

function statusLabel(value: unknown): string {
  if (typeof value !== "string") return String(value ?? "—");
  return BRANCH_STATUS_LABELS[value as BranchStatusType] ?? value;
}

const FIELD_LABELS: Record<string, string> = {
  name: "Nombre",
  code: "Código",
  status: "Estatus",
  is_main: "Tipo",
  phone: "Teléfono",
  email: "Correo",
  manager_name: "Responsable",
  notes: "Notas",
  address: "Dirección",
  metadata: "Datos generales",
};

export function summarizeBranchActivityPayload(
  action: string,
  payload: Record<string, unknown>,
): string {
  const parts: string[] = [];

  if (typeof payload.code === "string" && payload.code.trim()) {
    parts.push(`Código: ${payload.code}`);
  }
  if (typeof payload.name === "string" && payload.name.trim()) {
    parts.push(`Nombre: ${payload.name}`);
  }
  if (payload.status !== undefined) {
    parts.push(`Estatus: ${statusLabel(payload.status)}`);
  }
  if (payload.is_main === true) {
    parts.push("Tipo: Principal");
  } else if (payload.is_main === false && action === "branch_updated") {
    parts.push("Tipo: Secundaria");
  }

  const fields = Array.isArray(payload.fields)
    ? payload.fields.filter((field): field is string => typeof field === "string")
    : [];
  if (fields.length > 0 && action === "branch_updated") {
    const labels = fields
      .map((field) => FIELD_LABELS[field] ?? field)
      .filter(Boolean);
    if (labels.length > 0) {
      parts.push(`Campos: ${labels.join(", ")}`);
    }
  }

  if (payload.synthetic === true) {
    return parts.join(" · ");
  }

  if (action === "branch_deleted" || action === "branch_restored") {
    return parts.join(" · ");
  }

  return parts.join(" · ");
}
