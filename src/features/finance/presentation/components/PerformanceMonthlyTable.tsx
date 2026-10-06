import {
  computeMarginPct,
  computeVariation,
  type AlignedPerformanceMonth,
} from "@features/finance/application";
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
import { cn } from "@shared/lib/utils/cn";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { financeCopy } from "../copy";
import {
  formatPct,
  formatPerformanceMonthWithStatus,
} from "../utils/monthlyPerformanceFormat";
import { PerformanceVariation } from "./PerformanceVariation";

const copy = financeCopy.performance.table;

interface PerformanceMonthlyTableProps {
  months: AlignedPerformanceMonth[];
  compare: boolean;
}

export function PerformanceMonthlyTable({
  months,
  compare,
}: PerformanceMonthlyTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{copy.month}</TableHead>
                <TableHead className="text-right">{copy.revenue}</TableHead>
                <TableHead className="text-right">{copy.cost}</TableHead>
                <TableHead className="text-right">{copy.margin}</TableHead>
                <TableHead className="text-right">{copy.marginPct}</TableHead>
                <TableHead className="text-right">{copy.trips}</TableHead>
                {compare ? (
                  <>
                    <TableHead className="text-right">{copy.deltaRevenue}</TableHead>
                    <TableHead className="text-right">{copy.deltaCost}</TableHead>
                    <TableHead className="text-right">{copy.deltaMargin}</TableHead>
                  </>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {months.map((month) => {
                const { current, previous } = month;
                return (
                  <TableRow
                    key={month.period}
                    className={cn(month.isInProgress && "bg-muted/40")}
                  >
                    <TableCell className="whitespace-nowrap font-medium">
                      {formatPerformanceMonthWithStatus(month.period, month.isInProgress)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMxCurrency(current.actualRevenue)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMxCurrency(current.actualCost)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums",
                        current.actualMargin < 0 && "text-destructive",
                      )}
                    >
                      {formatMxCurrency(current.actualMargin)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPct(
                        computeMarginPct(current.actualMargin, current.actualRevenue),
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {current.tripCount.toLocaleString("es-MX")}
                    </TableCell>
                    {compare ? (
                      <>
                        <TableCell className="text-right">
                          <PerformanceVariation
                            variation={computeVariation(
                              current.actualRevenue,
                              previous.actualRevenue,
                            )}
                            polarity="higher-is-better"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <PerformanceVariation
                            variation={computeVariation(
                              current.actualCost,
                              previous.actualCost,
                            )}
                            polarity="lower-is-better"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <PerformanceVariation
                            variation={computeVariation(
                              current.actualMargin,
                              previous.actualMargin,
                            )}
                            polarity="higher-is-better"
                          />
                        </TableCell>
                      </>
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
