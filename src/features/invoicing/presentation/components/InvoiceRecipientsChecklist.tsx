import { Checkbox } from "@shared/ui/checkbox";
import { Label } from "@shared/ui/label";
import type { InvoiceSendRecipient } from "@features/invoicing/domain";

/**
 * Checklist liviano de destinatarios (billing_email + contactos receives_invoices).
 * Compartido por el wizard de envío y el atajo unitario del detalle.
 */
export function InvoiceRecipientsChecklist({
  recipients,
  selectedKeys,
  disabled,
  onToggle,
  idPrefix = "send-recipient",
}: {
  recipients: InvoiceSendRecipient[];
  selectedKeys: string[];
  disabled?: boolean;
  onToggle: (key: string, checked: boolean) => void;
  /** Prefijo de id DOM para evitar colisiones si hay dos checklists en pantalla. */
  idPrefix?: string;
}) {
  const selected = new Set(selectedKeys);
  return (
    <ul className="space-y-0.5 border-t pt-3">
      {recipients.map((recipient) => {
        const id = `${idPrefix}-${recipient.key.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
        return (
          <li key={recipient.key} className="flex items-start gap-2 py-1">
            <Checkbox
              id={id}
              checked={selected.has(recipient.key)}
              disabled={disabled}
              onCheckedChange={(value) =>
                onToggle(recipient.key, value === true)
              }
              className="mt-0.5"
            />
            <Label htmlFor={id} className="cursor-pointer font-normal">
              <span className="text-sm text-foreground">{recipient.label}</span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {recipient.email}
              </span>
            </Label>
          </li>
        );
      })}
    </ul>
  );
}
