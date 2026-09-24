import type { InvoiceSendRecipients } from "@features/invoicing/domain";

/** Default del paso Personas / diálogo unitario: todos los elegibles marcados. */
export function defaultSelectedRecipientKeys(
  payload: InvoiceSendRecipients,
): string[] {
  return payload.recipients.map((recipient) => recipient.key);
}

/** undefined = todos los elegibles (contrato API). */
export function buildSendRecipientKeys(
  payload: InvoiceSendRecipients,
  selected: string[],
): string[] | undefined {
  const eligible = payload.recipients.map((recipient) => recipient.key);
  if (
    selected.length === eligible.length &&
    eligible.every((key) => selected.includes(key))
  ) {
    return undefined;
  }
  return selected;
}

export function toggleRecipientKey(
  selected: string[],
  key: string,
  checked: boolean,
): string[] {
  if (checked) {
    return selected.includes(key) ? selected : [...selected, key];
  }
  return selected.filter((item) => item !== key);
}
