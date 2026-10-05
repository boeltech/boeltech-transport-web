import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { Checkbox } from "@shared/ui/checkbox";
import { FieldInlineError } from "@shared/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { cn } from "@shared/lib/utils/cn";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { ReimbursementRequiringPayeeLine } from "../../domain/entities";
import { settlementsCopy } from "../copy/settlementsCopy";
import { reimbursementTripLine, tripCostsPath } from "../utils/reimbursementLines";

const copy = settlementsCopy.reimbursements;

export const REIMBURSEMENTS_PAYEE_FIELD_ID = "settlement-reimbursements-payee";

export interface ReimbursementsPayeeCardProps {
  lines: readonly ReimbursementRequiringPayeeLine[];
  operatorName: string;
  selectedIds: ReadonlySet<string>;
  onToggle: (tripExpenseId: string, checked: boolean) => void;
  /** Error del API por gasto (`details.trip_expense_id`). */
  rowErrors?: Readonly<Record<string, string>>;
  /** Error de la tarjeta (p. ej. pago de reembolsos sin ningún gasto). */
  error?: string;
  /** Numeración del alta («2.»); sin prefijo en el alta normal. */
  titlePrefix?: string;
  disabled?: boolean;
  tripLinkFrom?: string;
}

/**
 * ADR-0085 E11 punto 8 / D7: gastos de viajes con cambio de conductor. Nunca entran solos;
 * solo los que el usuario marca viajan como `confirmed_reimbursement_expense_ids`.
 */
export function ReimbursementsPayeeCard({
  lines,
  operatorName,
  selectedIds,
  onToggle,
  rowErrors = {},
  error,
  titlePrefix,
  disabled = false,
  tripLinkFrom,
}: ReimbursementsPayeeCardProps) {
  const operator = operatorName.trim() || copy.payeeSection.operatorFallback;
  const title = copy.payeeSection.title(lines.length);
  return (
    <Card className="border-border shadow-xs" data-testid="reimbursements-payee-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0" aria-hidden />
          {titlePrefix ? `${titlePrefix} ${title}` : title}
        </CardTitle>
        <CardDescription>{copy.payeeSection.description(operator)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" />
                <TableHead>{copy.table.trip}</TableHead>
                <TableHead>{copy.table.reason}</TableHead>
                <TableHead>{copy.table.approvedAt}</TableHead>
                <TableHead className="text-right">{copy.table.amount}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => {
                const checkboxId = `reimbursement-payee-${line.tripExpenseId}`;
                const rowError = rowErrors[line.tripExpenseId];
                const isSelected = selectedIds.has(line.tripExpenseId);
                return (
                  <TableRow
                    key={line.tripExpenseId}
                    className={cn(isSelected && "bg-muted/30", rowError && "bg-destructive/5")}
                  >
                    <TableCell className="text-center align-top">
                      <Checkbox
                        id={checkboxId}
                        checked={isSelected}
                        disabled={disabled}
                        aria-label={copy.payeeSection.checkboxLabel(
                          operator,
                          formatMxCurrency(line.amount),
                          line.tripCode,
                        )}
                        aria-invalid={rowError ? true : undefined}
                        aria-describedby={rowError ? `${checkboxId}-error` : undefined}
                        onCheckedChange={(checked) => onToggle(line.tripExpenseId, checked === true)}
                      />
                    </TableCell>
                    <TableCell className="text-xs align-top">
                      <Link
                        to={tripCostsPath(line.tripId)}
                        state={tripLinkFrom ? { from: tripLinkFrom } : undefined}
                        className="font-mono font-semibold text-primary hover:underline"
                      >
                        {line.tripCode}
                      </Link>
                      <span className="block text-[11px] text-muted-foreground mt-0.5">
                        {reimbursementTripLine(line.tripCode, line.tripSettledIn)}
                      </span>
                      <FieldInlineError fieldId={checkboxId} message={rowError} />
                    </TableCell>
                    <TableCell className="text-xs text-foreground align-top">
                      {copy.table.driverReassigned}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground align-top">
                      {line.approvedAt ? formatDate(line.approvedAt) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-xs font-medium tabular-nums align-top">
                      {formatMxCurrency(line.amount)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <p className="text-[11px] text-muted-foreground">{copy.payeeSection.footer}</p>
        <FieldInlineError fieldId={REIMBURSEMENTS_PAYEE_FIELD_ID} message={error} />
      </CardContent>
    </Card>
  );
}
