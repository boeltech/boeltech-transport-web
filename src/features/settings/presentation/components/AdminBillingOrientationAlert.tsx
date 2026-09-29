/**
 * Alert L1b del Administrador: sello + numeración.
 * Dismiss = localStorage, semántica collapsed = "true".
 * Link a General solo si falta identidad. Sin PAC/esquemas/Stripe.
 */

import { useState } from "react";
import { FileKey } from "lucide-react";
import { Link } from "react-router-dom";

import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";

import { billingSettingsCopy } from "../copy/billingSettingsCopy";

const copy = billingSettingsCopy.adminOrientation;

export const ADMIN_BILLING_ORIENTATION_STORAGE_KEY =
  "settings.admin-billing-orientation.collapsed";

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

export function AdminBillingOrientationAlert({
  storageKey = ADMIN_BILLING_ORIENTATION_STORAGE_KEY,
  identityMissing = false,
}: {
  storageKey?: string;
  identityMissing?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(() => readCollapsed(storageKey));

  if (collapsed) return null;

  const dismiss = () => {
    writeCollapsed(storageKey);
    setCollapsed(true);
  };

  return (
    <Alert variant="info">
      <FileKey className="h-4 w-4" />
      <AlertTitle>{copy.title}</AlertTitle>
      <AlertDescription>
        <p>{copy.body}</p>
        {identityMissing ? (
          <p className="mt-2">
            {copy.identityMissing}{" "}
            <Link
              to="/settings/general"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {copy.identityLink}
            </Link>
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={dismiss}>
            {copy.dismiss}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
