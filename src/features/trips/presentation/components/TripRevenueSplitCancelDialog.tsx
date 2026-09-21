/**
 * Confirmación de cancelación del prorrateo (ADR-0081 sheet).
 * Modo `escape`: cierre manual cuando el auto-close C7 no corrió (race/bug).
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

export type TripRevenueSplitCancelDialogMode = "default" | "escape";

export interface TripRevenueSplitCancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onConfirm: () => void;
  mode?: TripRevenueSplitCancelDialogMode;
}

export function TripRevenueSplitCancelDialog({
  open,
  onOpenChange,
  isPending,
  onConfirm,
  mode = "default",
}: TripRevenueSplitCancelDialogProps) {
  const isEscape = mode === "escape";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isEscape
              ? splitCopy.escapeCancelConfirmTitle
              : splitCopy.cancelConfirmTitle}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isEscape
              ? splitCopy.escapeCancelConfirmDescription
              : splitCopy.cancelConfirmDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {isEscape
              ? splitCopy.escapeCancelConfirmDismiss
              : splitCopy.cancelConfirmDismiss}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isEscape
              ? splitCopy.escapeCancelConfirmAction
              : splitCopy.cancelConfirmAction}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
