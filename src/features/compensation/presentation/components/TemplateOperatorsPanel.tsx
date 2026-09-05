import { useCallback, useState } from "react";
import { Users } from "lucide-react";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { useTemplateAssignments } from "../../application/hooks";
import type { CompensationTemplate } from "../../domain/entities";
import { compensationCopy } from "../copy/compensationCopy";
import { TemplateAssignmentBatchSheet } from "./TemplateAssignmentBatchSheet";
import { TemplateAssignmentsTable } from "./TemplateAssignmentsTable";

const copy = compensationCopy.templateDetail;
const panelCopy = compensationCopy.compositionCanvas;

interface TemplateOperatorsPanelProps {
  template: CompensationTemplate;
  canUpdate?: boolean;
  compositionEditing?: boolean;
  batchOpen?: boolean;
  onBatchOpenChange?: (open: boolean) => void;
  batchInitialEmployeeIds?: string[];
  onAssignmentsChange?: () => void;
  className?: string;
}

export function TemplateOperatorsPanel({
  template,
  canUpdate = false,
  compositionEditing = false,
  batchOpen: batchOpenProp,
  onBatchOpenChange,
  batchInitialEmployeeIds,
  onAssignmentsChange,
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
  } = useTemplateAssignments({ templateId: template.id, pageSize: 100 });

  const assignments = assignmentsData?.data ?? [];

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

      {canUpdate ? (
        <div className="mb-4 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            size="sm"
            leftIcon={<Users className="h-4 w-4" />}
            onClick={() => setBatchOpen(true)}
          >
            {copy.batchAssign}
          </Button>
        </div>
      ) : null}

      <div className="max-h-[min(480px,calc(100vh-320px))] overflow-y-auto">
        <TemplateAssignmentsTable
          assignments={assignments}
          fixedAllowances={template.fixedAllowances}
          isLoading={assignmentsLoading}
          onActionComplete={handleActionComplete}
        />
      </div>

      <TemplateAssignmentBatchSheet
        open={batchOpen}
        onOpenChange={handleBatchOpenChange}
        templateId={template.id}
        initialEmployeeIds={batchInitialEmployeeIds ?? internalInitialIds}
        onSuccess={() => {
          void refetchAssignments();
          onAssignmentsChange?.();
        }}
      />
    </div>
  );
}
