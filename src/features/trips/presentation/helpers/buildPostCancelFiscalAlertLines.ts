import type { TripFiscalActionRequired } from "@features/trips/domain";
import { getTripInvoiceStatusLabel } from "../utils/tripListFilterUtils";
import { tripDetailCopy } from "../copy";

const shell = tripDetailCopy.shell;

export function buildPostCancelFiscalAlertLines(
  fiscal: TripFiscalActionRequired,
): string[] {
  const lines: string[] = [];
  if (fiscal.suggestedActions?.length) {
    lines.push(...fiscal.suggestedActions);
  }
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
