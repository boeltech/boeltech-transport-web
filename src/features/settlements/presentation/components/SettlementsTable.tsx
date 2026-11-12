/**
 * SettlementsTable
 * Clean Architecture - Presentation Layer (Components)
 */

import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Skeleton } from "@shared/ui/skeleton";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import { cn } from "@shared/lib/utils/cn";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { ApprovalFlowLines } from "@features/approvals/presentation/components";
import type { DriverSettlement } from "../../domain/entities";
import { roundCents } from "../../domain/settlementTotals";
import { SettlementStatusBadge } from "./SettlementStatusBadge";
import { SettlementActions } from "./SettlementActions";
import { SettlementKindBadge } from "./SettlementKindBadge";
import { settlementsCopy } from "../copy/settlementsCopy";
import { settlementPeriodLabel } from "../utils/reimbursementLines";
import {
  approvalAgeDays,
  isApprovalAgingWarning,
} from "../utils/approvalAging";

const copy = settlementsCopy;
const bulkCopy = settlementsCopy.workbench.bulkBar;
const pipelineCopy = settlementsCopy.workbench.pipeline;

export type SettlementsTableColumnMode =
  | "pipeline"
  | "registry"
  | "payable"
  | "approval";

interface SettlementsTableProps {
  settlements: DriverSettlement[];
  isLoading: boolean;
  onView: (id: string) => void;
  onDisburse?: (settlement: DriverSettlement) => void;
  onActionComplete?: () => void;
  approvalLinkOnly?: boolean;
  showRejectedCorrection?: boolean;
  columnMode?: SettlementsTableColumnMode;
  /** Selección de lote (Por pagar / En autorización · F4/F7). */
  selectedIds?: ReadonlySet<string>;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: (checked: boolean) => void;
  /** employeeId → hasClabe (HB-T5). Si falta, no inventa Sin CLABE. */
  hasClabeByEmployeeId?: ReadonlyMap<string, boolean>;
}

interface TableHeaderConfig {
  key: string;
  label: string;
  className?: string;
}

const REGISTRY_HEADERS: TableHeaderConfig[] = [
  { key: "settlementNumber", label: copy.fields.settlementNumber, className: "min-w-[140px]" },
  { key: "employee", label: copy.fields.employee, className: "min-w-[160px]" },
  { key: "period", label: copy.fields.period, className: "min-w-[160px]" },
  { key: "trips", label: copy.fields.tripsCount, className: "text-center min-w-[90px]" },
  { key: "grossAmount", label: copy.fields.grossAmount, className: "text-right min-w-[120px]" },
  { key: "totalDiscounts", label: copy.fields.totalDiscounts, className: "text-right min-w-[130px]" },
  { key: "netAmount", label: copy.fields.netAmount, className: "text-right min-w-[130px] font-semibold text-foreground" },
  { key: "status", label: copy.fields.status, className: "min-w-[110px]" },
  { key: "actions", label: "", className: "w-12 text-right" },
];

const PIPELINE_HEADERS: TableHeaderConfig[] = [
  { key: "settlementNumber", label: copy.fields.settlementNumber, className: "min-w-[140px]" },
  { key: "employee", label: copy.fields.employee, className: "min-w-[160px]" },
  { key: "period", label: copy.fields.period, className: "min-w-[160px]" },
  { key: "netAmount", label: copy.fields.netAmount, className: "text-right min-w-[130px] font-semibold text-foreground" },
  { key: "status", label: copy.fields.status, className: "min-w-[110px]" },
  { key: "actions", label: "", className: "w-12 text-right" },
];

const APPROVAL_HEADERS: TableHeaderConfig[] = [
  { key: "select", label: "", className: "w-10" },
  { key: "settlementNumber", label: copy.fields.settlementNumber, className: "min-w-[140px]" },
  { key: "employee", label: copy.fields.employee, className: "min-w-[160px]" },
  { key: "period", label: copy.fields.period, className: "min-w-[160px]" },
  { key: "submittedBy", label: pipelineCopy.submittedBy, className: "min-w-[140px]" },
  { key: "age", label: pipelineCopy.age, className: "min-w-[110px]" },
  { key: "netAmount", label: copy.fields.netAmount, className: "text-right min-w-[130px] font-semibold text-foreground" },
  { key: "status", label: copy.fields.status, className: "min-w-[110px]" },
  { key: "actions", label: "", className: "w-12 text-right" },
];

const PAYABLE_HEADERS: TableHeaderConfig[] = [
  { key: "select", label: "", className: "w-10" },
  { key: "settlementNumber", label: copy.fields.settlementNumber, className: "min-w-[140px]" },
  { key: "employee", label: copy.fields.employee, className: "min-w-[160px]" },
  { key: "period", label: copy.fields.period, className: "min-w-[160px]" },
  { key: "approvedBy", label: "Autorizó", className: "min-w-[140px]" },
  { key: "account", label: "Cuenta", className: "min-w-[120px]" },
  { key: "netAmount", label: "A pagar", className: "text-right min-w-[130px] font-semibold text-foreground" },
  { key: "actions", label: "", className: "w-12 text-right" },
];

function TableHeaderRow({ headers }: { headers: TableHeaderConfig[] }) {
  return (
    <TableHeader>
      <TableRow>
        {headers.map((header) => (
          <TableHead key={header.key} className={header.className}>
            {header.label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}

function LoadingSkeleton({ colCount }: { colCount: number }) {
  return (
    <TableBody>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: colCount }).map((__, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}

function SettlementStatusCell({
  status,
  rejectionReason,
  showRejectedCorrection,
  approval,
}: {
  status: DriverSettlement["status"];
  rejectionReason?: string | null;
  showRejectedCorrection: boolean;
  approval?: DriverSettlement["approval"];
}) {
  return (
    <div className="flex flex-col gap-1 items-start">
      <SettlementStatusBadge status={status} showIcon size="sm" />
      <ApprovalFlowLines approval={approval} />
      {showRejectedCorrection && status === "rejected" ? (
        <Badge variant="destructive" tone="soft" className="text-xs">
          {settlementsCopy.workbench.backlog.correctBadge}
          {rejectionReason ? (
            <span className="ml-1 font-normal truncate max-w-[120px] inline-block align-bottom">
              · {rejectionReason}
            </span>
          ) : null}
        </Badge>
      ) : null}
    </div>
  );
}

function getTripsCount(st: DriverSettlement): number | string {
  if (st.tripsCount !== undefined && st.tripsCount !== null) {
    return st.tripsCount;
  }
  if (st.items) {
    return new Set(st.items.filter((it) => it.tripId).map((it) => it.tripId)).size;
  }
  return "—";
}

function getTotalDiscounts(st: DriverSettlement): number {
  return roundCents(st.totalAdvancesDeducted + st.totalOtherDeductions);
}

export function SettlementsTable({
  settlements,
  isLoading,
  onView,
  onDisburse,
  onActionComplete,
  approvalLinkOnly = false,
  showRejectedCorrection = false,
  columnMode = "registry",
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  hasClabeByEmployeeId,
}: SettlementsTableProps) {
  const selectable = Boolean(onToggleSelect);
  const baseHeaders =
    columnMode === "payable"
      ? PAYABLE_HEADERS
      : columnMode === "approval"
        ? APPROVAL_HEADERS
        : columnMode === "pipeline"
          ? PIPELINE_HEADERS
          : REGISTRY_HEADERS;
  const headers =
    selectable && columnMode !== "payable" && columnMode !== "approval"
      ? [{ key: "select", label: "", className: "w-10" }, ...baseHeaders]
      : baseHeaders;
  const colCount = headers.length;
  const allSelected =
    selectable &&
    settlements.length > 0 &&
    settlements.every((st) => selectedIds?.has(st.id));

  if (isLoading) {
    return (
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table aria-label="Listado de pagos">
          <TableHeaderRow headers={headers} />
          <LoadingSkeleton colCount={colCount} />
        </Table>
      </div>
    );
  }

  // Empty lo resuelve el shell (ListPageShell / WorkbenchPageShell): EmptyState único.
  if (settlements.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border bg-card overflow-x-auto">
      <Table aria-label="Listado de pagos">
        {selectable ? (
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header.key} className={header.className}>
                  {header.key === "select" ? (
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) =>
                        onToggleSelectAll?.(checked === true)
                      }
                      aria-label="Seleccionar todos"
                    />
                  ) : (
                    header.label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        ) : (
          <TableHeaderRow headers={headers} />
        )}
        <TableBody>
          {settlements.map((st) => {
            const selected = selectedIds?.has(st.id) ?? false;
            const missingClabe =
              columnMode === "payable" &&
              hasClabeByEmployeeId?.get(st.employeeId) === false;
            const ageDays =
              columnMode === "approval"
                ? approvalAgeDays(st.submittedAt)
                : null;
            const agingWarn = isApprovalAgingWarning(ageDays);

            return (
            <TableRow
              key={st.id}
              className={cn(
                "cursor-pointer hover:bg-muted/50 transition-colors",
                selected && "bg-primary/5",
                agingWarn && "bg-warning-soft/60",
              )}
              data-testid={
                agingWarn ? `settlement-aging-warn-${st.id}` : undefined
              }
              onClick={() => onView(st.id)}
            >
              {selectable || columnMode === "approval" ? (
                <TableCell
                  className="w-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  {selectable ? (
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => onToggleSelect?.(st.id)}
                      aria-label={`Seleccionar ${st.settlementNumber}`}
                    />
                  ) : null}
                </TableCell>
              ) : null}

              <TableCell className="font-semibold text-foreground font-mono tabular-nums whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5">
                  {st.settlementNumber}
                  <SettlementKindBadge kind={st.settlementKind} className="font-sans text-xs" />
                </span>
              </TableCell>

              <TableCell className="font-medium whitespace-nowrap">
                {st.employeeFullName ?? "—"}
              </TableCell>

              <TableCell className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
                {settlementPeriodLabel(st)}
              </TableCell>

              {columnMode === "approval" ? (
                <>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {st.submittedByName ?? st.createdByName ?? "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {ageDays == null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : agingWarn ? (
                      <Badge variant="warning" tone="soft" className="text-xs">
                        {ageDays === 0
                          ? pipelineCopy.ageToday
                          : pipelineCopy.ageDays(ageDays)}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {ageDays === 0
                          ? pipelineCopy.ageToday
                          : pipelineCopy.ageDays(ageDays)}
                      </span>
                    )}
                  </TableCell>
                </>
              ) : null}

              {columnMode === "payable" ? (
                <>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {st.approvedByName
                      ? `${st.approvedByName}${st.approvedAt ? ` · ${new Date(st.approvedAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}` : ""}`
                      : "—"}
                  </TableCell>
                  <TableCell className="min-w-0 whitespace-nowrap">
                    {missingClabe ? (
                      <div className="space-y-1" data-testid="settlement-no-clabe-tip">
                        <Badge
                          variant="warning"
                          tone="soft"
                          data-testid="settlement-no-clabe-badge"
                        >
                          {bulkCopy.noClabeBadge}
                        </Badge>
                        <p className="whitespace-normal text-[11px] leading-snug text-muted-foreground">
                          {bulkCopy.noClabeCashRowTip}
                          {" · "}
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-[11px] underline underline-offset-2"
                            asChild
                          >
                            <Link
                              to={`/employees/${st.employeeId}`}
                              onClick={(e) => e.stopPropagation()}
                              data-testid={`settlement-no-clabe-employees-${st.id}`}
                            >
                              {bulkCopy.completeClabeInEmployees}
                            </Link>
                          </Button>
                        </p>
                      </div>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">
                        SPEI
                      </span>
                    )}
                  </TableCell>
                </>
              ) : null}

              {columnMode === "registry" ? (
                <>
                  <TableCell className="text-center tabular-nums font-medium whitespace-nowrap">
                    {getTripsCount(st)}
                  </TableCell>

                  <TableCell className="text-right tabular-nums whitespace-nowrap">
                    {formatMxCurrency(st.grossAmount)}
                  </TableCell>

                  <TableCell className="text-right tabular-nums text-destructive font-medium whitespace-nowrap">
                    {getTotalDiscounts(st) > 0 ? (
                      `-${formatMxCurrency(getTotalDiscounts(st))}`
                    ) : (
                      <span className="text-muted-foreground font-normal">—</span>
                    )}
                  </TableCell>
                </>
              ) : null}

              <TableCell className="text-right tabular-nums font-bold text-foreground whitespace-nowrap">
                {formatMxCurrency(st.netAmount)}
              </TableCell>

              {columnMode !== "payable" ? (
                <TableCell className="whitespace-nowrap">
                  <SettlementStatusCell
                    status={st.status}
                    rejectionReason={st.rejectionReason}
                    showRejectedCorrection={showRejectedCorrection}
                    approval={st.approval}
                  />
                </TableCell>
              ) : null}

              <TableCell
                className="w-12 text-right whitespace-nowrap"
                onClick={(e) => e.stopPropagation()}
              >
                <SettlementActions
                  settlement={st}
                  onView={onView}
                  onDisburse={onDisburse}
                  onActionComplete={onActionComplete}
                  approvalLinkOnly={approvalLinkOnly}
                  hasClabe={hasClabeByEmployeeId?.get(st.employeeId)}
                />
              </TableCell>
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
