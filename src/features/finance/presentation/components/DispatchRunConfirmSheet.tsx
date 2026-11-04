/**
 * Sheet de confirmación del ritual Correo del periodo.
 * Destinatarios viven aquí (no en el primer pliegue de la Mesa de corte).
 */

import { AlertTriangle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import type { RecipientsByClient } from "../../domain/billingDispatchRun.types";
import { DispatchRunRecipientsEditor } from "./DispatchRunRecipientsList";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import type { RecipientSelectionState } from "../utils/dispatchRunRecipientSelection";

const copy = dispatchRunsCopy.detail;

export type DispatchRunConfirmSheetMode = "send" | "resend";

export interface DispatchRunConfirmSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: DispatchRunConfirmSheetMode;
  invoiceCount: number;
  repCount: number;
  clientCount: number;
  recipientCount: number;
  pendingStampCount?: number;
  onlyRepsBatch?: boolean;
  recipientGroups: RecipientsByClient[];
  selection: RecipientSelectionState;
  onToggleRecipient: (clientId: string, key: string, checked: boolean) => void;
  hasZeroSelected: boolean;
  errorMessage?: string | null;
  isPending?: boolean;
  confirmDisabled?: boolean;
  onConfirm: () => void;
}

export function DispatchRunConfirmSheet({
  open,
  onOpenChange,
  mode = "send",
  invoiceCount,
  repCount,
  clientCount,
  recipientCount,
  pendingStampCount = 0,
  onlyRepsBatch = false,
  recipientGroups,
  selection,
  onToggleRecipient,
  hasZeroSelected,
  errorMessage,
  isPending = false,
  confirmDisabled = false,
  onConfirm,
}: DispatchRunConfirmSheetProps) {
  const isResend = mode === "resend";
  const title = isResend ? copy.resendConfirm.title : copy.confirm.title;
  const emailNote = isResend
    ? copy.resendConfirm.emailNote
    : copy.confirm.emailNote;
  const submitLabel = isResend
    ? copy.resendConfirm.submit
    : copy.confirm.submit;
  const cancelLabel = isResend
    ? copy.resendConfirm.cancel
    : copy.confirm.cancel;
  const recipientsNote = isResend
    ? copy.resendConfirm.recipientsNote
    : copy.confirm.recipientsNote;
  const summaryClients = isResend
    ? copy.resendConfirm.summaryClients
    : copy.confirm.summaryClients;
  const summaryInvoices = isResend
    ? copy.resendConfirm.summaryInvoices
    : copy.confirm.summaryInvoices;
  const summaryReps = isResend
    ? copy.resendConfirm.summaryReps
    : copy.confirm.summaryReps;
  const summaryRecipients = isResend
    ? copy.resendConfirm.summaryRecipients
    : copy.confirm.summaryRecipients;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
        onFocusOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className="shrink-0 space-y-1 border-b px-6 py-4 text-left">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{emailNote}</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {isResend ? (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{copy.resendConfirm.riskNote}</AlertDescription>
            </Alert>
          ) : null}

          <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
            <p className="font-medium">
              {summaryClients(clientCount)}
              {" · "}
              {summaryInvoices(invoiceCount)}
              {" · "}
              {summaryReps(repCount)}
              {" · "}
              {summaryRecipients(recipientCount)}
            </p>
            {onlyRepsBatch && !isResend ? (
              <p className="mt-2 text-muted-foreground">{copy.onlyRepsInBatch}</p>
            ) : null}
            <p className="mt-2 text-muted-foreground">{recipientsNote}</p>
          </div>

          {!isResend && pendingStampCount > 0 ? (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{copy.confirm.pendingWarningTitle}</AlertTitle>
              <AlertDescription>{copy.confirm.pendingWarning}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{copy.recipients.hint}</p>
            <DispatchRunRecipientsEditor
              groups={recipientGroups}
              selection={selection}
              onToggle={onToggleRecipient}
            />
          </div>

          {errorMessage || hasZeroSelected ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                {errorMessage ??
                  (isResend
                    ? copy.resendConfirm.zeroSelected
                    : copy.recipients.zeroSelected)}
              </AlertTitle>
            </Alert>
          ) : null}
        </div>

        <SheetFooter className="shrink-0 gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            disabled={confirmDisabled || isPending}
            onClick={() => {
              void onConfirm();
            }}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            {submitLabel}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
