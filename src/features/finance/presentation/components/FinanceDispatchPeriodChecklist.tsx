/**
 * Checklist Operate de 3 pasos para Correo del periodo (dismiss = localStorage).
 */

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";

const copy = dispatchRunsCopy.tab.checklist;

export const DISPATCH_PERIOD_CHECKLIST_STORAGE_KEY =
  "finance.dispatch-period-checklist.dismissed";

function readDismissed(storageKey: string): boolean {
  try {
    return window.localStorage.getItem(storageKey) === "true";
  } catch {
    return false;
  }
}

function writeDismissed(storageKey: string): void {
  try {
    window.localStorage.setItem(storageKey, "true");
  } catch {
    // ignore quota / private mode
  }
}

export function FinanceDispatchPeriodChecklist({
  storageKey = DISPATCH_PERIOD_CHECKLIST_STORAGE_KEY,
}: {
  storageKey?: string;
}) {
  const [dismissed, setDismissed] = useState(() => readDismissed(storageKey));

  if (dismissed) return null;

  const dismiss = () => {
    writeDismissed(storageKey);
    setDismissed(true);
  };

  return (
    <Alert variant="info">
      <AlertTitle>{copy.title}</AlertTitle>
      <AlertDescription>
        <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">
          {copy.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <div className="mt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={dismiss}
            aria-label={copy.dismissAriaLabel}
          >
            {copy.dismiss}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
