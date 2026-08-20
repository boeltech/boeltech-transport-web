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
import { financeCopy } from "../copy";

const copy = financeCopy.cobros.chainRepair;

interface FinanceChainRepairConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending?: boolean;
  affectedLabels?: string[];
  errorMessage?: string | null;
}

export function FinanceChainRepairConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
  affectedLabels = [],
  errorMessage = null,
}: FinanceChainRepairConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        {affectedLabels.length > 0 ? (
          <div className="space-y-2 text-sm">
            <p className="font-medium">{copy.affectedTitle}</p>
            <ul className="list-inside list-disc text-muted-foreground">
              {affectedLabels.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {errorMessage ? (
          <AlertWithIcon variant="destructive" title={financeCopy.cobros.toastError}>
            {errorMessage}
          </AlertWithIcon>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {copy.cancel}
          </Button>
          <Button type="button" disabled={isPending} onClick={onConfirm}>
            {isPending ? financeCopy.cobros.submitting : copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
