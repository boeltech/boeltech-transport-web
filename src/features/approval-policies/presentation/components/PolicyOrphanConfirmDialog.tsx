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
import { isApprovalConcept } from "../../domain";
import type { PolicyOrphanDialogState } from "../../application";
import { APPROVAL_CONCEPT_LABELS, approvalPoliciesCopy } from "../copy/approvalPoliciesCopy";

const copy = approvalPoliciesCopy.orphan;

/**
 * Confirmación del 409 `APPROVAL_POLICY_ORPHAN_GUARD` (ADR-0099 D12):
 * lista los pasos que quedarían sin firmante antes de reenviar.
 */
export function PolicyOrphanConfirmDialog({
  open,
  message,
  violations,
  onConfirm,
  onCancel,
  pending = false,
}: PolicyOrphanDialogState & { pending?: boolean }) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => (!next ? onCancel() : undefined)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>{message ?? copy.description}</AlertDialogDescription>
        </AlertDialogHeader>
        {violations.length > 0 ? (
          <ul className="space-y-1 text-sm" aria-label={copy.title}>
            {violations.map((violation) => {
              const concept = isApprovalConcept(violation.concept)
                ? APPROVAL_CONCEPT_LABELS[violation.concept]
                : violation.concept;
              const reason =
                violation.reason === "double_sign_needs_two_people"
                  ? copy.reasonDoubleSign
                  : copy.reasonNoEligible;
              return (
                <li
                  key={`${violation.concept}-${violation.tierIndex}-${violation.stepNo}`}
                  className="rounded-md border bg-muted/40 px-3 py-2"
                >
                  <span className="font-medium">
                    {copy.line(concept, violation.tierIndex + 1, violation.stepNo)}
                  </span>
                  <span className="text-muted-foreground">: {reason}</span>
                </li>
              );
            })}
          </ul>
        ) : null}
        {message ? <p className="text-sm text-muted-foreground">{copy.description}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{copy.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={pending}>
            {copy.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
