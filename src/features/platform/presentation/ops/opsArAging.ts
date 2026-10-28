export interface OpsOpenArAgingInput {
  status: string;
  daysOverdue: number;
  totalCents: number;
}

export interface OpsOpenArAging {
  currentCents: number;
  overdueCents: number;
}

/**
 * Suma cobros abiertos de las filas ya cargadas.
 * Atrasado = `daysOverdue > 0`, la misma regla que la tabla.
 */
export function sumOpenArAging(rows: readonly OpsOpenArAgingInput[]): OpsOpenArAging {
  let currentCents = 0;
  let overdueCents = 0;
  for (const row of rows) {
    if (row.status !== "open") continue;
    if (row.daysOverdue > 0) overdueCents += row.totalCents;
    else currentCents += row.totalCents;
  }
  return { currentCents, overdueCents };
}
