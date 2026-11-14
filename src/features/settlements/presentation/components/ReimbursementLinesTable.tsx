/**
 * ReimbursementLinesTable — reembolsos embebidos (`EntityListTable`).
 *
 * Viaje · Concepto · Aprobado · Monto. density compact · framed false (borde host).
 * Empty → null (host). Footer opcional con total.
 */

import { Link } from "react-router-dom";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListStackedValue,
} from "@shared/ui/table";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { TripSettledInRef } from "../../domain/entities";
import { roundCents } from "../../domain/settlementTotals";
import { settlementsCopy } from "../copy/settlementsCopy";
import {
  reimbursementConcept,
  reimbursementTripLine,
  tripCostsPath,
} from "../utils/reimbursementLines";

const copy = settlementsCopy.reimbursements.table;

export interface ReimbursementTableLine {
  readonly tripExpenseId: string;
  readonly tripId: string;
  readonly tripCode: string;
  readonly category?: string | null;
  readonly description: string;
  readonly amount: number;
  readonly approvedAt: string | null;
  readonly tripSettledIn?: TripSettledInRef | null;
}

export interface ReimbursementLinesTableProps {
  lines: readonly ReimbursementTableLine[];
  ariaLabel: string;
  /** D11: segunda línea «Viaje … · comisión en …» bajo el código. */
  showTripLine?: boolean;
  showTotal?: boolean;
  /** `state.from` del enlace a Costos del viaje. */
  tripLinkFrom?: string;
}

function buildColumns(
  showTripLine: boolean,
  tripLinkFrom?: string,
): EntityListColumnDef<ReimbursementTableLine>[] {
  return [
    {
      id: "trip",
      header: copy.trip,
      kind: "stacked",
      accessor: (line): EntityListStackedValue => ({
        primary: (
          <Link
            to={tripCostsPath(line.tripId)}
            state={tripLinkFrom ? { from: tripLinkFrom } : undefined}
            className="font-mono font-semibold text-primary hover:underline"
          >
            {line.tripCode}
          </Link>
        ),
        secondary: showTripLine
          ? reimbursementTripLine(line.tripCode, line.tripSettledIn ?? null)
          : undefined,
      }),
    },
    {
      id: "concept",
      header: copy.concept,
      kind: "text",
      accessor: (line) =>
        reimbursementConcept(line.category, line.description),
    },
    {
      id: "approvedAt",
      header: copy.approvedAt,
      kind: "date",
      accessor: (line) => line.approvedAt,
    },
    {
      id: "amount",
      header: copy.amount,
      kind: "money",
      accessor: (line) => line.amount,
    },
  ];
}

/** Reembolsos de solo lectura: viaje (enlace a Costos), concepto, aprobado el y monto. */
export function ReimbursementLinesTable({
  lines,
  ariaLabel,
  showTripLine = true,
  showTotal = false,
  tripLinkFrom,
}: ReimbursementLinesTableProps) {
  if (lines.length === 0) return null;

  const total = roundCents(lines.reduce((sum, line) => sum + line.amount, 0));

  return (
    <div className="rounded-md border overflow-x-auto">
      <EntityListTable
        framed={false}
        density="compact"
        columns={buildColumns(showTripLine, tripLinkFrom)}
        rows={[...lines]}
        getRowId={(row) => row.tripExpenseId}
        aria-label={ariaLabel}
        footer={
          showTotal ? (
            <div className="flex justify-between gap-4 font-semibold text-xs">
              <span>{copy.total}</span>
              <span className="tabular-nums font-mono">
                {formatMxCurrency(total)}
              </span>
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
