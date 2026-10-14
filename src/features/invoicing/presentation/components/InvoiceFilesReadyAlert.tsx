/**
 * Banner «Archivos listos para descargar» en detalle de factura.
 * Dismiss = localStorage por factura (collapsed = "true").
 * CTA de dismiss en DetailAlertCard.action (D5).
 */

import { useEffect, useState } from "react";
import { FileDown } from "lucide-react";

import { Button } from "@shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";

import { invoicingCopy } from "../copy/invoicingCopy";

const copy = invoicingCopy.detail.hint;

export const INVOICE_FILES_READY_STORAGE_KEY_PREFIX =
  "invoicing.detail.files-ready.";

export function getInvoiceFilesReadyStorageKey(invoiceId: string): string {
  return `${INVOICE_FILES_READY_STORAGE_KEY_PREFIX}${invoiceId}.collapsed`;
}

export function readInvoiceFilesReadyCollapsed(storageKey: string): boolean {
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

export function InvoiceFilesReadyAlert({
  invoiceId,
  storageKey,
  onDismissed,
}: {
  invoiceId: string;
  /** Override for tests. */
  storageKey?: string;
  onDismissed?: () => void;
}) {
  const resolvedKey =
    storageKey ?? getInvoiceFilesReadyStorageKey(invoiceId);
  const [collapsed, setCollapsed] = useState(() =>
    readInvoiceFilesReadyCollapsed(resolvedKey),
  );

  useEffect(() => {
    setCollapsed(readInvoiceFilesReadyCollapsed(resolvedKey));
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
      icon={<FileDown className="h-5 w-5" />}
      title={copy.filesAlertTitle}
      action={
        <Button type="button" variant="outline" size="sm" onClick={dismiss}>
          {copy.filesAlertDismiss}
        </Button>
      }
    >
      <p>{copy.filesAlertDescription}</p>
    </DetailAlertCard>
  );
}
