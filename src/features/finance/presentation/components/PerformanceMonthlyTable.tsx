import { Link } from "react-router-dom";
import {
  buildFinanceMarginMonthHref,
  computeMarginPct,
  computeVariation,
  type AlignedPerformanceMonth,
} from "@features/finance/application";
import { Badge } from "@shared/ui/badge";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@shared/ui/tooltip";
import { cn } from "@shared/lib/utils/cn";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { financeCopy } from "../copy";
import {
  formatPct,
  formatPerformanceMonth,
  formatPerformanceMonthWithStatus,
} from "../utils/monthlyPerformanceFormat";
import { PerformanceVariation } from "./PerformanceVariation";

const copy = financeCopy.performance.table;
const provisionalCopy = financeCopy.performance.provisional;

interface PerformanceMonthlyTableProps {
  months: AlignedPerformanceMonth[];
  compare: boolean;
  /** ADR-0108 — columna Costo de personal aparte. */
  showPersonnelColumn?: boolean;
}

function ProvisionalMonthChip({ monthLabel }: { monthLabel: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1.5">
          <Badge
            variant="warning"
            tone="soft"
            className="text-xs font-normal"
            aria-label={provisionalCopy.ariaLabel}
          >
            {provisionalCopy.chip}
          </Badge>
          <span className="text-xs text-warning">{provisionalCopy.hint}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        {provisionalCopy.chipTooltip(monthLabel)}
      </TooltipContent>
    </Tooltip>
  );
}

export function PerformanceMonthlyTable({
  months,
  compare,
  showPersonnelColumn = false,
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
                {showPersonnelColumn ? (
                  <TableHead className="text-right">{copy.personnelCost}</TableHead>
                ) : null}
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
                const showProvisionalChip =
                  current.provisional && !month.isInProgress;
                const monthLabel = formatPerformanceMonth(month.period);
                const countsLine = showProvisionalChip
                  ? provisionalCopy.countsLine(
                      current.incompleteTripCount,
                      current.tripsWithPendingExpenses,
                    )
                  : "";

                return (
                  <TableRow
                    key={month.period}
                    className={cn(month.isInProgress && "bg-muted/40")}
                  >
                    <TableCell className="whitespace-nowrap font-medium">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <Link
                            to={buildFinanceMarginMonthHref(month.period)}
                            className="text-primary underline-offset-4 hover:underline"
                            aria-label={copy.openMonthAria(
                              formatPerformanceMonthWithStatus(
                                month.period,
                                month.isInProgress,
                              ),
                            )}
                          >
                            {formatPerformanceMonthWithStatus(
                              month.period,
                              month.isInProgress,
                            )}
                          </Link>
                          {showProvisionalChip ? (
                            <ProvisionalMonthChip monthLabel={monthLabel} />
                          ) : null}
                        </div>
                        {countsLine ? (
                          <p className="text-xs font-normal text-muted-foreground">
                            {countsLine}
                          </p>
                        ) : null}
                      </div>
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
                    {showPersonnelColumn ? (
                      <TableCell className="text-right tabular-nums">
                        {formatMxCurrency(current.periodPersonnelCost ?? 0)}
                      </TableCell>
                    ) : null}
                    <TableCell className="text-right tabular-nums">
                      {current.tripCount.toLocaleString("es-MX")}
                    </TableCell>
                    {compare && month.isInProgress ? (
                      <TableCell
                        colSpan={3}
                        className="text-center text-xs text-muted-foreground"
                      >
                        {copy.inProgressComparison}
                      </TableCell>
                    ) : compare ? (
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
