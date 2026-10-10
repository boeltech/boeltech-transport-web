import type { GenericRfcKind } from "@boeltech/cfdi-domain";
import { useReceiverFiscalCatalogLabels } from "@features/catalogs/application";
import type { GenericReceiverFieldChange } from "@features/invoicing/domain";
import { AlertWithIcon } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { tripFiscalCopy } from "../../copy/tripFiscalCopy";

const copy = tripFiscalCopy.genericReceiverStamp;

export type GenericReceiverStampDialogState =
  | {
      mode: "preflight";
      invoiceId: string;
      kind: GenericRfcKind;
      receiverRfc: string;
      changes: GenericReceiverFieldChange[];
    }
  | {
      mode: "error";
      invoiceId: string;
      kind: GenericRfcKind;
      message: string;
    };

type GenericReceiverStampDialogProps = {
  state: GenericReceiverStampDialogState | null;
  isSubmitting: boolean;
  submitError: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function GenericReceiverStampDialog({
  state,
  isSubmitting,
  submitError,
  onConfirm,
  onCancel,
}: GenericReceiverStampDialogProps) {
  const labels = useReceiverFiscalCatalogLabels(state != null);

  return (
    <Dialog
      open={state != null}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onCancel();
      }}
    >
      {state ? (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {state.mode === "preflight"
                ? copy.preflightTitle(state.kind)
                : copy.errorTitle(state.kind)}
            </DialogTitle>
            <DialogDescription>
              {state.mode === "preflight"
                ? copy.intro(state.receiverRfc)
                : state.message}
            </DialogDescription>
          </DialogHeader>

          {state.mode === "preflight" ? (
            <ul className="space-y-1 text-sm">
              {state.changes.map((change) => (
                <li key={change.field}>
                  {change.field === "receiver_tax_regime"
                    ? copy.taxRegimeChange(
                        change.from,
                        labels.taxRegimeLabel(change.to),
                      )
                    : copy.cfdiUsageChange(
                        change.from,
                        labels.cfdiUsageLabel(change.to),
                      )}
                </li>
              ))}
            </ul>
          ) : null}

          {submitError ? (
            <AlertWithIcon variant="destructive" title={copy.updateFailedTitle}>
              {submitError}
            </AlertWithIcon>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {copy.cancel}
            </Button>
            <Button type="button" onClick={onConfirm} disabled={isSubmitting}>
              {isSubmitting ? copy.confirming : copy.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
