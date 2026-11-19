/**
 * Tip dismissible «Siguiente paso» (correo) en detalle de factura.
 * Dismiss = localStorage por factura (collapsed = "true"), espejo de
 * InvoiceFilesReadyAlert. CTA Enviar abre el mismo overlay que el header.
 */

import { useEffect, useState } from "react";
import { Receipt } from "lucide-react";

import { Button } from "@shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";

import { invoicingCopy } from "../copy/invoicingCopy";

const hint = invoicingCopy.detail.hint;
const actions = invoicingCopy.detail.actions;

export const INVOICE_FOLLOW_THROUGH_STORAGE_KEY_PREFIX =
  "invoicing.detail.follow-through.";

export function getInvoiceFollowThroughStorageKey(invoiceId: string): string {
  return `${INVOICE_FOLLOW_THROUGH_STORAGE_KEY_PREFIX}${invoiceId}.collapsed`;
}

export function readInvoiceFollowThroughCollapsed(storageKey: string): boolean {
  try {
    return window.localStorage.getItem(storageKey) === "true";
  } catch {
    return false;
  }
}

function writeCollapsed(storageKey: string): void {
  try {
    window.localStorage.setItem(storageKey, "true");
  } catch {
    // ignore quota / private mode
  }
}

export function InvoiceFollowThroughAlert({
  invoiceId,
  storageKey,
  onSend,
  onDismissed,
}: {
  invoiceId: string;
  /** Override for tests. */
  storageKey?: string;
  onSend: () => void;
  onDismissed?: () => void;
}) {
  const resolvedKey =
    storageKey ?? getInvoiceFollowThroughStorageKey(invoiceId);
  const [collapsed, setCollapsed] = useState(() =>
    readInvoiceFollowThroughCollapsed(resolvedKey),
  );

  useEffect(() => {
    setCollapsed(readInvoiceFollowThroughCollapsed(resolvedKey));
  }, [resolvedKey]);

  if (collapsed) return null;

  const dismiss = () => {
    writeCollapsed(resolvedKey);
    setCollapsed(true);
    onDismissed?.();
  };

  return (
    <DetailAlertCard
      severity="info"
      icon={<Receipt className="h-5 w-5" />}
      title={hint.followThroughTitle}
      action={
        <>
          <Button type="button" size="sm" variant="outline" onClick={onSend}>
            {actions.sendByEmail}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={dismiss}>
            {hint.followThroughDismiss}
          </Button>
        </>
      }
    >
      <p>{hint.followThroughSend}</p>
    </DetailAlertCard>
  );
}
