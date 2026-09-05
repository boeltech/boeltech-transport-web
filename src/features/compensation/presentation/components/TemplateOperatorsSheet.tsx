import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import type { CompensationTemplate } from "../../domain/entities";
import { compensationCopy } from "../copy/compensationCopy";
import { TemplateOperatorsPanel } from "./TemplateOperatorsPanel";

const copy = compensationCopy.operatorsSheet;

interface TemplateOperatorsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: CompensationTemplate | null;
  canUpdate?: boolean;
  compositionEditing?: boolean;
  batchInitialEmployeeIds?: string[];
  onAssignmentsChange?: () => void;
}

export function TemplateOperatorsSheet({
  open,
  onOpenChange,
  template,
  canUpdate = false,
  compositionEditing = false,
  batchInitialEmployeeIds,
  onAssignmentsChange,
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
            {copy.title.replace("{{name}}", template.name)}
          </SheetTitle>
          <SheetDescription>{copy.description}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <TemplateOperatorsPanel
            template={template}
            canUpdate={canUpdate}
            compositionEditing={compositionEditing}
            batchOpen={batchOpen}
            onBatchOpenChange={setBatchOpen}
            batchInitialEmployeeIds={batchInitialEmployeeIds}
            onAssignmentsChange={onAssignmentsChange}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
