import type { ManualSettlementItemType } from "../../domain/settlementTotals";

/** Fila del editor; `key` solo identifica la fila en React (el schema la descarta). */
export interface ManualItemRow {
  key: string;
  itemType: ManualSettlementItemType;
  description: string;
  amount?: number;
  isDeduction?: boolean;
  tripId?: string | null;
}

export type ManualItemRowErrors = Partial<
  Record<"itemType" | "description" | "amount" | "isDeduction" | "tripId", string>
>;

let rowSeq = 0;

export function newManualItemRow(
  partial: Partial<Omit<ManualItemRow, "key">> = {},
): ManualItemRow {
  rowSeq += 1;
  return {
    key: `manual-item-${rowSeq}`,
    itemType: partial.itemType ?? "bonus",
    description: partial.description ?? "",
    amount: partial.amount,
    isDeduction: partial.isDeduction,
    tripId: partial.tripId ?? null,
  };
}

/** Partidas ya guardadas → filas del editor. */
export function toManualItemRows(
  items: ReadonlyArray<Partial<Omit<ManualItemRow, "key">>>,
): ManualItemRow[] {
  return items.map((item) => newManualItemRow(item));
}

/** Errores de Zod (`customItems.{i}.{campo}`) → errores por fila del editor. */
export function manualItemErrorsFromIssues(
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>,
  pathPrefix: ReadonlyArray<PropertyKey> = [],
): ManualItemRowErrors[] {
  const rows: ManualItemRowErrors[] = [];
  for (const issue of issues) {
    const path = issue.path.slice(pathPrefix.length);
    if (!pathPrefix.every((segment, i) => issue.path[i] === segment)) continue;
    const [index, field] = path;
    if (typeof index !== "number" || typeof field !== "string") continue;
    const row = (rows[index] ??= {});
    const key = field as keyof ManualItemRowErrors;
    if (!row[key]) row[key] = issue.message;
  }
  return rows;
}
