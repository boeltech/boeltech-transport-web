import { Checkbox } from "@shared/ui/checkbox";
import { Label } from "@shared/ui/label";
import { FieldInlineError, getFieldErrorAriaProps } from "@shared/ui/form";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { settlementsCopy } from "../copy/settlementsCopy";

const gateCopy = settlementsCopy.createPage.reimbursementsAckGate;

export interface ReimbursementsAckGateProps {
  /** Subtotal de reembolsos; si ≤ 0 el gate no se renderiza. */
  amount: number;
  acknowledged: boolean;
  onAcknowledgedChange: (value: boolean) => void;
  errorMessage?: string | null;
  checkboxId?: string;
}

/** Confirmación local del subtotal de reembolsos antes de enviar a autorización (F3; sin campo API). */
export function ReimbursementsAckGate({
  amount,
  acknowledged,
  onAcknowledgedChange,
  errorMessage,
  checkboxId = "acknowledge-reimbursements-submit",
}: ReimbursementsAckGateProps) {
  if (!(amount > 0)) return null;

  const amountLabel = formatMxCurrency(amount);

  return (
    <div
      className="rounded-lg border border-warning/30 bg-warning-soft/40 p-3 space-y-2"
      data-testid="reimbursements-ack-gate"
    >
      <p className="text-xs font-medium text-foreground">{gateCopy.alertTitle}</p>
      <p className="text-xs text-muted-foreground leading-snug">
        {gateCopy.alertDescription(amountLabel)}
      </p>
      <div className="flex items-start gap-2 pt-1">
        <Checkbox
          id={checkboxId}
          checked={acknowledged}
          onCheckedChange={(checked) => onAcknowledgedChange(checked === true)}
          {...getFieldErrorAriaProps(checkboxId, errorMessage ?? undefined)}
        />
        <Label
          htmlFor={checkboxId}
          className="text-xs font-normal leading-snug cursor-pointer"
        >
          {gateCopy.ackLabel(amountLabel)}
        </Label>
      </div>
      <FieldInlineError fieldId={checkboxId} message={errorMessage ?? undefined} />
    </div>
  );
}
