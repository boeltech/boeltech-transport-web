import { useCallback, useMemo, useState } from "react";
import { Users } from "lucide-react";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { getTodayString } from "@shared/utils/dateUtils";
import { useTemplateAssignments } from "../../application/hooks";
import type { CompensationTemplate, TemplateAssignment } from "../../domain/entities";
import { compensationCopy } from "../copy/compensationCopy";
import {
  TEMPLATE_OPERATORS_PAGE_SIZE,
  useFocusedTemplateAssignment,
} from "../hooks/useFocusedTemplateAssignment";
import { getAssignmentDisplayStatus } from "../utils/getAssignmentDisplayStatus";
import type { BatchConflictLink } from "../utils/resolveBatchConflictView";
import {
  TemplateAssignmentBatchSheet,
  type BatchAssignmentFormSnapshot,
} from "./TemplateAssignmentBatchSheet";
import { TemplateAssignmentsTable } from "./TemplateAssignmentsTable";

const copy = compensationCopy.templateDetail;
const panelCopy = compensationCopy.compositionCanvas;
const assignmentsCopy = compensationCopy.assignments;

/** Conteos de la API (la tabla se trunca a 100); programadas por filas solo si la API no las manda. */
function buildAssignmentsSummary(
  template: CompensationTemplate,
  assignments: readonly TemplateAssignment[],
): string {
  const today = getTodayString();
  const current = template.activeAssignmentsCount;
  const scheduled =
    template.scheduledAssignmentsCount ??
    assignments.filter((row) => getAssignmentDisplayStatus(row, today) === "scheduled")
      .length;

  const segments: string[] = [];
  if (current > 0) segments.push(assignmentsCopy.summaryCurrent(current));
  if (scheduled > 0) segments.push(assignmentsCopy.summaryScheduled(scheduled));
  return segments.join(" · ");
}

interface TemplateOperatorsPanelProps {
  template: CompensationTemplate;
  canUpdate?: boolean;
  compositionEditing?: boolean;
  batchOpen?: boolean;
  onBatchOpenChange?: (open: boolean) => void;
  batchInitialEmployeeIds?: readonly string[];
  batchInitialEffectiveFrom?: string;
  paymentPeriodStart?: string;
  paymentPeriodEnd?: string;
  onAssignmentsChange?: () => void;
  /** Lote con todos asignados: cierre en cascada / limpieza de deep-link (lista Tarifas). */
  onBatchSuccess?: () => void;
  /** Asignación a resaltar (`focus`, PRD D20). */
  focusAssignmentId?: string;
  /** Enlace a la asignación que bloquea (PRD D18); el lote se cierra antes de navegar. */
  onOpenBlockingAssignment?: (
    link: BatchConflictLink,
    form: BatchAssignmentFormSnapshot,
  ) => void;
  className?: string;
}

export function TemplateOperatorsPanel({
  template,
  canUpdate = false,
  compositionEditing = false,
  batchOpen: batchOpenProp,
  onBatchOpenChange,
  batchInitialEmployeeIds,
  batchInitialEffectiveFrom,
  paymentPeriodStart,
  paymentPeriodEnd,
  onAssignmentsChange,
  onBatchSuccess,
  focusAssignmentId,
  onOpenBlockingAssignment,
  className,
}: TemplateOperatorsPanelProps) {
  const [internalBatchOpen, setInternalBatchOpen] = useState(false);
  const [internalInitialIds, setInternalInitialIds] = useState<string[] | undefined>();

  const batchOpen = batchOpenProp ?? internalBatchOpen;
  const setBatchOpen = onBatchOpenChange ?? setInternalBatchOpen;

  const {
    data: assignmentsData,
    isLoading: assignmentsLoading,
    refetch: refetchAssignments,
  } = useTemplateAssignments({ templateId: template.id, pageSize: TEMPLATE_OPERATORS_PAGE_SIZE });
  const focused = useFocusedTemplateAssignment(template.id, focusAssignmentId);

  const pageAssignments = assignmentsData?.data;
  const outOfPageFocused =
    focused.status === "found" && !focused.inPage ? focused.assignment : null;
  const assignments = useMemo(() => {
    const rows = pageAssignments ?? [];
    return outOfPageFocused ? [...rows, outOfPageFocused] : rows;
  }, [pageAssignments, outOfPageFocused]);
  const summary = buildAssignmentsSummary(template, pageAssignments ?? []);

  const handleOpenBlockingAssignment = useMemo(
    () =>
      onOpenBlockingAssignment
        ? (link: BatchConflictLink, form: BatchAssignmentFormSnapshot) => {
            setBatchOpen(false);
            onOpenBlockingAssignment(link, form);
          }
        : undefined,
    [onOpenBlockingAssignment, setBatchOpen],
  );

  const handleActionComplete = useCallback(() => {
    void refetchAssignments();
    onAssignmentsChange?.();
  }, [onAssignmentsChange, refetchAssignments]);

  const handleBatchOpenChange = useCallback(
    (open: boolean) => {
      setBatchOpen(open);
      if (!open) {
        setInternalInitialIds(undefined);
      }
    },
    [setBatchOpen],
  );
  return (
    <div className={className}>
      {compositionEditing ? (
        <Alert className="mb-4">
          <AlertDescription>{panelCopy.operatorsEditingWarning}</AlertDescription>
        </Alert>
      ) : null}

      {canUpdate || summary ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p
            className="text-sm text-muted-foreground"
            data-testid="template-operators-summary"
          >
            {summary}
          </p>
          {canUpdate ? (
            <Button
              type="button"
              size="sm"
              leftIcon={<Users className="h-4 w-4" />}
              onClick={() => setBatchOpen(true)}
            >
              {copy.batchAssign}
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="max-h-[min(480px,calc(100vh-320px))] overflow-y-auto">
        <TemplateAssignmentsTable
          assignments={assignments}
          fixedAllowances={template.fixedAllowances}
          isLoading={assignmentsLoading}
          focusedAssignmentId={focused.status === "found" ? focused.assignment.id : undefined}
          onActionComplete={handleActionComplete}
        />
      </div>

      <TemplateAssignmentBatchSheet
        open={batchOpen}
        onOpenChange={handleBatchOpenChange}
        templateId={template.id}
        initialEmployeeIds={batchInitialEmployeeIds ?? internalInitialIds}
        initialEffectiveFrom={batchInitialEffectiveFrom}
        paymentPeriodStart={paymentPeriodStart}
        paymentPeriodEnd={paymentPeriodEnd}
        onAssignmentsCreated={handleActionComplete}
        onSuccess={onBatchSuccess}
        onOpenBlockingAssignment={handleOpenBlockingAssignment}
      />
    </div>
  );
}
