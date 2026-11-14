/**
 * SettlementBacklogTable — Por pagar backlog (`EntityListTable` en modo tabla).
 *
 * Empleado · Estimado · Periodo(+avisos) · Concepto · Acción.
 * Empty → null (SettlementsListPage). `framed={false}` (paridad SettlementsTable).
 * Vista cards sin migrar (no EntityListTable).
 */

import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Skeleton } from "@shared/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@shared/ui/tooltip";
import {
  EntityListTable,
  type EntityListColumnDef,
} from "@shared/ui/table";
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
import { OperatorPaymentStatusBadge } from "../config/operatorPaymentStatusConfig";

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
const IGNORED_BACKLOG_WARNINGS = new Set([
  "no_client_invoice",
  "late_reimbursement",
]);

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
    .filter(
      (w) =>
        WARNINGS_WITH_OWN_BADGE.has(w) || genericWarningLabel(w) !== null,
    )
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
                  <span
                    tabIndex={0}
                    className="inline-flex cursor-help rounded-md"
                  >
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
                      {formatPeriodOverlapFolioLabel(periodOverlap) ??
                        overlapCopy.badge}
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
                  <span
                    tabIndex={0}
                    className="inline-flex cursor-help rounded-md"
                  >
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
                  <span
                    tabIndex={0}
                    className="inline-flex cursor-help rounded-md"
                  >
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
            <Badge
              variant="warning"
              tone="soft"
              className="text-xs font-medium"
            >
              {genericWarningLabel(warning)}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}

function buildTableColumns(opts: {
  canCreate: boolean;
  fromState?: { from: string };
  onNavigateCreate: (path: string) => void;
}): EntityListColumnDef<SettlementBacklogRow>[] {
  const { canCreate, fromState, onNavigateCreate } = opts;

  return [
    {
      id: "employee",
      header: fieldsCopy.employee,
      kind: "text",
      className: "min-w-[220px] font-semibold whitespace-nowrap",
      accessor: (row) => row.employeeFullName,
    },
    {
      id: "estimatedAmount",
      header: fieldsCopy.estimatedAmount,
      kind: "status",
      headerClassName: "text-right",
      className: "min-w-[140px] text-right",
      accessor: (row) =>
        row.estimatedNetAmount != null ? (
          <span className="font-mono text-base font-bold tabular-nums whitespace-nowrap">
            {formatMxCurrency(row.estimatedNetAmount)}
          </span>
        ) : (
          <span className="inline-flex justify-end">
            <OperatorPaymentStatusBadge status="no_template" size="sm" />
          </span>
        ),
    },
    {
      id: "period",
      header: fieldsCopy.period,
      kind: "status",
      className: "min-w-[220px]",
      accessor: (row) => (
        <div className="space-y-1.5">
          <BacklogPeriod row={row} />
          <PeriodWarnings row={row} fromState={fromState} />
        </div>
      ),
    },
    {
      id: "pendingConcept",
      header: fieldsCopy.pendingConcept,
      kind: "status",
      className: "min-w-[170px]",
      accessor: (row) => <RowTypeBadge row={row} />,
    },
    {
      id: "action",
      header: fieldsCopy.action,
      kind: "actions",
      className: "min-w-[150px] w-auto",
      headerClassName: "min-w-[150px] w-auto text-right",
      accessor: (row) => {
        const createPath = resolveBacklogCreatePath(row);
        if (!canCreate) {
          return (
            <span className="text-xs text-muted-foreground">
              {copy.backlog.readOnly}
            </span>
          );
        }
        return (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onNavigateCreate(createPath)}
            data-help-anchor="stl-liquidar-periodo"
          >
            {backlogCtaLabel(row)}
          </Button>
        );
      },
    },
  ];
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
                  {row.estimatedNetAmount != null ? (
                    <span className="text-base font-extrabold tabular-nums text-foreground">
                      {formatMxCurrency(row.estimatedNetAmount)}
                    </span>
                  ) : (
                    <OperatorPaymentStatusBadge status="no_template" size="sm" />
                  )}
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

  const columns = buildTableColumns({
    canCreate,
    fromState,
    onNavigateCreate,
  });

  return (
    <EntityListTable
      framed={false}
      density="list"
      aria-label={copy.backlog.tableAriaLabel}
      columns={columns}
      rows={[...rows]}
      getRowId={(row) =>
        `${row.employeeId}-${row.periodStart}-${row.periodEnd}`
      }
      isLoading={isLoading}
    />
  );
}
