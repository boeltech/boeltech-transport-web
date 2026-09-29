/**
 * Strip L1 del job del Despachador (D4–D5).
 * Dismiss = localStorage, semántica HubGuidePanel (collapsed = "true").
 */

import { useState } from "react";
import { Route } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";

import { tripsListCopy } from "../copy/listCopy";

const copy = tripsListCopy.orientation;

export const DISPATCHER_ORIENTATION_STRIP_STORAGE_KEY =
  "trips.dispatcher-orientation-strip.collapsed";

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

export function DispatcherOrientationStrip({
  storageKey = DISPATCHER_ORIENTATION_STRIP_STORAGE_KEY,
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
      <Route className="h-4 w-4" />
      <AlertTitle>{copy.title}</AlertTitle>
      <AlertDescription>
        <ol className="mt-1 list-decimal space-y-0.5 pl-4">
          {copy.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={dismiss}
        >
          {copy.dismiss}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
