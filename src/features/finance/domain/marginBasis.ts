/**
 * ADR-0108 — base de margen (legacy trip_expenses vs operacional).
 * `meta.margin_basis` del API gana cuando viene; si no, la UI usa campos
 * `operational_*` cuando existen (consumidor F3 listo).
 */

export type MarginBasis = "trip_expenses" | "operational";

export function parseMarginBasis(raw: unknown): MarginBasis | undefined {
  if (raw === "trip_expenses" || raw === "operational") return raw;
  return undefined;
}

/** Meta explícita gana; si no hay meta y hay métricas operativas mapeadas → operational. */
export function resolveMarginBasis(options: {
  metaBasis?: MarginBasis | null;
  hasOperationalMetrics: boolean;
}): MarginBasis {
  if (options.metaBasis === "trip_expenses" || options.metaBasis === "operational") {
    return options.metaBasis;
  }
  return options.hasOperationalMetrics ? "operational" : "trip_expenses";
}

/**
 * Mes a mes: si algún mes tiene primary ≠ operational_cost, el flag está off
 * (primario = solo gastos de viaje). Si coinciden (o no hay actividad), base operativa.
 */
export function resolveMonthlyMarginBasis(
  rows: ReadonlyArray<{ actualCost: number; operationalCost?: number }>,
  metaBasis?: MarginBasis | null,
): MarginBasis {
  if (metaBasis === "trip_expenses" || metaBasis === "operational") {
    return metaBasis;
  }
  const withOperational = rows.filter((row) => row.operationalCost != null);
  if (withOperational.length === 0) return "trip_expenses";
  const diverges = withOperational.some(
    (row) => Math.abs(row.actualCost - (row.operationalCost ?? 0)) > 0.009,
  );
  return diverges ? "trip_expenses" : "operational";
}

/**
 * Chip «Sin comisión liquidada aún»: viaje completed con gastos aprobados y
 * sin comisión en liquidación approved+ (PRD D-PRD3).
 */
export function shouldShowMissingCommissionChip(trip: {
  tripStatus?: string;
  financialBucket?: string;
  tripCommissionTotal?: number;
  actualTotal: number;
}): boolean {
  const completed =
    trip.tripStatus === "completed" || trip.financialBucket === "realized";
  if (!completed) return false;
  if ((trip.tripCommissionTotal ?? 0) !== 0) return false;
  return trip.actualTotal > 0;
}
