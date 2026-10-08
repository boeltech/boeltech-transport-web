import { useEffect, useState } from "react";
import { AlertCircle, History, Users } from "lucide-react";
import { Alert, AlertDescription } from "@shared/ui/alert";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import type { CompensationTemplate } from "../../domain/entities";
import { compensationCopy } from "../copy/compensationCopy";
import { getTemplateDisplayStatus } from "../utils/getTemplateDisplayStatus";
import { TemplateOperatorsPanel } from "./TemplateOperatorsPanel";

const copy = compensationCopy.operatorsSheet;

interface TemplateOperatorsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: CompensationTemplate | null;
  canUpdate?: boolean;
  compositionEditing?: boolean;
  batchInitialEmployeeIds?: string[];
  paymentPeriodStart?: string;
  paymentPeriodEnd?: string;
  onAssignmentsChange?: () => void;
  onBatchSuccess?: () => void;
}

export function TemplateOperatorsSheet({
  open,
  onOpenChange,
  template,
  canUpdate = false,
  compositionEditing = false,
  batchInitialEmployeeIds,
  paymentPeriodStart,
  paymentPeriodEnd,
  onAssignmentsChange,
  onBatchSuccess,
}: TemplateOperatorsSheetProps) {
  const [batchOpen, setBatchOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setBatchOpen(false);
      return;
    }
    if (batchInitialEmployeeIds?.length) {
      setBatchOpen(true);
    }
  }, [open, batchInitialEmployeeIds]);

  if (!template) return null;

  const displayStatus = getTemplateDisplayStatus(template);

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
            paymentPeriodStart={paymentPeriodStart}
            paymentPeriodEnd={paymentPeriodEnd}
            onAssignmentsChange={onAssignmentsChange}
            onBatchSuccess={onBatchSuccess}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
