import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { FieldInlineError } from "@shared/ui/form";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area/textarea";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { formatDate } from "@shared/utils/dateUtils";
import type { DriverAdvance } from "../../domain/entities";
import {
  invalidateAdvanceQueries,
  useUpdateDriverAdvance,
} from "../../application/hooks/useAdvances";
import {
  appendAdvanceNote,
  isAdvanceStaleError,
  remainingNoteCharacters,
} from "../utils/advanceEditing";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.advanceFlow;
const FIELD_ID = "advance-note-addition";

export interface AdvanceAddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advance: DriverAdvance;
  /** Inyectable en tests; default = hoy. */
  now?: () => Date;
  onSaved?: () => void;
}

/**
 * ADR-0099 D19: tras entregar, la nota solo crece. La anterior se muestra en
 * solo lectura y la nueva se agrega fechada al final.
 */
export function AdvanceAddNoteDialog({
  open,
  onOpenChange,
  advance,
  now = () => new Date(),
  onSaved,
}: AdvanceAddNoteDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateMutation = useUpdateDriverAdvance();
  const [addition, setAddition] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const dateLabel = formatDate(now().toISOString());
  const remaining = remainingNoteCharacters(advance.notes, addition, dateLabel);

  const handleOpenChange = (next: boolean) => {
    if (!next && updateMutation.isPending) return;
    if (!next) {
      setAddition("");
      setError(null);
      setApiError(null);
    }
    onOpenChange(next);
  };

  const handleSave = async () => {
    if (!addition.trim()) {
      setError(copy.noteDialog.required);
      return;
    }
    if (remaining < 0) {
      setError(copy.noteDialog.tooLong);
      return;
    }
    setError(null);
    setApiError(null);
    try {
      await updateMutation.mutateAsync({
        id: advance.id,
        payload: {
          notes: appendAdvanceNote(advance.notes, addition, dateLabel),
          expectedStatus: advance.status,
        },
      });
      toast({ title: copy.toasts.noteAdded, variant: "success" });
      onSaved?.();
      handleOpenChange(false);
      setAddition("");
    } catch (err) {
      if (isAdvanceStaleError(err)) {
        invalidateAdvanceQueries(queryClient);
      }
      setApiError(getErrorMessage(err) || copy.toasts.noteError);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" onClick={(event) => event.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{copy.noteDialog.title}</DialogTitle>
          <DialogDescription>{copy.noteDialog.hint}</DialogDescription>
        </DialogHeader>

        {apiError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <p className="text-sm font-medium">{copy.noteDialog.currentLabel}</p>
            <p
              className="whitespace-pre-wrap rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground"
              data-testid="advance-current-note"
            >
              {advance.notes?.trim() ? advance.notes : copy.noteDialog.currentEmpty}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor={FIELD_ID}>{copy.noteDialog.additionalLabel}</Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {Math.max(remaining, 0)}
              </span>
            </div>
            <Textarea
              id={FIELD_ID}
              rows={3}
              value={addition}
              placeholder={copy.noteDialog.additionalPlaceholder}
              disabled={updateMutation.isPending}
              error={Boolean(error)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${FIELD_ID}-error` : undefined}
              onChange={(event) => {
                setAddition(event.target.value);
                if (error) setError(null);
              }}
            />
            <FieldInlineError fieldId={FIELD_ID} message={error ?? undefined} />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            {copy.noteDialog.cancel}
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? copy.noteDialog.saving : copy.noteDialog.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
