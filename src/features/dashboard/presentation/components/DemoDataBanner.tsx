/**
 * Banner global dismissible mientras el tenant tiene datos de ejemplo (F2).
 */

import { useState } from "react";
import { FlaskConical, X } from "lucide-react";

import { useAuth } from "@/features/auth";
import { AlertWithIcon } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";

import { useDashboardActivation } from "../../application/hooks/useDashboardActivation";
import { dashboardCopy } from "../copy/dashboardCopy";
import { DemoPurgeConfirmSheet } from "./DemoPurgeConfirmSheet";

const copy = dashboardCopy.demoSeed;

export const DEMO_DATA_BANNER_STORAGE_KEY_PREFIX = "dashboard.demo-data-banner.";

export function getDemoDataBannerStorageKey(
  tenantId: string,
  userId: string,
): string {
  return `${DEMO_DATA_BANNER_STORAGE_KEY_PREFIX}${tenantId}.${userId}.dismissed`;
}

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

export function clearDemoDataBannerDismissed(storageKey: string): void {
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // ignore
  }
}

export function DemoDataBanner({
  storageKey: storageKeyProp,
}: {
  storageKey?: string;
} = {}) {
  const { user, isAuthenticated } = useAuth();
  const tenantId = user?.tenant?.id ?? "";
  const userId = user?.id ?? "";
  const resolvedKey =
    storageKeyProp ??
    (tenantId && userId ? getDemoDataBannerStorageKey(tenantId, userId) : "");

  /** Bump to re-read localStorage after dismiss (seed clear also refreshes via query). */
  const [, setDismissEpoch] = useState(0);
  const dismissed = Boolean(resolvedKey) && readDismissed(resolvedKey);
  const [purgeOpen, setPurgeOpen] = useState(false);

  const { data, isLoading, isError } = useDashboardActivation({
    enabled: isAuthenticated && Boolean(resolvedKey),
  });

  if (!isAuthenticated || dismissed || isLoading || isError || !data) {
    return null;
  }

  if (!data.demo.hasDemoData) return null;

  const dismiss = () => {
    if (resolvedKey) writeDismissed(resolvedKey);
    setDismissEpoch((n) => n + 1);
  };

  return (
    <div className="mb-4">
      <AlertWithIcon variant="warning" title={copy.bannerTitle}>
        <div className="space-y-2 text-sm">
          <p>{copy.bannerBody}</p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {data.demo.purgeAllowed ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setPurgeOpen(true)}
              >
                <FlaskConical className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                {copy.purgeCta}
              </Button>
            ) : null}
            <Button type="button" size="sm" variant="ghost" onClick={dismiss}>
              <X className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              {copy.bannerDismiss}
            </Button>
          </div>
        </div>
      </AlertWithIcon>
      {data.demo.purgeAllowed ? (
        <DemoPurgeConfirmSheet open={purgeOpen} onOpenChange={setPurgeOpen} />
      ) : null}
    </div>
  );
}
