import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { formatDate } from "@shared/utils/dateUtils";
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

/** Reembolsos de solo lectura: viaje (enlace a Costos), concepto, aprobado el y monto. */
export function ReimbursementLinesTable({
  lines,
  ariaLabel,
  showTripLine = true,
  showTotal = false,
  tripLinkFrom,
}: ReimbursementLinesTableProps) {
  const total = roundCents(lines.reduce((sum, line) => sum + line.amount, 0));
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table aria-label={ariaLabel}>
        <TableHeader>
          <TableRow>
            <TableHead>{copy.trip}</TableHead>
            <TableHead>{copy.concept}</TableHead>
            <TableHead>{copy.approvedAt}</TableHead>
            <TableHead className="text-right">{copy.amount}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => (
            <TableRow key={line.tripExpenseId}>
              <TableCell className="text-xs">
                <Link
                  to={tripCostsPath(line.tripId)}
                  state={tripLinkFrom ? { from: tripLinkFrom } : undefined}
                  className="font-mono font-semibold text-primary hover:underline"
                >
                  {line.tripCode}
                </Link>
                {showTripLine ? (
                  <span className="block text-[11px] text-muted-foreground mt-0.5">
                    {reimbursementTripLine(line.tripCode, line.tripSettledIn ?? null)}
                  </span>
                ) : null}
              </TableCell>
              <TableCell className="text-xs text-foreground">
                {reimbursementConcept(line.category, line.description)}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {line.approvedAt ? formatDate(line.approvedAt) : "—"}
              </TableCell>
              <TableCell className="text-right text-xs font-medium tabular-nums">
                {formatMxCurrency(line.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        {showTotal ? (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="text-xs font-semibold">
                {copy.total}
              </TableCell>
              <TableCell className="text-right text-xs font-semibold tabular-nums">
                {formatMxCurrency(total)}
              </TableCell>
            </TableRow>
          </TableFooter>
        ) : null}
      </Table>
    </div>
  );
}
