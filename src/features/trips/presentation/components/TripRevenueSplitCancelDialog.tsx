/**
 * Confirmación de cancelación del prorrateo (ADR-0081 sheet).
 */
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
import { tripFiscalCopy } from "../copy/tripFiscalCopy";

const splitCopy = tripFiscalCopy.revenueSplit;

export interface TripRevenueSplitCancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onConfirm: () => void;
}

export function TripRevenueSplitCancelDialog({
  open,
  onOpenChange,
  isPending,
  onConfirm,
}: TripRevenueSplitCancelDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{splitCopy.cancelConfirmTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {splitCopy.cancelConfirmDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {splitCopy.cancelConfirmDismiss}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {splitCopy.cancelConfirmAction}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
