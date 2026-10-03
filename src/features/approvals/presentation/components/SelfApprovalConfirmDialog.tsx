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
import {
  approvalsCopy,
  type SelfApprovalSubject,
} from "../copy/approvalsCopy";

const copy = approvalsCopy.selfApproval;

export interface SelfApprovalConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: SelfApprovalSubject;
  onConfirm: () => void;
  isPending?: boolean;
}

/** ADR-0098 UX1: confirmación explícita antes de autorizar lo propio. */
export function SelfApprovalConfirmDialog({
  open,
  onOpenChange,
  subject,
  onConfirm,
  isPending = false,
}: SelfApprovalConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {/* Evita que el clic burbujee a filas clicables de tablas (portal React). */}
      <AlertDialogContent onClick={(event) => event.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.confirmTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {copy.confirmBody(subject)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{copy.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {copy.confirmAction}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
