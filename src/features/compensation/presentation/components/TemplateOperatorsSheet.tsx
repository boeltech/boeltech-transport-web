import { useState } from "react";
import { AlertCircle, History, Info, Users } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { formatDate } from "@shared/utils/dateUtils";
import { useCompensationTemplate } from "../../application/hooks";
import type { CompensationTemplate } from "../../domain/entities";
import { compensationCopy } from "../copy/compensationCopy";
import {
  type FocusedTemplateAssignment,
  useFocusedTemplateAssignment,
} from "../hooks/useFocusedTemplateAssignment";
import { getTemplateDisplayStatus } from "../utils/getTemplateDisplayStatus";
import type { BatchConflictLink } from "../utils/resolveBatchConflictView";
import type { BatchAssignmentFormSnapshot } from "./TemplateAssignmentBatchSheet";
import { TemplateOperatorsPanel } from "./TemplateOperatorsPanel";

const copy = compensationCopy.operatorsSheet;
const noticeCopy = copy.focusNotice;

interface TemplateOperatorsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: CompensationTemplate | null;
  canUpdate?: boolean;
  compositionEditing?: boolean;
  batchInitialEmployeeIds?: readonly string[];
  batchInitialEffectiveFrom?: string;
  paymentPeriodStart?: string;
  paymentPeriodEnd?: string;
  onAssignmentsChange?: () => void;
  onBatchSuccess?: () => void;
  /** Asignación a resaltar (`focus`). */
  focusAssignmentId?: string;
  /** Plantilla del lote de origen (`returnTo`); muestra el aviso D21. */
  returnTemplateId?: string;
  /** «Vigente desde» del lote de origen (`returnFrom`). */
  returnEffectiveFrom?: string;
  onReturnToBatch?: () => void;
  /** «Listo»: quita foco y regreso. */
  onDismissFocus?: () => void;
  onOpenBlockingAssignment?: (
    link: BatchConflictLink,
    form: BatchAssignmentFormSnapshot,
  ) => void;
}

function FocusNotice({
  focused,
  returnTemplate,
  returnEffectiveFrom,
  onReturnToBatch,
  onDismissFocus,
}: {
  focused: FocusedTemplateAssignment;
  returnTemplate: CompensationTemplate | undefined;
  returnEffectiveFrom?: string;
  onReturnToBatch?: () => void;
  onDismissFocus?: () => void;
}) {
  const assignment = focused.status === "found" ? focused.assignment : null;
  const origin = returnTemplate
    ? compensationCopy.batchAssignment.templateVersion(
        returnTemplate.name,
        returnTemplate.version,
      )
    : null;

  const description =
    focused.status === "missing"
      ? noticeCopy.notFound
      : assignment && !assignment.isActive
        ? noticeCopy.done
        : noticeCopy.description(
            origin ?? noticeCopy.originFallback,
            returnEffectiveFrom ? formatDate(returnEffectiveFrom) : null,
          );
  const name = assignment?.employeeFullName?.trim();

  return (
    <Alert variant="info" data-testid="operators-sheet-focus-notice">
      <Info className="h-4 w-4" />
      {focused.status !== "missing" ? (
        <AlertTitle>{name ? noticeCopy.title(name) : noticeCopy.untitled}</AlertTitle>
      ) : null}
      <AlertDescription className="space-y-3">
        <p>{description}</p>
        <div className="flex flex-wrap gap-2">
          {onReturnToBatch ? (
            <Button type="button" size="sm" onClick={onReturnToBatch}>
              {origin ? noticeCopy.returnTo(origin) : noticeCopy.returnFallback}
            </Button>
          ) : null}
          {onDismissFocus ? (
            <Button type="button" size="sm" variant="outline" onClick={onDismissFocus}>
              {noticeCopy.dismiss}
            </Button>
          ) : null}
        </div>
      </AlertDescription>
    </Alert>
  );
}

export function TemplateOperatorsSheet({
  open,
  onOpenChange,
  template,
  canUpdate = false,
  compositionEditing = false,
  batchInitialEmployeeIds,
  batchInitialEffectiveFrom,
  paymentPeriodStart,
  paymentPeriodEnd,
  onAssignmentsChange,
  onBatchSuccess,
  focusAssignmentId,
  returnTemplateId,
  returnEffectiveFrom,
  onReturnToBatch,
  onDismissFocus,
  onOpenBlockingAssignment,
}: TemplateOperatorsSheetProps) {
  const [batchOpen, setBatchOpen] = useState(false);

  // Otra plantilla u otros operadores iniciales = otra sesión del lote (TEC T5).
  const batchInitialIdsKey = batchInitialEmployeeIds?.join(",") ?? "";
  const batchSessionKey = open && template ? `${template.id}|${batchInitialIdsKey}` : null;
  const [seenBatchSessionKey, setSeenBatchSessionKey] = useState<string | null>(null);
  if (seenBatchSessionKey !== batchSessionKey) {
    setSeenBatchSessionKey(batchSessionKey);
    setBatchOpen(Boolean(batchSessionKey && batchInitialIdsKey));
  }

  const focused = useFocusedTemplateAssignment(
    open ? template?.id : undefined,
    focusAssignmentId,
  );
  const { data: returnTemplate } = useCompensationTemplate(
    open ? returnTemplateId : undefined,
  );

  if (!template) return null;

  const displayStatus = getTemplateDisplayStatus(template);
  const showFocusNotice = Boolean(returnTemplateId) || focused.status === "missing";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
        onFocusOutside={(event) => event.preventDefault()}
      >
        <SheetHeader className="border-b px-6 py-4 text-left">
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            {copy.title(template.name, template.version)}
          </SheetTitle>
          <SheetDescription>{copy.description}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {showFocusNotice ? (
            <FocusNotice
              focused={focused}
              returnTemplate={returnTemplateId ? returnTemplate : undefined}
              returnEffectiveFrom={returnEffectiveFrom}
              onReturnToBatch={returnTemplateId ? onReturnToBatch : undefined}
              onDismissFocus={onDismissFocus}
            />
          ) : null}
          {displayStatus === "superseded" ? (
            <Alert variant="info" data-testid="operators-sheet-version-notice">
              <History className="h-4 w-4" />
              <AlertDescription>{copy.supersededNotice}</AlertDescription>
            </Alert>
          ) : displayStatus === "deactivated" ? (
            <Alert variant="warning" data-testid="operators-sheet-version-notice">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{copy.deactivatedNotice}</AlertDescription>
            </Alert>
          ) : null}
          <TemplateOperatorsPanel
            template={template}
            canUpdate={canUpdate}
            compositionEditing={compositionEditing}
            batchOpen={batchOpen}
            onBatchOpenChange={setBatchOpen}
            batchInitialEmployeeIds={batchInitialEmployeeIds}
            batchInitialEffectiveFrom={batchInitialEffectiveFrom}
            paymentPeriodStart={paymentPeriodStart}
            paymentPeriodEnd={paymentPeriodEnd}
            onAssignmentsChange={onAssignmentsChange}
            onBatchSuccess={onBatchSuccess}
            focusAssignmentId={focusAssignmentId}
            onOpenBlockingAssignment={onOpenBlockingAssignment}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
