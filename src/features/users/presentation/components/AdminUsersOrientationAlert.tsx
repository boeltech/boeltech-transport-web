/**
 * Alert L1a del Administrador: staff / portal cliente / portal conductor.
 * Dismiss = localStorage, semántica collapsed = "true".
 * No reutiliza Alerts de hermanos. Sin «eres superusuario».
 */

import { useState } from "react";
import { Users } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";

import { usersCopy } from "../copy/usersCopy";

const copy = usersCopy.adminOrientation;

export const ADMIN_USERS_ORIENTATION_STORAGE_KEY =
  "users.admin-orientation.collapsed";

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

export function AdminUsersOrientationAlert({
  storageKey = ADMIN_USERS_ORIENTATION_STORAGE_KEY,
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
      <Users className="h-4 w-4" />
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
