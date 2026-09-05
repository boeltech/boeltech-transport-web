/**
 * SettlementsTable
 * Clean Architecture - Presentation Layer (Components)
 */

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
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { DriverSettlement } from "../../domain/entities";
import { SettlementStatusBadge } from "./SettlementStatusBadge";
import { SettlementActions } from "./SettlementActions";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy;

export type SettlementsTableColumnMode = "pipeline" | "registry";

interface SettlementsTableProps {
  settlements: DriverSettlement[];
  isLoading: boolean;
  onView: (id: string) => void;
  onDisburse?: (settlement: DriverSettlement) => void;
  onActionComplete?: () => void;
  approvalLinkOnly?: boolean;
  showRejectedCorrection?: boolean;
  emptyMessage?: string;
  columnMode?: SettlementsTableColumnMode;
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
  { key: "totalAdvances", label: copy.fields.totalAdvances, className: "text-right min-w-[130px]" },
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

function EmptyState({
  message,
  colSpan,
}: {
  message?: string;
  colSpan: number;
}) {
  return (
    <TableBody>
      <TableRow>
        <TableCell
          colSpan={colSpan}
          className="h-24 text-center text-muted-foreground text-sm"
        >
          {message ?? copy.empty.settlements}
        </TableCell>
      </TableRow>
    </TableBody>
  );
}

function SettlementStatusCell({
  status,
  rejectionReason,
  showRejectedCorrection,
}: {
  status: DriverSettlement["status"];
  rejectionReason?: string | null;
  showRejectedCorrection: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 items-start">
      <SettlementStatusBadge status={status} showIcon size="sm" />
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

export function SettlementsTable({
  settlements,
  isLoading,
  onView,
  onDisburse,
  onActionComplete,
  approvalLinkOnly = false,
  showRejectedCorrection = false,
  emptyMessage,
  columnMode = "registry",
}: SettlementsTableProps) {
  const headers = columnMode === "pipeline" ? PIPELINE_HEADERS : REGISTRY_HEADERS;
  const colCount = headers.length;

  if (isLoading) {
    return (
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table aria-label="Listado de liquidaciones">
          <TableHeaderRow headers={headers} />
          <LoadingSkeleton colCount={colCount} />
        </Table>
      </div>
    );
  }

  if (settlements.length === 0) {
    return (
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table aria-label="Listado de liquidaciones">
          <TableHeaderRow headers={headers} />
          <EmptyState message={emptyMessage} colSpan={colCount} />
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card overflow-x-auto">
      <Table aria-label="Listado de liquidaciones">
        <TableHeaderRow headers={headers} />
        <TableBody>
          {settlements.map((st) => (
            <TableRow
              key={st.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onView(st.id)}
            >
              <TableCell className="font-semibold text-primary font-mono whitespace-nowrap">
                {st.settlementNumber}
              </TableCell>

              <TableCell className="font-medium whitespace-nowrap">
                {st.employeeFullName ?? "—"}
              </TableCell>

              <TableCell className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
                {formatDate(st.periodStart)} – {formatDate(st.periodEnd)}
              </TableCell>

              {columnMode === "registry" ? (
                <>
                  <TableCell className="text-center tabular-nums font-medium whitespace-nowrap">
                    {getTripsCount(st)}
                  </TableCell>

                  <TableCell className="text-right tabular-nums whitespace-nowrap">
                    {formatMxCurrency(st.grossAmount)}
                  </TableCell>

                  <TableCell className="text-right tabular-nums text-destructive font-medium whitespace-nowrap">
                    {st.totalAdvancesDeducted > 0 ? (
                      `-${formatMxCurrency(st.totalAdvancesDeducted)}`
                    ) : (
                      <span className="text-muted-foreground font-normal">—</span>
                    )}
                  </TableCell>
                </>
              ) : null}

              <TableCell className="text-right tabular-nums font-bold text-primary whitespace-nowrap">
                {formatMxCurrency(st.netAmount)}
              </TableCell>

              <TableCell className="whitespace-nowrap">
                <SettlementStatusCell
                  status={st.status}
                  rejectionReason={st.rejectionReason}
                  showRejectedCorrection={showRejectedCorrection}
                />
              </TableCell>

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
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
