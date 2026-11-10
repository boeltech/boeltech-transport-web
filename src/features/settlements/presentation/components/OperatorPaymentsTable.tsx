import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Skeleton } from "@shared/ui/skeleton";
import { cn } from "@shared/lib/utils/cn";
import type { OperatorPaymentReadiness } from "../../domain/entities";
import { OperatorPaymentStatusBadge } from "../config/operatorPaymentStatusConfig";
import { settlementsCopy } from "../copy/settlementsCopy";
import {
  formatOperatorAdvancesLabel,
  formatOperatorSalaryLabel,
  formatOperatorTariffLabel,
} from "../utils/operatorPaymentDisplay";

const copy = settlementsCopy.operatorsList;

interface OperatorPaymentsTableProps {
  operators: readonly OperatorPaymentReadiness[];
  isLoading: boolean;
  selectedEmployeeId: string | null;
  onSelect: (row: OperatorPaymentReadiness) => void;
}

export function OperatorPaymentsTable({
  operators,
  isLoading,
  selectedEmployeeId,
  onSelect,
}: OperatorPaymentsTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card" data-testid="operators-table-loading">
        <div className="space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table data-testid="operators-table">
        <TableHeader>
          <TableRow>
            <TableHead>{copy.columns.operator}</TableHead>
            <TableHead>{copy.columns.tariff}</TableHead>
            <TableHead className="text-right">{copy.columns.salary}</TableHead>
            <TableHead className="text-right">{copy.columns.advances}</TableHead>
            <TableHead>{copy.columns.status}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {operators.map((row) => {
            const tariff = formatOperatorTariffLabel(row);
            const salary = formatOperatorSalaryLabel(row);
            const advances = formatOperatorAdvancesLabel(row);
            const selected = row.employeeId === selectedEmployeeId;
            return (
              <TableRow
                key={row.employeeId}
                data-testid={`operators-row-${row.employeeId}`}
                data-selected={selected ? "true" : "false"}
                className={cn(
                  "cursor-pointer",
                  selected && "bg-primary-50",
                )}
                onClick={() => onSelect(row)}
              >
                <TableCell className="whitespace-nowrap font-medium">
                  {row.fullName}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className={cn(tariff.muted && "text-muted-foreground")}>
                      {tariff.title}
                    </span>
                    {tariff.subtitle ? (
                      <span className="text-[11px] text-muted-foreground">
                        {tariff.subtitle}
                      </span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {salary.amount ? (
                    <div className="flex flex-col items-end">
                      <span>{salary.amount}</span>
                      {salary.period ? (
                        <span className="font-sans text-[11px] text-muted-foreground">
                          {salary.period}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">{copy.salaryMissing}</span>
                  )}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-mono tabular-nums",
                    advances === copy.advancesNone && "text-muted-foreground",
                  )}
                >
                  {advances}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <OperatorPaymentStatusBadge status={row.status} size="sm" />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
