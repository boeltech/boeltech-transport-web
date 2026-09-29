import type { SettlementBacklogRow } from "../../domain/entities";

/** Recorta el backlog de Por liquidar por el texto del search (nombre o sucursal). */
export function filterSettlementBacklog(
  rows: readonly SettlementBacklogRow[],
  search: string,
): SettlementBacklogRow[] {
  const query = search.trim().toLowerCase();
  if (!query) return [...rows];

  return rows.filter((row) => {
    if (row.employeeFullName.toLowerCase().includes(query)) return true;
    return (row.branchName ?? "").toLowerCase().includes(query);
  });
}
