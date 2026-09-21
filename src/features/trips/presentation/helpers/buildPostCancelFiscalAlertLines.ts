import type { TripFiscalActionRequired } from "@features/trips/domain";
import { getTripInvoiceStatusLabel } from "../utils/tripListFilterUtils";
import { tripDetailCopy } from "../copy";

const shell = tripDetailCopy.shell;

/**
 * Líneas del alert efímero post-cancel.
 * Copy humano fijo desde shellCopy — no volcar codes API
 * (`request_cancellation`, `keep_cfdi`, etc.).
 */
export function buildPostCancelFiscalAlertLines(
  fiscal: TripFiscalActionRequired,
): string[] {
  const lines: string[] = [shell.alert.postCancelFiscalActionLine];
  lines.push(
    shell.alert.postCancelFiscalInvoiceStatus(
      getTripInvoiceStatusLabel(fiscal.invoiceStatus),
    ),
  );
  const invoiceRef = fiscal.cfdiUuid ?? fiscal.invoiceId;
  if (invoiceRef) {
    lines.push(shell.alert.postCancelFiscalInvoiceRef(invoiceRef));
  }
  return lines;
}
