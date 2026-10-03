import { ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { approvalPoliciesCopy } from "../copy/approvalPoliciesCopy";

/** Piso ADR-0098: no configurable, siempre visible (ADR-0099 D5 / UX4). */
export function SelfApprovalFloorNote({ className }: { className?: string }) {
  return (
    <Alert variant="info" className={className}>
      <ShieldCheck className="h-4 w-4" />
      <AlertTitle>{approvalPoliciesCopy.floorNote.title}</AlertTitle>
      <AlertDescription>{approvalPoliciesCopy.floorNote.text}</AlertDescription>
    </Alert>
  );
}
