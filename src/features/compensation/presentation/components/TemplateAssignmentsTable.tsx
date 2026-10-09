import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Button } from "@shared/ui/button";
import { Skeleton } from "@shared/ui/skeleton";
import { EmptyState } from "@shared/ui/feedback-states";
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

interface TemplateAssignmentsTableProps {
  assignments: TemplateAssignment[];
  fixedAllowances?: TemplateFixedAllowance[];
  isLoading?: boolean;
  /** PRD D20: fila resaltada, desplazada a la vista y con el foco en su «···». */
  focusedAssignmentId?: string;
  onActionComplete?: () => void;
}

/** Botón «···» de la fila; si no hay menú (sin permisos), la fila misma recibe el foco. */
function focusRowMenu(row: HTMLTableRowElement) {
  row.scrollIntoView?.({ block: "center" });
  const trigger = row.querySelector<HTMLElement>("[data-assignment-menu-trigger]");
  (trigger ?? row).focus();
}

function AssignmentsTableHeader({ showOverrides }: { showOverrides: boolean }) {
  return (
    <TableHeader>
      <TableRow>
        {showOverrides ? <TableHead className="w-10" /> : null}
        <TableHead>{copy.columns.operator}</TableHead>
        <TableHead>{copy.columns.effectiveFrom}</TableHead>
        <TableHead>{copy.columns.effectiveTo}</TableHead>
        <TableHead>{copy.columns.status}</TableHead>
        <TableHead className="w-12" />
      </TableRow>
    </TableHeader>
  );
}

function AssignmentsLoadingSkeleton({ showOverrides }: { showOverrides: boolean }) {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <TableRow key={index}>
          {showOverrides ? (
            <TableCell>
              <Skeleton className="h-7 w-7" />
            </TableCell>
          ) : null}
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-8" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function AssignmentsTableFrame({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border bg-card overflow-x-auto">
      <Table aria-label={TABLE_ARIA_LABEL}>{children}</Table>
    </div>
  );
}

export function TemplateAssignmentsTable({
  assignments,
  fixedAllowances = [],
  isLoading,
  focusedAssignmentId,
  onActionComplete,
}: TemplateAssignmentsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const showOverrides = fixedAllowances.length > 0;
  const rows = useMemo(
    () => sortByDisplayStatus(assignments, getTodayString()),
    [assignments],
  );
  const focusedRowRef = useRef<HTMLTableRowElement>(null);
  const focusedOnceRef = useRef<string | null>(null);

  useEffect(() => {
    if (!focusedAssignmentId) {
      focusedOnceRef.current = null;
      return;
    }
    if (focusedOnceRef.current === focusedAssignmentId || !focusedRowRef.current) return;
    focusedOnceRef.current = focusedAssignmentId;
    focusRowMenu(focusedRowRef.current);
  }, [focusedAssignmentId, rows, isLoading]);

  if (isLoading) {
    return (
      <AssignmentsTableFrame>
        <AssignmentsTableHeader showOverrides={showOverrides} />
        <TableBody>
          <AssignmentsLoadingSkeleton showOverrides={showOverrides} />
        </TableBody>
      </AssignmentsTableFrame>
    );
  }

  if (assignments.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-8 w-8 text-muted-foreground" />}
        title={copy.emptyTitle}
        description={copy.empty}
        size="sm"
      />
    );
  }

  return (
    <AssignmentsTableFrame>
      <AssignmentsTableHeader showOverrides={showOverrides} />
      <TableBody>
        {rows.map(({ assignment, status }) => {
          const isExpanded = expandedId === assignment.id;
          const isFocused = assignment.id === focusedAssignmentId;

          return (
            <Fragment key={assignment.id}>
              <TableRow
                ref={isFocused ? focusedRowRef : undefined}
                data-focused={isFocused ? "true" : undefined}
                tabIndex={isFocused ? -1 : undefined}
                className={isFocused ? "bg-accent hover:bg-accent" : undefined}
              >
                {showOverrides ? (
                  <TableCell className="py-2">
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
                  </TableCell>
                ) : null}
                <TableCell>
                  {assignment.employeeFullName ?? assignment.employeeId.slice(0, 8)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDate(assignment.effectiveFrom)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDate(assignment.effectiveTo)}
                </TableCell>
                <TableCell>
                  <AssignmentDisplayStatusBadge assignment={assignment} status={status} />
                </TableCell>
                <TableCell className="text-right">
                  <TemplateAssignmentActions
                    assignment={assignment}
                    displayStatus={status}
                    onActionComplete={onActionComplete}
                  />
                </TableCell>
              </TableRow>
              {showOverrides && isExpanded ? (
                <TableRow>
                  <TableCell colSpan={6} className="bg-muted/20 p-0">
                    <div className="p-4">
                      <FixedAllowanceOverridePanel
                        assignment={assignment}
                        fixedAllowances={fixedAllowances}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
            </Fragment>
          );
        })}
      </TableBody>
    </AssignmentsTableFrame>
  );
}
