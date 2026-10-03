import type { ApprovableItem, ApprovableType } from "../../domain";
import { DecisionReasonSheet } from "./DecisionReasonSheet";

export interface RejectExpenseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ApprovableItem | null;
  bulkItems?: ApprovableItem[];
  isSubmitting?: boolean;
  onSubmit: (reason: string, items: ApprovableItem[]) => void;
  type?: ApprovableType;
}

/** Rechazo terminal; envoltorio de `DecisionReasonSheet` para consumidores previos (Costos). */
export function RejectExpenseSheet({ onSubmit, ...props }: RejectExpenseSheetProps) {
  return (
    <DecisionReasonSheet
      {...props}
      mode="reject"
      onSubmit={(input, items) => onSubmit(input.reason, items)}
    />
  );
}
