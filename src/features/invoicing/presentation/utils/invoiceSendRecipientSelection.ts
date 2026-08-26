import type { InvoiceSendRecipients } from "@features/invoicing/domain";
import type { RecipientsByClient } from "@features/finance/domain/billingDispatchRun.types";
import {
  countSelectedRecipients,
  defaultRecipientSelection,
  toggleRecipientKey,
} from "@features/finance/presentation/utils/dispatchRunRecipientSelection";

export { countSelectedRecipients, defaultRecipientSelection, toggleRecipientKey };

export function toRecipientGroups(
  payload: InvoiceSendRecipients,
): RecipientsByClient[] {
  return [
    {
      clientId: payload.clientId,
      clientName: payload.clientName,
      recipients: payload.recipients.map((recipient) => ({
        key: recipient.key,
        kind: recipient.kind,
        contactId: recipient.contactId,
        label: recipient.label,
        email: recipient.email,
      })),
    },
  ];
}

/** undefined = todos los elegibles (contrato API). */
export function buildSendRecipientKeys(
  payload: InvoiceSendRecipients,
  selection: Record<string, string[]>,
): string[] | undefined {
  const group = toRecipientGroups(payload)[0];
  if (!group) return undefined;
  const selected = selection[group.clientId] ?? [];
  const eligible = group.recipients.map((recipient) => recipient.key);
  if (
    selected.length === eligible.length &&
    eligible.every((key) => selected.includes(key))
  ) {
    return undefined;
  }
  return selected;
}
