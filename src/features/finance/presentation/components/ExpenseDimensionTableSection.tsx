/**
 * ExpenseDimensionTableSection — gastos por dimensión (`EntityListTable`).
 *
 * Dimensión · Viajes · Total · Promedio/viaje. density compact · framed false (borde en Card).
 * Empty = EmptyState de la sección (no duplicar).
 */

import { Receipt } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@shared/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import {
  EntityListTable,
  type EntityListColumnDef,
} from "@shared/ui/table";
import { EmptyState } from "@shared/ui/feedback-states";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import type { ExpensesByDimensionItem } from "@features/finance/domain";
import { financeCopy } from "../copy";

type ExpenseDimension = "vehicle" | "driver" | "client" | "route";

interface ExpenseDimensionTableSectionProps {
  dimension: ExpenseDimension;
  onDimensionChange: (value: ExpenseDimension) => void;
  rows: ExpensesByDimensionItem[];
  isLoading?: boolean;
}

/** UUID v1–v5 shape; non-UUID keys (route labels, `unassigned`) stay plain text. */
const ENTITY_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isEntityUuid(key: string): boolean {
  return ENTITY_UUID_RE.test(key);
}

type DrillTarget = {
  to: string;
  ariaLabel: string;
};

function drillTargetForRow(
  dimension: ExpenseDimension,
  item: ExpensesByDimensionItem,
): DrillTarget | null {
  if (!isEntityUuid(item.key)) return null;
  if (dimension === "vehicle") {
    return {
      to: `/vehicles/${item.key}`,
      ariaLabel: financeCopy.expenses.table.viewVehicle(item.label),
    };
  }
  if (dimension === "driver") {
    return {
      to: `/drivers/${item.key}`,
      ariaLabel: financeCopy.expenses.table.viewDriver(item.label),
    };
  }
  if (dimension === "client") {
    return {
      to: `/clients/${item.key}`,
      ariaLabel: financeCopy.expenses.table.viewClient(item.label),
    };
  }
  return null;
}

function buildColumns(
  dimension: ExpenseDimension,
  dimensionLabel: string,
): EntityListColumnDef<ExpensesByDimensionItem>[] {
  return [
    {
      id: "dimension",
      header: dimensionLabel,
      kind: "text",
      className: "font-medium",
      accessor: (item) => {
        const drill = drillTargetForRow(dimension, item);
        if (drill) {
          return (
            <Link
              to={drill.to}
              className="text-primary underline-offset-4 hover:underline"
              aria-label={drill.ariaLabel}
            >
              {item.label}
            </Link>
          );
        }
        return item.label;
      },
    },
    {
      id: "trips",
      header: financeCopy.expenses.table.dimensionTripCount,
      kind: "number",
      accessor: (item) => item.tripCount,
    },
    {
      id: "total",
      header: financeCopy.expenses.table.totalExpense,
      kind: "money",
      accessor: (item) => item.totalExpenses,
    },
    {
      id: "avg",
      header: financeCopy.expenses.table.avgExpensePerTrip,
      kind: "money",
      accessor: (item) => item.avgExpensePerTrip,
    },
  ];
}

export function ExpenseDimensionTableSection({
  dimension,
  onDimensionChange,
  rows,
  isLoading = false,
}: ExpenseDimensionTableSectionProps) {
  const dimensionLabel =
    financeCopy.expenses.table.dimensionColumn[dimension];

  const dimensionFilter = (
    <Select
      value={dimension}
      onValueChange={(value) => onDimensionChange(value as ExpenseDimension)}
    >
      <SelectTrigger className="w-[160px]" aria-label={financeCopy.expenses.filters.dimension}>
        <SelectValue placeholder={financeCopy.expenses.filters.dimension} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="vehicle">
          {financeCopy.expenses.filters.dimensionValues.vehicle}
        </SelectItem>
        <SelectItem value="driver">
          {financeCopy.expenses.filters.dimensionValues.driver}
        </SelectItem>
        <SelectItem value="client">
          {financeCopy.expenses.filters.dimensionValues.client}
        </SelectItem>
        <SelectItem value="route">
          {financeCopy.expenses.filters.dimensionValues.route}
        </SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>{financeCopy.expenses.table.title}</CardTitle>
          <CardDescription>{financeCopy.expenses.table.description}</CardDescription>
        </div>
        {dimensionFilter}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Receipt className="h-10 w-10 text-muted-foreground" />}
            title={financeCopy.expenses.empty.title}
            description={financeCopy.expenses.empty.description}
          />
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <EntityListTable
              framed={false}
              density="compact"
              columns={buildColumns(dimension, dimensionLabel)}
              rows={rows}
              getRowId={(row) => `${dimension}-${row.key}`}
              getRowClassName={(row) =>
                rows[0]?.key === row.key ? "bg-primary/5" : undefined
              }
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
