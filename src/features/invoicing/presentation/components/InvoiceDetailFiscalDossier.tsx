import { useState } from "react";
import { ChevronDown, FolderOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { cn } from "@shared/lib/utils/cn";
import type { Invoice } from "@features/invoicing/domain";
import { formatDateTime } from "@shared/utils/dateUtils";
import { invoicingCopy } from "../copy/invoicingCopy";
import { InvoiceDetailFiscalDossierBody } from "./InvoiceDetailFiscalLabels";

const copy = invoicingCopy.detail;

export interface InvoiceDetailFiscalDossierProps {
  invoice: Invoice;
  /** Portal client: colapsado y copy sin jerga primaria. */
  isClientPortal?: boolean;
}

/**
 * Banda 3 — Expediente fiscal.
 * Abierto en borrador; colapsado cuando ya está sellada / en cancelación.
 * En portal client siempre inicia colapsado.
 */
export function InvoiceDetailFiscalDossier({
  invoice,
  isClientPortal = false,
}: InvoiceDetailFiscalDossierProps) {
  const defaultOpen = isClientPortal ? false : invoice.status === "draft";
  const [open, setOpen] = useState(defaultOpen);

  const showCancellation =
    invoice.status === "cancelled" ||
    invoice.status === "cancellation_pending";

  const title = isClientPortal
    ? copy.section.fiscalDossierClient
    : copy.section.fiscalDossier;
  const hint = isClientPortal
    ? copy.section.fiscalDossierHintClient
    : copy.section.fiscalDossierHint;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={cn(showCancellation && "border-destructive/40")}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-start justify-between gap-3 text-left"
            >
              <div className="min-w-0 space-y-1">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FolderOpen
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden
                  />
                  {title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {hint}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  open && "rotate-180",
                )}
                aria-hidden
              />
            </button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            <InvoiceDetailFiscalDossierBody invoice={invoice} />

            {showCancellation ? (
              <section className="space-y-2 rounded-md border border-destructive/30 bg-destructive-soft/40 p-3 text-sm">
                <h3 className="font-medium text-destructive">
                  {invoice.status === "cancellation_pending"
                    ? copy.section.cancellationPending
                    : copy.section.cancellation}
                </h3>
                {invoice.status === "cancellation_pending" ? (
                  <p>
                    <span className="text-muted-foreground">
                      {copy.label.satStatus}:{" "}
                    </span>
                    {invoice.satCancellationMessage ??
                      copy.hint.cancellationPendingSat}
                  </p>
                ) : null}
                <p>
                  <span className="text-muted-foreground">{copy.label.date}: </span>
                  {formatDateTime(
                    invoice.status === "cancellation_pending"
                      ? invoice.satCancellationUpdatedAt
                      : invoice.cancelledAt,
                  )}
                </p>
                {invoice.cancellationCode ? (
                  <p>
                    <span className="text-muted-foreground">
                      {copy.label.satReason}:{" "}
                    </span>
                    {invoice.cancellationCode}
                  </p>
                ) : null}
                {invoice.cancellationReason ? (
                  <p>
                    <span className="text-muted-foreground">
                      {copy.label.description}:{" "}
                    </span>
                    {invoice.cancellationReason}
                  </p>
                ) : null}
                {invoice.replacementCfdiUuid ? (
                  <p>
                    <span className="text-muted-foreground">
                      {copy.label.substitutionUuid}:{" "}
                    </span>
                    <span className="font-mono text-xs">
                      {invoice.replacementCfdiUuid}
                    </span>
                  </p>
                ) : null}
              </section>
            ) : null}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
