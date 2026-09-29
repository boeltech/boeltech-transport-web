/**
 * Alert L1a del Contador: dos colas (Por facturar ≠ Atención fiscal).
 * Dismiss = localStorage, semántica collapsed = "true".
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { Receipt } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";

import { financeCopy } from "../copy";

const copy = financeCopy.invoiceable.queuesAlert;

export const ACCOUNTANT_INVOICEABLE_QUEUES_STORAGE_KEY =
  "finance.accountant-invoiceable-queues.collapsed";

function readCollapsed(storageKey: string): boolean {
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

export function AccountantInvoiceableQueuesAlert({
  storageKey = ACCOUNTANT_INVOICEABLE_QUEUES_STORAGE_KEY,
}: {
  storageKey?: string;
}) {
  const [collapsed, setCollapsed] = useState(() => readCollapsed(storageKey));

  if (collapsed) return null;

  const dismiss = () => {
    writeCollapsed(storageKey);
    setCollapsed(true);
  };

  return (
    <Alert variant="info">
      <Receipt className="h-4 w-4" />
      <AlertTitle>{copy.title}</AlertTitle>
      <AlertDescription>
        <p>{copy.body}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/trips?fiscalAttention=1">{copy.fiscalAttentionLink}</Link>
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={dismiss}>
            {copy.dismiss}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
