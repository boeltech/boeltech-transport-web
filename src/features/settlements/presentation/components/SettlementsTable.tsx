/**
 * SettlementsTable — listado Operate (`EntityListTable`).
 *
 * Modos registry / pipeline / payable / approval. ≤7 cols datos + actions
 * (registry: Viajes apilado en Periodo). Empty → null. `framed={false}`.
 * Selección de lote existente vía columna checkbox (T9 no nuevo).
 */

import type { HTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListStackedValue,
} from "@shared/ui/table";
import { formatDate } from "@shared/utils/dateUtils";
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

function settlementNumberCell(st: DriverSettlement): ReactNode {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono tabular-nums whitespace-nowrap">
      {st.settlementNumber}
      <SettlementKindBadge kind={st.settlementKind} className="font-sans text-xs" />
    </span>
  );
}

function buildColumns(
  props: SettlementsTableProps & {
    selectable: boolean;
    allSelected: boolean;
  },
): EntityListColumnDef<DriverSettlement>[] {
  const {
    columnMode = "registry",
    selectable,
    allSelected,
    selectedIds,
    onToggleSelect,
    onToggleSelectAll,
    showRejectedCorrection = false,
    onView,
    onDisburse,
    onActionComplete,
    approvalLinkOnly = false,
    hasClabeByEmployeeId,
  } = props;

  const columns: EntityListColumnDef<DriverSettlement>[] = [];

  if (selectable) {
    columns.push({
      id: "select",
      // EntityListTable tipa header como string; Checkbox en thead (lote existente).
      header: (
        <Checkbox
          checked={allSelected}
          onCheckedChange={(checked) => onToggleSelectAll?.(checked === true)}
          aria-label="Seleccionar todos"
        />
      ) as unknown as string,
      kind: "text",
      className: "w-10",
      headerClassName: "w-10",
      accessor: (st) => (
        <span data-no-row-nav="" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selectedIds?.has(st.id) ?? false}
            onCheckedChange={() => onToggleSelect?.(st.id)}
            aria-label={`Seleccionar ${st.settlementNumber}`}
          />
        </span>
      ),
    });
  }

  columns.push({
    id: "settlementNumber",
    header: copy.fields.settlementNumber,
    kind: "primary",
    className: "min-w-[140px]",
    accessor: settlementNumberCell,
  });

  columns.push({
    id: "employee",
    header: copy.fields.employee,
    kind: "text",
    className: "min-w-[160px] font-medium whitespace-nowrap",
    accessor: (st) => st.employeeFullName ?? "—",
  });

  if (columnMode === "registry") {
    columns.push({
      id: "period",
      header: copy.fields.period,
      kind: "stacked",
      className: "min-w-[160px]",
      accessor: (st): EntityListStackedValue => ({
        primary: settlementPeriodLabel(st),
        secondary: `${copy.fields.tripsCount}: ${getTripsCount(st)}`,
      }),
    });
    columns.push({
      id: "grossAmount",
      header: copy.fields.grossAmount,
      kind: "money",
      className: "min-w-[120px]",
      accessor: (st) => st.grossAmount,
    });
    columns.push({
      id: "totalDiscounts",
      header: copy.fields.totalDiscounts,
      kind: "money",
      className: "min-w-[130px]",
      accessor: (st) => {
        const discounts = getTotalDiscounts(st);
        if (discounts <= 0) {
          return (
            <span className="text-muted-foreground font-normal">—</span>
          );
        }
        return -discounts;
      },
    });
  } else {
    columns.push({
      id: "period",
      header: copy.fields.period,
      kind: "meta",
      className: "min-w-[160px] whitespace-nowrap text-xs sm:text-sm",
      accessor: (st) => settlementPeriodLabel(st),
    });
  }

  if (columnMode === "approval") {
    columns.push({
      id: "submittedBy",
      header: pipelineCopy.submittedBy,
      kind: "meta",
      className: "min-w-[140px] text-xs whitespace-nowrap",
      accessor: (st) => st.submittedByName ?? st.createdByName ?? "—",
    });
    columns.push({
      id: "age",
      header: pipelineCopy.age,
      kind: "status",
      className: "min-w-[110px] whitespace-nowrap",
      accessor: (st) => {
        const ageDays = approvalAgeDays(st.submittedAt);
        if (ageDays == null) {
          return <span className="text-muted-foreground">—</span>;
        }
        const label =
          ageDays === 0
            ? pipelineCopy.ageToday
            : pipelineCopy.ageDays(ageDays);
        if (isApprovalAgingWarning(ageDays)) {
          return (
            <Badge variant="warning" tone="soft" className="text-xs">
              {label}
            </Badge>
          );
        }
        return (
          <span className="text-xs text-muted-foreground">{label}</span>
        );
      },
    });
  }

  if (columnMode === "payable") {
    columns.push({
      id: "approvedBy",
      header: "Autorizó",
      kind: "meta",
      className: "min-w-[140px] text-xs whitespace-nowrap",
      accessor: (st) => {
        if (!st.approvedByName) return "—";
        const when = st.approvedAt ? ` · ${formatDate(st.approvedAt)}` : "";
        return `${st.approvedByName}${when}`;
      },
    });
    columns.push({
      id: "account",
      header: "Cuenta",
      kind: "text",
      className: "min-w-[120px] whitespace-nowrap",
      accessor: (st) => {
        const missingClabe =
          hasClabeByEmployeeId?.get(st.employeeId) === false;
        if (!missingClabe) {
          return (
            <span className="font-mono text-xs text-muted-foreground">SPEI</span>
          );
        }
        return (
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
        );
      },
    });
  }

  columns.push({
    id: "netAmount",
    header:
      columnMode === "payable" ? "A pagar" : copy.fields.netAmount,
    kind: "money",
    className: "min-w-[130px] font-semibold text-foreground",
    accessor: (st) => st.netAmount,
  });

  if (columnMode !== "payable") {
    columns.push({
      id: "status",
      header: copy.fields.status,
      kind: "status",
      className: "min-w-[110px] whitespace-nowrap",
      accessor: (st) => (
        <SettlementStatusCell
          status={st.status}
          rejectionReason={st.rejectionReason}
          showRejectedCorrection={showRejectedCorrection}
          approval={st.approval}
        />
      ),
    });
  }

  columns.push({
    id: "actions",
    header: "",
    kind: "actions",
    accessor: (st) => (
      <SettlementActions
        settlement={st}
        onView={onView}
        onDisburse={onDisburse}
        onActionComplete={onActionComplete}
        approvalLinkOnly={approvalLinkOnly}
        hasClabe={hasClabeByEmployeeId?.get(st.employeeId)}
      />
    ),
  });

  return columns;
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
  const allSelected =
    selectable &&
    settlements.length > 0 &&
    settlements.every((st) => selectedIds?.has(st.id));

  const columns = buildColumns({
    settlements,
    isLoading,
    onView,
    onDisburse,
    onActionComplete,
    approvalLinkOnly,
    showRejectedCorrection,
    columnMode,
    selectedIds,
    onToggleSelect,
    onToggleSelectAll,
    hasClabeByEmployeeId,
    selectable,
    allSelected,
  });

  return (
    <EntityListTable
      framed={false}
      density="list"
      aria-label="Listado de pagos"
      columns={columns}
      rows={settlements}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      onRowActivate={(st) => onView(st.id)}
      getRowClassName={(st) => {
        const selected = selectedIds?.has(st.id) ?? false;
        const ageDays =
          columnMode === "approval"
            ? approvalAgeDays(st.submittedAt)
            : null;
        const agingWarn = isApprovalAgingWarning(ageDays);
        if (selected && agingWarn) return "bg-primary/5 bg-warning-soft/60";
        if (selected) return "bg-primary/5";
        if (agingWarn) return "bg-warning-soft/60";
        return undefined;
      }}
      getRowProps={(st) => {
        const ageDays =
          columnMode === "approval"
            ? approvalAgeDays(st.submittedAt)
            : null;
        if (!isApprovalAgingWarning(ageDays)) return undefined;
        return {
          "data-testid": `settlement-aging-warn-${st.id}`,
        } as HTMLAttributes<HTMLTableRowElement>;
      }}
    />
  );
}
