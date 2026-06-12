import { Receipt } from "lucide-react";
import { Skeleton } from "@shared/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { EmptyState } from "@shared/ui/feedback-states";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { ExpensesByDimensionItem } from "@features/finance/domain";
import { financeCopy } from "../copy";

type ExpenseDimension = "vehicle" | "driver" | "client" | "route";

interface ExpenseDimensionTableSectionProps {
  dimension: ExpenseDimension;
  onDimensionChange: (value: ExpenseDimension) => void;
  rows: ExpensesByDimensionItem[];
  isLoading?: boolean;
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
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dimensionLabel}</TableHead>
                  <TableHead className="text-right">
                    {financeCopy.expenses.table.dimensionTripCount}
                  </TableHead>
                  <TableHead className="text-right">
                    {financeCopy.expenses.table.totalExpense}
                  </TableHead>
                  <TableHead className="text-right">
                    {financeCopy.expenses.table.avgExpensePerTrip}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((item) => (
                  <TableRow key={`${dimension}-${item.key}`}>
                    <TableCell className="font-medium">{item.label}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.tripCount}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMxCurrency(item.totalExpenses)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMxCurrency(item.avgExpensePerTrip)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
