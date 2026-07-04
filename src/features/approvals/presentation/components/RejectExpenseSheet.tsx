import { useMemo, useState } from "react";
import { Button } from "@shared/ui/button";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area/textarea";
import { FieldInlineError } from "@shared/ui/form/FieldInlineError";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import type { ApprovableItem } from "../../domain";
import { approvalsCopy } from "../copy/approvalsCopy";

const copy = approvalsCopy.rejectSheet;
const MAX_REASON_LENGTH = 500;
const MIN_REASON_LENGTH = 5;

export interface RejectExpenseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ApprovableItem | null;
  bulkItems?: ApprovableItem[];
  isSubmitting?: boolean;
  onSubmit: (reason: string, items: ApprovableItem[]) => void;
}

export function RejectExpenseSheet({
  open,
  onOpenChange,
  item,
  bulkItems,
  isSubmitting = false,
  onSubmit,
}: RejectExpenseSheetProps) {
  const targets = bulkItems?.length ? bulkItems : item ? [item] : [];
  const [reason, setReason] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const isBulk = (bulkItems?.length ?? 0) > 1;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setReason("");
      setFieldError(null);
    }
    onOpenChange(nextOpen);
  };

  const trimmedLength = reason.trim().length;
  const canSubmit = trimmedLength >= MIN_REASON_LENGTH && targets.length > 0;
  const reasonDescribedBy = useMemo(() => {
    const ids = ["reject-expense-reason-counter"];
    if (fieldError) ids.push("reject-expense-reason-error");
    return ids.join(" ");
  }, [fieldError]);

  const sheetTitle = isBulk
    ? copy.titleBulk(bulkItems!.length)
    : copy.title;
  const sheetDescription = isBulk
    ? copy.descriptionBulk(bulkItems!.length)
    : copy.description;

  const handleSubmit = () => {
    if (trimmedLength < MIN_REASON_LENGTH) {
      setFieldError(copy.reasonTooShort);
      return;
    }
    setFieldError(null);
    onSubmit(reason.trim(), targets);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{sheetTitle}</SheetTitle>
          <SheetDescription>{sheetDescription}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="reject-expense-reason">{copy.reasonLabel}</Label>
              <span
                id="reject-expense-reason-counter"
                className="text-xs text-muted-foreground tabular-nums"
              >
                {copy.counter(trimmedLength, MAX_REASON_LENGTH)}
              </span>
            </div>
            <Textarea
              id="reject-expense-reason"
              value={reason}
              onChange={(event) => {
                setReason(event.target.value.slice(0, MAX_REASON_LENGTH));
                if (fieldError) setFieldError(null);
              }}
              onBlur={() => {
                if (
                  reason.trim().length > 0 &&
                  reason.trim().length < MIN_REASON_LENGTH
                ) {
                  setFieldError(copy.reasonTooShort);
                }
              }}
              rows={5}
              placeholder={copy.reasonPlaceholder}
              disabled={isSubmitting}
              aria-invalid={fieldError ? true : undefined}
              aria-describedby={reasonDescribedBy}
            />
            <FieldInlineError
              fieldId="reject-expense-reason"
              message={fieldError ?? undefined}
            />
          </div>
        </div>

        <SheetFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            {copy.cancel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {copy.submit}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
