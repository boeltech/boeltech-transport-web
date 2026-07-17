import type { BranchListItem } from "../../domain";
import { BRANCH_STATUS_LABELS } from "../../domain";

export function getBranchExportHeaders(): string[] {
  return [
    "Código",
    "Nombre",
    "Estado",
    "Principal",
    "Ciudad",
    "Estado (domicilio)",
    "Teléfono",
    "Fecha de alta",
  ];
}

export function mapBranchesToCsvRows(
  branches: BranchListItem[],
): Array<Array<string | number | null | undefined>> {
  return branches.map((branch) => [
    branch.code,
    branch.name,
    BRANCH_STATUS_LABELS[branch.status],
    branch.isMain ? "Sí" : "No",
    branch.city || "",
    branch.state || "",
    branch.phone ?? "",
    branch.createdAt.toISOString(),
  ]);
}
