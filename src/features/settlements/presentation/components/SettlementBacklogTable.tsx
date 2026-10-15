import { Link } from "react-router-dom";
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
import { cn } from "@shared/lib/utils/cn";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { usePermissions } from "@shared/permissions";
import type { SettlementBacklogRow } from "../../domain/entities";
import { settlementsCopy } from "../copy/settlementsCopy";
import { resolveBacklogPeriodTooltip } from "../utils/backlogPeriodTooltip";
import {
  formatPeriodOverlapFolioLabel,
  resolveBacklogCreatePath,
  resolvePeriodOverlapCtaPath,
  resolvePeriodOverlapTooltip,
  resolvePeriodOverlapWarningCopy,
} from "../utils/backlogPeriodOverlap";
import { resolveTemplateChangeTooltip } from "../utils/templateChangeNotice";
import { resolveTemplateSupersededText } from "../utils/templateSupersededNotice";

const copy = settlementsCopy.workbench;
const fieldsCopy = settlementsCopy.fields;
const reimbursementCopy = settlementsCopy.reimbursements;

interface SettlementBacklogTableProps {
  rows: readonly SettlementBacklogRow[];
  isLoading: boolean;
  viewMode: "table" | "cards";
  onNavigateCreate: (path: string) => void;
  /** Misma cola que Armar pago / Ver detalle (`state.from`). */
  fromState?: { from: string };
}

function RowTypeBadge({ row }: { row: SettlementBacklogRow }) {
  if (row.rowType === "reimbursement_only") {
    return (
      <Badge variant="info" tone="soft" className="text-xs">
        {reimbursementCopy.backlog.rowType}
      </Badge>
    );
  }
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

/** D10: un pago de reembolsos no lleva período. */
function BacklogPeriod({ row }: { row: SettlementBacklogRow }) {
  const notApplicable = row.rowType === "reimbursement_only";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex cursor-help whitespace-nowrap border-b border-dotted border-muted-foreground/50 text-sm",
            notApplicable ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {notApplicable
            ? reimbursementCopy.backlog.periodNotApplicable
            : `${formatDate(row.periodStart)} – ${formatDate(row.periodEnd)}`}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        {resolveBacklogPeriodTooltip(row.rowType)}
      </TooltipContent>
    </Tooltip>
  );
}

function backlogCtaLabel(row: SettlementBacklogRow): string {
  return row.rowType === "reimbursement_only"
    ? reimbursementCopy.createAction
    : copy.actions.settlePeriod;
}

/**
 * UI ignores no_client_invoice (D5/D8): payload may still include the code.
 * Los tardíos entran solos al siguiente pago (E11-F3 B.4): sin insignia propia.
 */
const IGNORED_BACKLOG_WARNINGS = new Set(["no_client_invoice", "late_reimbursement"]);

/** D10: folio de solape → gasto por definir → anticipo; el resto después. */
const WARNING_ORDER = [
  "period_overlap",
  "template_change_in_period",
  "template_version_superseded",
  "reimbursement_payee_required",
  "open_advance",
];

function warningRank(warning: string): number {
  const index = WARNING_ORDER.indexOf(warning);
  return index === -1 ? WARNING_ORDER.length : index;
}

/** Un código sin copy no se pinta: el API puede adelantarse a la web. */
function genericWarningLabel(warning: string): string | null {
  const label: unknown = copy.warnings[warning as keyof typeof copy.warnings];
  return typeof label === "string" ? label : null;
}

const WARNINGS_WITH_OWN_BADGE = new Set([
  "period_overlap",
  "reimbursement_payee_required",
  "template_change_in_period",
  "template_version_superseded",
]);

function PeriodWarnings({
  row,
  fromState,
}: {
  row: SettlementBacklogRow;
  fromState?: { from: string };
}) {
  const { warnings, employeeId, periodOverlap } = row;
  const visible = warnings
    .filter((w) => !IGNORED_BACKLOG_WARNINGS.has(w))
    .filter((w) => WARNINGS_WITH_OWN_BADGE.has(w) || genericWarningLabel(w) !== null)
    .sort((a, b) => warningRank(a) - warningRank(b));
  if (visible.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-1.5">
      {visible.map((warning) => {
        if (warning === "reimbursement_payee_required") {
          return (
            <li key={warning}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="inline-flex cursor-help rounded-md">
                    <Badge
                      variant="warning"
                      tone="soft"
                      className="text-xs font-medium"
                      data-testid="backlog-payee-required-badge"
                    >
                      {reimbursementCopy.backlog.payeeRequiredBadge(
                        row.reimbursementsRequiringPayeeCount ?? 0,
                      )}
                    </Badge>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  {reimbursementCopy.backlog.payeeRequiredTooltip}
                </TooltipContent>
              </Tooltip>
            </li>
          );
        }
        if (warning === "period_overlap") {
          const overlapHref = resolvePeriodOverlapCtaPath(
            employeeId,
            periodOverlap,
          );
          const overlapCopy = resolvePeriodOverlapWarningCopy(
            periodOverlap?.status,
          );
          return (
            <li key={warning} className="flex flex-wrap items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to={overlapHref}
                    state={fromState}
                    className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={copy.warnings.period_overlap_cta}
                  >
                    <Badge
                      variant="warning"
                      tone="soft"
                      className="text-xs font-medium"
                    >
                      {formatPeriodOverlapFolioLabel(periodOverlap) ?? overlapCopy.badge}
                    </Badge>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  {resolvePeriodOverlapTooltip(row)}
                </TooltipContent>
              </Tooltip>
            </li>
          );
        }

        if (warning === "template_change_in_period") {
          const badge = (
            <Badge
              variant="warning"
              tone="soft"
              className="text-xs font-medium"
              data-testid="backlog-template-change-badge"
            >
              {copy.warnings.template_change_in_period}
            </Badge>
          );
          if (!row.templateChange) {
            return <li key={warning}>{badge}</li>;
          }
          return (
            <li key={warning}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="inline-flex cursor-help rounded-md">
                    {badge}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  {resolveTemplateChangeTooltip(
                    row.templateChange,
                    row.pendingTripsCount > 0,
                  )}
                </TooltipContent>
              </Tooltip>
            </li>
          );
        }

        if (warning === "template_version_superseded") {
          const badge = (
            <Badge
              variant="warning"
              tone="soft"
              className="text-xs font-medium"
              data-testid="backlog-template-superseded-badge"
            >
              {copy.warnings.template_version_superseded}
            </Badge>
          );
          if (!row.templateSuperseded) {
            return <li key={warning}>{badge}</li>;
          }
          return (
            <li key={warning}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="inline-flex cursor-help rounded-md">
                    {badge}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  {resolveTemplateSupersededText(row.templateSuperseded)}
                </TooltipContent>
              </Tooltip>
            </li>
          );
        }

        return (
          <li key={warning}>
            <Badge variant="warning" tone="soft" className="text-xs font-medium">
              {genericWarningLabel(warning)}
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
  viewMode,
  onNavigateCreate,
  fromState,
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

    // Empty lo resuelve SettlementsListPage (EmptyState XOR checklist/bridge).
    if (rows.length === 0) return null;

    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => {
          const createPath = resolveBacklogCreatePath(row);

          return (
            <Card
              key={`${row.employeeId}-${row.periodStart}-${row.periodEnd}`}
              className="shadow-sm"
            >
              <CardHeader className="pb-2 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 text-sm font-semibold text-foreground truncate">
                    {row.employeeFullName}
                  </p>
                  <RowTypeBadge row={row} />
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="rounded-md bg-primary/5 p-2.5 flex justify-between items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">
                    {fieldsCopy.estimatedAmount}
                  </span>
                  <span className="text-base font-extrabold tabular-nums text-foreground">
                    {row.estimatedNetAmount != null
                      ? formatMxCurrency(row.estimatedNetAmount)
                      : copy.backlog.estimatedAmountMissing}
                  </span>
                </div>

                <div className="space-y-1">
                  <BacklogPeriod row={row} />
                  <PeriodWarnings row={row} fromState={fromState} />
                </div>

                <div className="pt-1">
                  {canCreate ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => onNavigateCreate(createPath)}
                      data-help-anchor="stl-liquidar-periodo"
                    >
                      {backlogCtaLabel(row)}
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {copy.backlog.readOnly}
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

  // Empty lo resuelve SettlementsListPage (EmptyState XOR checklist/bridge).
  if (rows.length === 0) return null;

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
            const createPath = resolveBacklogCreatePath(row);

            return (
              <TableRow
                key={`${row.employeeId}-${row.periodStart}-${row.periodEnd}`}
                className="hover:bg-muted/40"
              >
                <TableCell className="min-w-[220px] py-3">
                  <p className="font-semibold text-foreground whitespace-nowrap">
                    {row.employeeFullName}
                  </p>
                </TableCell>
                <TableCell className="min-w-[140px] py-3 text-right">
                  <p className="tabular-nums text-base font-bold text-foreground whitespace-nowrap">
                    {row.estimatedNetAmount != null
                      ? formatMxCurrency(row.estimatedNetAmount)
                      : copy.backlog.estimatedAmountMissing}
                  </p>
                </TableCell>
                <TableCell className="min-w-[220px] py-3">
                  <div className="space-y-1.5">
                    <BacklogPeriod row={row} />
                    <PeriodWarnings row={row} fromState={fromState} />
                  </div>
                </TableCell>
                <TableCell className="min-w-[170px] py-3">
                  <RowTypeBadge row={row} />
                </TableCell>
                <TableCell className="min-w-[150px] py-3 text-right">
                  {canCreate ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigateCreate(createPath)}
                      data-help-anchor="stl-liquidar-periodo"
                    >
                      {backlogCtaLabel(row)}
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">{copy.backlog.readOnly}</span>
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
