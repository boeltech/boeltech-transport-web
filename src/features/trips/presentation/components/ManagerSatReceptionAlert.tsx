/**
 * Alert L1a del Gerente: recepción del trámite SAT (cancelar / sustituir).
 * Dismiss = localStorage, semántica collapsed = "true".
 * No reutiliza el Alert del accountant ni el strip de 4 pasos.
 */

import { useState } from "react";
import { FilePenLine } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";

import { tripsListCopy } from "../copy/listCopy";

const copy = tripsListCopy.managerOrientation;

export const MANAGER_SAT_RECEPTION_STORAGE_KEY =
  "trips.manager-sat-reception.collapsed";

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

export function ManagerSatReceptionAlert({
  storageKey = MANAGER_SAT_RECEPTION_STORAGE_KEY,
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
      <FilePenLine className="h-4 w-4" />
      <AlertTitle>{copy.title}</AlertTitle>
      <AlertDescription>
        <p>{copy.body}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={dismiss}>
            {copy.dismiss}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
