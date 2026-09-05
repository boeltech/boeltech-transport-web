import { AlertCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import type { CompensationTemplate } from "../../domain/entities";
import { compensationCopy } from "../copy/compensationCopy";
import { useCompensationTemplateForm } from "../hooks/useCompensationTemplateForm";
import { TEMPLATE_FORM_ID } from "../utils/templateFormMappers";
import { CompensationTemplateFormFields } from "./CompensationTemplateFormFields";

const copy = compensationCopy.sheet;

interface CompensationTemplateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: CompensationTemplate | null;
  onSuccess?: () => void;
}

export function CompensationTemplateSheet({
  open,
  onOpenChange,
  template,
  onSuccess,
}: CompensationTemplateSheetProps) {
  const isEdit = Boolean(template?.id);

  const {
    formId,
    form,
    ruleFields,
    appendRule,
    removeRule,
    allowanceFields,
    appendAllowance,
    removeAllowance,
    watchedRules,
    validationMessages,
    apiError,
    isSaving,
    onSubmit,
  } = useCompensationTemplateForm({
    template,
    enabled: open,
    formId: TEMPLATE_FORM_ID,
    onSuccess: () => {
      onOpenChange(false);
      onSuccess?.();
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col h-full bg-background"
        onFocusOutside={(event) => event.preventDefault()}
      >
        <SheetHeader className="px-6 py-4 border-b bg-card shrink-0">
          <SheetTitle className="text-lg font-semibold text-foreground">
            {isEdit ? copy.templateEditTitle : copy.templateCreateTitle}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {isEdit ? copy.templateEditHelp : copy.templateCreateHelp}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {apiError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          ) : null}

          <form id={formId} onSubmit={onSubmit} className="space-y-6">
            <CompensationTemplateFormFields
              form={form}
              ruleFields={ruleFields}
              appendRule={appendRule}
              removeRule={removeRule}
              allowanceFields={allowanceFields}
              appendAllowance={appendAllowance}
              removeAllowance={removeAllowance}
              watchedRules={watchedRules}
              validationMessages={validationMessages}
            />
          </form>
        </div>

        <SheetFooter className="p-4 border-t bg-card shrink-0">
          <div className="flex w-full items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() => onOpenChange(false)}
            >
              {copy.cancel}
            </Button>
            <Button
              type="submit"
              form={formId}
              disabled={isSaving}
              isLoading={isSaving}
            >
              {isSaving ? copy.savePending : copy.save}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
