import { Fragment, useState, type ReactNode } from "react";
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
import type { TemplateAssignment, TemplateFixedAllowance } from "../../domain/entities";
import { compensationCopy } from "../copy/compensationCopy";
import { CompensationActiveStatusBadge } from "../config/compensationStatusConfig";
import { FixedAllowanceOverridePanel } from "./FixedAllowanceOverridePanel";
import { TemplateAssignmentActions } from "./TemplateAssignmentActions";

const copy = compensationCopy.assignments;
const TABLE_ARIA_LABEL = "Operadores asignados al esquema de compensación";

interface TemplateAssignmentsTableProps {
  assignments: TemplateAssignment[];
  fixedAllowances?: TemplateFixedAllowance[];
  isLoading?: boolean;
  onActionComplete?: () => void;
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
  onActionComplete,
}: TemplateAssignmentsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const showOverrides = fixedAllowances.length > 0;

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
        {assignments.map((assignment) => {
          const isExpanded = expandedId === assignment.id;

          return (
            <Fragment key={assignment.id}>
              <TableRow>
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
                <TableCell>{assignment.effectiveFrom}</TableCell>
                <TableCell>{assignment.effectiveTo ?? "—"}</TableCell>
                <TableCell>
                  <CompensationActiveStatusBadge isActive={assignment.isActive} />
                </TableCell>
                <TableCell className="text-right">
                  <TemplateAssignmentActions
                    assignment={assignment}
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
