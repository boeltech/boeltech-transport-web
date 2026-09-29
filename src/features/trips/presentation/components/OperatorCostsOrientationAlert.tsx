/**
 * Alert L1 del Operador: dónde cargar gastos (viaje → Costos → Agregar).
 * Dismiss = localStorage, semántica collapsed = "true".
 * No reutiliza strip de patio ni Alerts de accountant/manager.
 */

import { useState } from "react";
import { Wallet } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";

import { tripsListCopy } from "../copy/listCopy";

const copy = tripsListCopy.operatorOrientation;

export const OPERATOR_COSTS_ORIENTATION_STORAGE_KEY =
  "trips.operator-costs-orientation.collapsed";

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

export function OperatorCostsOrientationAlert({
  storageKey = OPERATOR_COSTS_ORIENTATION_STORAGE_KEY,
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
      <Wallet className="h-4 w-4" />
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
