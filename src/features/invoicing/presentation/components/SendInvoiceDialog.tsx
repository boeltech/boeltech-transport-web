import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import {
  useInvoiceSendRecipients,
  useSendInvoice,
} from "@features/invoicing/application";
import { DispatchRunRecipientsEditor } from "@features/finance/presentation/components/DispatchRunRecipientsList";
import {
  buildSendRecipientKeys,
  countSelectedRecipients,
  defaultRecipientSelection,
  toRecipientGroups,
  toggleRecipientKey,
} from "../utils/invoiceSendRecipientSelection";
import { invoicingCopy } from "../copy/invoicingCopy";

const copy = invoicingCopy.send.dialog;

export function SendInvoiceDialog({
  invoiceId,
  open,
  onOpenChange,
  alreadySent,
  onSent,
}: {
  invoiceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alreadySent: boolean;
  onSent?: () => void;
}) {
  const { toast } = useToast();
  const {
    data: recipientsPayload,
    isLoading,
    isError,
    refetch,
  } = useInvoiceSendRecipients(invoiceId, open);
  const [selection, setSelection] = useState<Record<string, string[]>>({});

  const groups = useMemo(
    () => (recipientsPayload ? toRecipientGroups(recipientsPayload) : []),
    [recipientsPayload],
  );

  useEffect(() => {
    if (!open || !recipientsPayload) return;
    setSelection(defaultRecipientSelection(toRecipientGroups(recipientsPayload)));
  }, [open, recipientsPayload?.clientId]);

  const { mutate: send, isPending } = useSendInvoice(invoiceId, {
    onSuccess: () => {
      toast({
        variant: "success",
        title: copy.successToast,
      });
      onSent?.();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: copy.errorToast,
        description: getErrorMessage(error),
      });
    },
  });

  const clientId = recipientsPayload?.clientId;
  const hasEligible = groups.some((group) => group.recipients.length > 0);
  const selectedCount = countSelectedRecipients(selection);
  const zeroSelected =
    Boolean(clientId) && (selection[clientId!]?.length ?? 0) === 0;

  const handleConfirm = () => {
    if (!recipientsPayload || zeroSelected) return;
    send({
      recipientKeys: buildSendRecipientKeys(recipientsPayload, selection),
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {alreadySent ? copy.titleResend : copy.title}
          </AlertDialogTitle>
          <AlertDialogDescription>{copy.description}</AlertDialogDescription>
        </AlertDialogHeader>

        {alreadySent ? (
          <Alert variant="warning">
            <AlertDescription>{copy.resendWarning}</AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {copy.loading}
          </div>
        ) : null}

        {isError ? (
          <div className="space-y-2 text-sm">
            <p className="text-destructive">{copy.loadError}</p>
            <button
              type="button"
              className="text-primary underline-offset-4 hover:underline"
              onClick={() => void refetch()}
            >
              {copy.retry}
            </button>
          </div>
        ) : null}

        {!isLoading && !isError && recipientsPayload ? (
          <div className="space-y-2">
            {!hasEligible ? (
              <p className="text-sm text-destructive">
                {copy.noRecipients}{" "}
                <Link
                  to={`/clients/${recipientsPayload.clientId}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {copy.clientLink}
                </Link>
              </p>
            ) : (
              <>
                <DispatchRunRecipientsEditor
                  groups={groups}
                  selection={selection}
                  disabled={isPending}
                  onToggle={(groupClientId, key, checked) =>
                    setSelection((current) =>
                      toggleRecipientKey(current, groupClientId, key, checked),
                    )
                  }
                />
                {zeroSelected ? (
                  <p className="text-xs text-destructive">{copy.zeroSelected}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {copy.recipientsSelected(selectedCount)}
                  </p>
                )}
              </>
            )}
          </div>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{copy.cancel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={
              isPending ||
              isLoading ||
              isError ||
              !hasEligible ||
              zeroSelected
            }
            onClick={(event) => {
              event.preventDefault();
              handleConfirm();
            }}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {copy.submitting}
              </>
            ) : (
              copy.submit
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
