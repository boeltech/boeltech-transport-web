/**
 * OperatorPaymentsTable — listado Operate (`EntityListTable`).
 *
 * Operador · Tarifa · Sueldo · Anticipos · Estado. Selección puntual
 * (`bg-primary-50`) vía `onRowActivate` + `getRowClassName`. Empty → null.
 * `framed={false}` bajo ListPageShell.
 */

import type { HTMLAttributes } from "react";
import { cn } from "@shared/lib/utils/cn";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListStackedValue,
} from "@shared/ui/table";
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

function buildColumns(): EntityListColumnDef<OperatorPaymentReadiness>[] {
  return [
    {
      id: "operator",
      header: copy.columns.operator,
      kind: "primary",
      accessor: (row) => row.fullName,
    },
    {
      id: "tariff",
      header: copy.columns.tariff,
      kind: "stacked",
      accessor: (row): EntityListStackedValue => {
        const tariff = formatOperatorTariffLabel(row);
        return {
          primary: (
            <span className={cn(tariff.muted && "text-muted-foreground")}>
              {tariff.title}
            </span>
          ),
          secondary: tariff.subtitle,
        };
      },
    },
    {
      id: "salary",
      header: copy.columns.salary,
      kind: "stacked",
      className: "text-right",
      headerClassName: "text-right",
      accessor: (row): EntityListStackedValue => {
        const salary = formatOperatorSalaryLabel(row);
        if (!salary.amount) {
          return {
            primary: (
              <span className="text-muted-foreground">{copy.salaryMissing}</span>
            ),
          };
        }
        return {
          primary: (
            <span className="font-mono tabular-nums">{salary.amount}</span>
          ),
          secondary: salary.period,
        };
      },
    },
    {
      id: "advances",
      header: copy.columns.advances,
      kind: "number",
      accessor: (row) => {
        const advances = formatOperatorAdvancesLabel(row);
        return (
          <span
            className={cn(
              advances === copy.advancesNone && "text-muted-foreground",
            )}
          >
            {advances}
          </span>
        );
      },
    },
    {
      id: "status",
      header: copy.columns.status,
      kind: "status",
      accessor: (row) => (
        <OperatorPaymentStatusBadge status={row.status} size="sm" />
      ),
    },
  ];
}

export function OperatorPaymentsTable({
  operators,
  isLoading,
  selectedEmployeeId,
  onSelect,
}: OperatorPaymentsTableProps) {
  const columns = buildColumns();

  return (
    <div data-testid="operators-table">
      <EntityListTable
        framed={false}
        density="list"
        columns={columns}
        rows={[...operators]}
        getRowId={(row) => row.employeeId}
        isLoading={isLoading}
        onRowActivate={onSelect}
        getRowClassName={(row) =>
          row.employeeId === selectedEmployeeId ? "bg-primary-50" : undefined
        }
        getRowProps={(row) =>
          ({
            "data-testid": `operators-row-${row.employeeId}`,
          }) as HTMLAttributes<HTMLTableRowElement>
        }
      />
      {isLoading ? (
        <span className="sr-only" data-testid="operators-table-loading">
          Cargando
        </span>
      ) : null}
    </div>
  );
}
