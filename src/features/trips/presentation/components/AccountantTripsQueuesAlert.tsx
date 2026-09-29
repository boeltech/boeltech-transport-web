/**
 * Alert L1b del Contador: dos colas (esta lista ≠ Por facturar).
 * Dismiss = localStorage, semántica collapsed = "true".
 * No es el strip de 4 pasos del despachador.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { Receipt } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";

import { tripsListCopy } from "../copy/listCopy";

const copy = tripsListCopy.accountantOrientation;

export const ACCOUNTANT_TRIPS_QUEUES_STORAGE_KEY =
  "trips.accountant-fiscal-queues.collapsed";

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

export function AccountantTripsQueuesAlert({
  storageKey = ACCOUNTANT_TRIPS_QUEUES_STORAGE_KEY,
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
            <Link to="/finance/invoiceable">{copy.invoiceableLink}</Link>
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={dismiss}>
            {copy.dismiss}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
