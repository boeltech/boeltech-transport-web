import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Card, CardContent, CardHeader } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Skeleton } from "@shared/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@shared/ui/tooltip";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { usePermissions } from "@shared/permissions";
import type { SettlementBacklogRow } from "../../domain/entities";
import { settlementCreatePath } from "../../application/settlementsRoutes";
import { settlementsCopy } from "../copy/settlementsCopy";
import { resolveBacklogPeriodTooltip } from "../utils/backlogPeriodTooltip";

const copy = settlementsCopy.workbench;
const fieldsCopy = settlementsCopy.fields;

interface SettlementBacklogTableProps {
  rows: readonly SettlementBacklogRow[];
  isLoading: boolean;
  apiUnavailable?: boolean;
  viewMode: "table" | "cards";
  onNavigateCreate: (path: string) => void;
}

function RowTypeBadge({ row }: { row: SettlementBacklogRow }) {
  if (row.rowType === "salary_close") {
    return (
      <Badge variant="info" tone="soft" className="text-xs">
        {copy.backlog.rowTypes.salary_close}
      </Badge>
    );
  }
  if (row.rowType === "mixed") {
    return (
      <Badge variant="warning" tone="soft" className="text-xs">
        {copy.backlog.rowTypes.mixed}
      </Badge>
    );
  }
  return (
    <Badge variant="neutral" tone="soft" className="text-xs">
      {copy.backlog.rowTypes.trips_pending(row.pendingTripsCount)}
    </Badge>
  );
}

function PeriodWarnings({ warnings }: { warnings: readonly string[] }) {
  if (warnings.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-1.5">
      {warnings.map((warning) => {
        const label =
          copy.warnings[warning as keyof typeof copy.warnings] ?? warning;
        return (
          <li key={warning}>
            <Badge variant="warning" tone="soft" className="text-xs font-medium">
              {label}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}

const TABLE_HEADERS = [
  {
    key: "employee",
    label: fieldsCopy.employee,
    className: "min-w-[220px]",
  },
  {
    key: "estimatedAmount",
    label: fieldsCopy.estimatedAmount,
    className: "min-w-[140px] text-right",
  },
  {
    key: "period",
    label: fieldsCopy.period,
    className: "min-w-[220px]",
  },
  {
    key: "pendingConcept",
    label: fieldsCopy.pendingConcept,
    className: "min-w-[170px]",
  },
  {
    key: "action",
    label: fieldsCopy.action,
    className: "min-w-[150px] text-right",
  },
] as const;

function LoadingSkeleton() {
  return (
    <TableBody>
      {Array.from({ length: 4 }).map((_, index) => (
        <TableRow key={index}>
          {Array.from({ length: TABLE_HEADERS.length }).map((__, cellIndex) => (
            <TableCell key={cellIndex}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}

export function SettlementBacklogTable({
  rows,
  isLoading,
  apiUnavailable = false,
  viewMode,
  onNavigateCreate,
}: SettlementBacklogTableProps) {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("settlements", "create");

  if (viewMode === "cards") {
    if (isLoading) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="shadow-sm">
              <CardHeader className="pb-2 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-24" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (rows.length === 0) {
      return (
        <div className="rounded-md border bg-card p-8 text-center space-y-3">
          <p className="text-base font-semibold text-foreground">
            {apiUnavailable
              ? copy.empty.backlogApiPendingTitle
              : copy.empty.backlogTitle}
          </p>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            {apiUnavailable
              ? copy.empty.backlogApiPendingDescription
              : copy.empty.backlogDescription}
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => {
          const createPath = settlementCreatePath({
            employeeId: row.employeeId,
            periodStart: row.periodStart,
            periodEnd: row.periodEnd,
          });

          return (
            <Card
              key={`${row.employeeId}-${row.periodStart}-${row.periodEnd}`}
              className="shadow-sm"
            >
              <CardHeader className="pb-2 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {row.employeeFullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {copy.buckets.pending}
                    </p>
                  </div>
                  <RowTypeBadge row={row} />
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="rounded-md bg-primary/5 p-2.5 flex justify-between items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">
                    {fieldsCopy.estimatedAmount}
                  </span>
                  <span className="text-base font-extrabold tabular-nums text-primary">
                    {row.estimatedNetAmount != null
                      ? formatMxCurrency(row.estimatedNetAmount)
                      : copy.backlog.estimatedAmountMissing}
                  </span>
                </div>

                <div className="space-y-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex cursor-help whitespace-nowrap border-b border-dotted border-muted-foreground/50 text-sm text-foreground">
                        {formatDate(row.periodStart)} – {formatDate(row.periodEnd)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">
                      {resolveBacklogPeriodTooltip(row.rowType)}
                    </TooltipContent>
                  </Tooltip>
                  <PeriodWarnings warnings={row.warnings} />
                </div>

                <div className="pt-1">
                  {canCreate ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => onNavigateCreate(createPath)}
                    >
                      {copy.actions.settlePeriod}
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Solo lectura
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table aria-label={copy.backlog.tableAriaLabel}>
          <TableHeader>
            <TableRow>
              {TABLE_HEADERS.map((header) => (
                <TableHead key={header.key} className={header.className}>
                  {header.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <LoadingSkeleton />
        </Table>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-md border bg-card p-8 text-center space-y-3">
        <p className="text-base font-semibold text-foreground">
          {apiUnavailable
            ? copy.empty.backlogApiPendingTitle
            : copy.empty.backlogTitle}
        </p>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          {apiUnavailable
            ? copy.empty.backlogApiPendingDescription
            : copy.empty.backlogDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card overflow-x-auto">
      <Table aria-label={copy.backlog.tableAriaLabel}>
        <TableHeader>
          <TableRow>
            {TABLE_HEADERS.map((header) => (
              <TableHead key={header.key} className={header.className}>
                {header.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const createPath = settlementCreatePath({
              employeeId: row.employeeId,
              periodStart: row.periodStart,
              periodEnd: row.periodEnd,
            });

            return (
              <TableRow
                key={`${row.employeeId}-${row.periodStart}-${row.periodEnd}`}
                className="hover:bg-muted/40"
              >
                <TableCell className="min-w-[220px] py-3">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground whitespace-nowrap">
                      {row.employeeFullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {copy.buckets.pending}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="min-w-[140px] py-3 text-right">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {fieldsCopy.estimatedAmount}
                    </p>
                    <p className="tabular-nums text-base font-bold text-primary whitespace-nowrap">
                      {row.estimatedNetAmount != null
                        ? formatMxCurrency(row.estimatedNetAmount)
                        : copy.backlog.estimatedAmountMissing}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="min-w-[220px] py-3">
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        {fieldsCopy.period}
                      </p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex cursor-help whitespace-nowrap border-b border-dotted border-muted-foreground/50 text-sm text-foreground">
                            {formatDate(row.periodStart)} – {formatDate(row.periodEnd)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs">
                          {resolveBacklogPeriodTooltip(row.rowType)}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <PeriodWarnings warnings={row.warnings} />
                  </div>
                </TableCell>
                <TableCell className="min-w-[170px] py-3">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      {fieldsCopy.pendingConcept}
                    </p>
                    <RowTypeBadge row={row} />
                  </div>
                </TableCell>
                <TableCell className="min-w-[150px] py-3 text-right">
                  {canCreate ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigateCreate(createPath)}
                    >
                      {copy.actions.settlePeriod}
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Solo lectura</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
