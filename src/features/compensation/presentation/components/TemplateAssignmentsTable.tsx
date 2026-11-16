/**
 * TemplateAssignmentsTable — operadores asignados a una tarifa (`EntityListTable`).
 *
 * [expand?] · Operador · Vigencia (stacked) · Estado · Acciones.
 * density compact · framed false. Empty = EmptyState del detalle (host no aporta).
 * Foco D20 vía `data-focused` + querySelector (sin ref en EntityListTable).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Users } from "lucide-react";
import { Button } from "@shared/ui/button";
import { EmptyState } from "@shared/ui/feedback-states";
import {
  EntityListTable,
  TableCell,
  TableRow,
  type EntityListColumnDef,
  type EntityListStackedValue,
} from "@shared/ui/table";
import { formatDate, getTodayString } from "@shared/utils/dateUtils";
import type { TemplateAssignment, TemplateFixedAllowance } from "../../domain/entities";
import { compensationCopy } from "../copy/compensationCopy";
import { AssignmentDisplayStatusBadge } from "../config/compensationStatusConfig";
import {
  type AssignmentDisplayStatus,
  getAssignmentDisplayStatus,
} from "../utils/getAssignmentDisplayStatus";
import { FixedAllowanceOverridePanel } from "./FixedAllowanceOverridePanel";
import { TemplateAssignmentActions } from "./TemplateAssignmentActions";

const copy = compensationCopy.assignments;
const TABLE_ARIA_LABEL = "Operadores asignados a la tarifa de pago";

const STATUS_ORDER: Record<AssignmentDisplayStatus, number> = {
  current: 0,
  scheduled: 1,
  concluded: 2,
  deactivated: 3,
};

type AssignmentRow = {
  assignment: TemplateAssignment;
  status: AssignmentDisplayStatus;
};

/** PRD D12: por estado y, dentro de cada uno, «Desde» descendente. */
function sortByDisplayStatus(assignments: readonly TemplateAssignment[], today: string) {
  return assignments
    .map((assignment) => ({
      assignment,
      status: getAssignmentDisplayStatus(assignment, today),
    }))
    .sort(
      (left, right) =>
        STATUS_ORDER[left.status] - STATUS_ORDER[right.status] ||
        right.assignment.effectiveFrom.localeCompare(left.assignment.effectiveFrom),
    );
}

function operatorLabel(assignment: TemplateAssignment): string {
  return assignment.employeeFullName ?? assignment.employeeId.slice(0, 8);
}

interface TemplateAssignmentsTableProps {
  assignments: TemplateAssignment[];
  fixedAllowances?: TemplateFixedAllowance[];
  isLoading?: boolean;
  /** PRD D20: fila resaltada, desplazada a la vista y con el foco en su «···». */
  focusedAssignmentId?: string;
  onActionComplete?: () => void;
  /** Período del corte (deep-link desde Pagos); precarga el panel de suspensión. */
  paymentPeriodStart?: string;
  paymentPeriodEnd?: string;
}

/** Botón «···» de la fila; si no hay menú (sin permisos), la fila misma recibe el foco. */
function focusRowMenu(row: HTMLElement) {
  row.scrollIntoView?.({ block: "center" });
  const trigger = row.querySelector<HTMLElement>("[data-assignment-menu-trigger]");
  (trigger ?? row).focus();
}

function buildColumns(
  showOverrides: boolean,
  expandedId: string | null,
  setExpandedId: (id: string | null) => void,
  onActionComplete?: () => void,
): EntityListColumnDef<AssignmentRow>[] {
  const columns: EntityListColumnDef<AssignmentRow>[] = [];

  if (showOverrides) {
    columns.push({
      id: "expand",
      header: "",
      kind: "status",
      className: "w-8 px-1 py-2",
      accessor: ({ assignment }) => {
        const isExpanded = expandedId === assignment.id;
        return (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? copy.collapseRow : copy.expandRow}
            onClick={() =>
              setExpandedId(isExpanded ? null : assignment.id)
            }
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        );
      },
    });
  }

  columns.push(
    {
      id: "operator",
      header: copy.columns.operator,
      kind: "text",
      className: "min-w-0",
      accessor: ({ assignment }) => {
        const name = operatorLabel(assignment);
        return (
          <span className="block truncate" title={name}>
            {name}
          </span>
        );
      },
    },
    {
      id: "validity",
      header: copy.columns.validity,
      kind: "stacked",
      stackedWeight: "normal",
      className: "whitespace-nowrap",
      accessor: ({ assignment }): EntityListStackedValue => ({
        primary: formatDate(assignment.effectiveFrom),
        secondary: assignment.effectiveTo
          ? formatDate(assignment.effectiveTo)
          : undefined,
      }),
    },
    {
      id: "status",
      header: copy.columns.status,
      kind: "status",
      className: "whitespace-nowrap",
      accessor: ({ assignment, status }) => (
        <AssignmentDisplayStatusBadge assignment={assignment} status={status} />
      ),
    },
    {
      id: "actions",
      header: "",
      kind: "actions",
      accessor: ({ assignment, status }) => (
        <TemplateAssignmentActions
          assignment={assignment}
          displayStatus={status}
          onActionComplete={onActionComplete}
        />
      ),
    },
  );

  return columns;
}

export function TemplateAssignmentsTable({
  assignments,
  fixedAllowances = [],
  isLoading,
  focusedAssignmentId,
  onActionComplete,
  paymentPeriodStart,
  paymentPeriodEnd,
}: TemplateAssignmentsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [openedForFocusId, setOpenedForFocusId] = useState<string | null>(null);
  const showOverrides = fixedAllowances.length > 0;
  const rows = useMemo(
    () => sortByDisplayStatus(assignments, getTodayString()),
    [assignments],
  );
  const deactivatedCount = rows.filter(({ status }) => status === "deactivated").length;
  /** PRD D6: solo se colapsa si conviven desactivadas con otros estados. */
  const canCollapseDeactivated = deactivatedCount > 0 && deactivatedCount < rows.length;

  // Se abre durante el render (no en un efecto) para que la fila exista cuando corra el foco D20.
  const focusTargetsDeactivated = rows.some(
    ({ assignment, status }) =>
      assignment.id === focusedAssignmentId && status === "deactivated",
  );
  if (
    focusedAssignmentId &&
    focusTargetsDeactivated &&
    openedForFocusId !== focusedAssignmentId
  ) {
    setOpenedForFocusId(focusedAssignmentId);
    setShowDeactivated(true);
  }

  const visibleRows =
    canCollapseDeactivated && !showDeactivated
      ? rows.filter(({ status }) => status !== "deactivated")
      : rows;
  const focusedOnceRef = useRef<string | null>(null);

  useEffect(() => {
    if (!focusedAssignmentId) {
      focusedOnceRef.current = null;
      return;
    }
    if (focusedOnceRef.current === focusedAssignmentId) return;
    const row = document.querySelector<HTMLElement>(
      `[data-focused="true"][data-assignment-id="${focusedAssignmentId}"]`,
    );
    if (!row) return;
    focusedOnceRef.current = focusedAssignmentId;
    focusRowMenu(row);
  }, [focusedAssignmentId, visibleRows, isLoading]);

  if (!isLoading && assignments.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-8 w-8 text-muted-foreground" />}
        title={copy.emptyTitle}
        description={copy.empty}
        size="sm"
      />
    );
  }

  const colSpan = showOverrides ? 5 : 4;

  return (
    <div className="space-y-2">
      <EntityListTable
        framed={false}
        className="rounded-md border"
        density="compact"
        columns={buildColumns(
          showOverrides,
          expandedId,
          setExpandedId,
          onActionComplete,
        )}
        rows={visibleRows}
        getRowId={(row) => row.assignment.id}
        isLoading={Boolean(isLoading)}
        aria-label={TABLE_ARIA_LABEL}
        getRowClassName={({ assignment }) =>
          assignment.id === focusedAssignmentId
            ? "bg-accent hover:bg-accent"
            : undefined
        }
        getRowProps={({ assignment }) => {
          const isFocused = assignment.id === focusedAssignmentId;
          return {
            "data-focused": isFocused ? "true" : undefined,
            "data-assignment-id": assignment.id,
            tabIndex: isFocused ? -1 : undefined,
          };
        }}
        renderAfterRow={({ assignment }) => {
          if (!showOverrides || expandedId !== assignment.id) return null;
          return (
            <TableRow>
              <TableCell colSpan={colSpan} className="p-0">
                <div className="border-t px-3 py-2">
                  <FixedAllowanceOverridePanel
                    assignment={assignment}
                    fixedAllowances={fixedAllowances}
                    paymentPeriodStart={paymentPeriodStart}
                    paymentPeriodEnd={paymentPeriodEnd}
                  />
                </div>
              </TableCell>
            </TableRow>
          );
        }}
      />
      {canCollapseDeactivated ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-0"
          aria-expanded={showDeactivated}
          onClick={() => setShowDeactivated((open) => !open)}
        >
          {showDeactivated ? copy.hideDeactivated : copy.showDeactivated(deactivatedCount)}
        </Button>
      ) : null}
    </div>
  );
}
