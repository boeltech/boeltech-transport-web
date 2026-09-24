import { useEffect, useRef, useState } from "react";
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
import { FieldInlineError } from "@shared/ui/form";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import {
  useInvoiceSendRecipients,
  useSendInvoice,
} from "@features/invoicing/application";
import {
  buildSendRecipientKeys,
  defaultSelectedRecipientKeys,
  toggleRecipientKey,
} from "../utils/invoiceSendRecipientSelection";
import { InvoiceRecipientsChecklist } from "./InvoiceRecipientsChecklist";
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
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const recipientsInitKey = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      recipientsInitKey.current = null;
      setSelectedKeys([]);
      setApiError(null);
      return;
    }
    if (!recipientsPayload) return;
    const initKey = `${recipientsPayload.clientId}:${recipientsPayload.recipients
      .map((recipient) => recipient.key)
      .join(",")}`;
    if (recipientsInitKey.current === initKey) return;
    recipientsInitKey.current = initKey;
    setSelectedKeys(defaultSelectedRecipientKeys(recipientsPayload));
    setApiError(null);
  }, [open, recipientsPayload]);

  const { mutate: send, isPending } = useSendInvoice(invoiceId, {
    onSuccess: () => {
      setApiError(null);
      toast({
        variant: "success",
        title: alreadySent ? copy.successToastResend : copy.successToast,
      });
      onSent?.();
      onOpenChange(false);
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      setApiError(message);
      toast({
        variant: "error",
        title: copy.errorToast,
        description: message,
      });
    },
  });

  const hasEligible = (recipientsPayload?.recipients.length ?? 0) > 0;
  const zeroSelected =
    Boolean(recipientsPayload) && selectedKeys.length === 0;
  const submitLabel = alreadySent ? copy.submitResend : copy.submit;

  const handleConfirm = () => {
    if (!recipientsPayload || zeroSelected) return;
    setApiError(null);
    send({
      recipientKeys: buildSendRecipientKeys(recipientsPayload, selectedKeys),
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

        {apiError ? (
          <Alert variant="destructive">
            <AlertDescription>{apiError}</AlertDescription>
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
            <p className="text-sm font-medium text-foreground">
              {copy.recipientsHeading}
            </p>
            <p className="text-xs text-muted-foreground">{copy.recipientsHint}</p>
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
                <InvoiceRecipientsChecklist
                  recipients={recipientsPayload.recipients}
                  selectedKeys={selectedKeys}
                  disabled={isPending}
                  idPrefix={`unit-send-${invoiceId}`}
                  onToggle={(key, checked) =>
                    setSelectedKeys((current) =>
                      toggleRecipientKey(current, key, checked),
                    )
                  }
                />
                {zeroSelected ? (
                  <FieldInlineError
                    fieldId="unit-send-recipients"
                    message={copy.zeroSelected}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {copy.recipientsSelected(selectedKeys.length)}
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
              submitLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
