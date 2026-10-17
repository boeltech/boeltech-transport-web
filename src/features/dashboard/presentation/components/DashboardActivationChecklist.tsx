/**
 * Checklist de activación del tenant en Inicio (F1).
 * F2: bloque opt-in de datos de ejemplo cuando seedAvailable.
 * Dismiss = localStorage por tenant+user (no endpoint).
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, ListChecks } from "lucide-react";

import { useAuth } from "@/features/auth";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";

import { useDashboardActivation } from "../../application/hooks/useDashboardActivation";
import {
  filterActivationItemsForMode,
  hasPendingItemsForMode,
  resolveActivationChecklistMode,
  type ActivationChecklistMode,
} from "../../domain/activation";
import type { ActivationItem, ActivationItemCode } from "../../domain/types";
import { dashboardCopy } from "../copy/dashboardCopy";
import { DemoSeedLoadSheet } from "./DemoSeedLoadSheet";

const copy = dashboardCopy.activation;
const demoCopy = dashboardCopy.demoSeed;

export const DASHBOARD_ACTIVATION_STORAGE_KEY_PREFIX =
  "dashboard.activation-checklist.";

export const DASHBOARD_SEED_OFFER_STORAGE_KEY_PREFIX =
  "dashboard.activation-seed-offer.";

export function getDashboardActivationStorageKey(
  tenantId: string,
  userId: string,
): string {
  return `${DASHBOARD_ACTIVATION_STORAGE_KEY_PREFIX}${tenantId}.${userId}.dismissed`;
}

export function getDashboardSeedOfferStorageKey(
  tenantId: string,
  userId: string,
): string {
  return `${DASHBOARD_SEED_OFFER_STORAGE_KEY_PREFIX}${tenantId}.${userId}.dismissed`;
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

function itemLabel(code: ActivationItemCode): string {
  return copy.itemLabels[code] ?? code;
}

function itemCtaLabel(code: ActivationItemCode): string {
  return copy.ctaLabels[code] ?? itemLabel(code);
}

function titleForMode(mode: ActivationChecklistMode): string {
  if (mode === "dispatcher_compact") return copy.titleDispatcher;
  if (mode === "accountant_fiscal") return copy.titleAccountant;
  return copy.title;
}

function descriptionForMode(
  mode: ActivationChecklistMode,
  opsLevel: string,
): string {
  if (mode === "dispatcher_compact") {
    return opsLevel === "empty"
      ? copy.descriptionDispatcherEmpty
      : copy.descriptionDispatcherReady;
  }
  if (mode === "accountant_fiscal") return copy.descriptionAccountant;
  return copy.description;
}

function ActivationItemRow({ item }: { item: ActivationItem }) {
  const done = item.status === "done";
  const label = itemLabel(item.code);

  return (
    <li className="flex items-start gap-2 text-sm">
      {done ? (
        <CheckCircle2
          className="mt-0.5 h-4 w-4 shrink-0 text-success"
          aria-hidden
        />
      ) : (
        <Circle
          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
      )}
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={done ? "text-muted-foreground line-through" : ""}>
            {label}
          </span>
          <Badge variant={done ? "secondary" : "outline"} className="text-xs">
            {done ? copy.doneBadge : copy.pendingBadge}
          </Badge>
        </div>
        {!done && item.canAct ? (
          <Link
            to={item.ctaPath}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {itemCtaLabel(item.code)}
          </Link>
        ) : null}
        {!done && !item.canAct ? (
          <p className="text-xs text-muted-foreground">
            {item.requiredForOps
              ? "Pendiente de administración."
              : "Sin permiso para completar este paso."}
          </p>
        ) : null}
      </div>
    </li>
  );
}

export function DashboardActivationChecklist({
  storageKey: storageKeyProp,
}: {
  storageKey?: string;
}) {
  const { user, isAuthenticated } = useAuth();
  const mode = resolveActivationChecklistMode(user?.role);
  const tenantId = user?.tenant?.id ?? "";
  const userId = user?.id ?? "";
  const resolvedKey =
    storageKeyProp ??
    (tenantId && userId
      ? getDashboardActivationStorageKey(tenantId, userId)
      : "");
  const seedOfferKey =
    tenantId && userId ? getDashboardSeedOfferStorageKey(tenantId, userId) : "";

  const [dismissed, setDismissed] = useState(() =>
    resolvedKey ? readDismissed(resolvedKey) : false,
  );
  const [seedOfferDismissed, setSeedOfferDismissed] = useState(() =>
    seedOfferKey ? readDismissed(seedOfferKey) : false,
  );
  const [seedSheetOpen, setSeedSheetOpen] = useState(false);

  const { data, isLoading, isError } = useDashboardActivation({
    enabled: Boolean(mode) && isAuthenticated && !dismissed,
  });

  if (!mode || dismissed) return null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) return null;
  if (!hasPendingItemsForMode(data, mode)) return null;

  const items = filterActivationItemsForMode(data.items, mode);
  const visibleItems =
    mode === "dispatcher_compact"
      ? items.filter((i) => i.status === "pending" || i.requiredForOps)
      : items;

  const showSeedOffer = data.demo.seedAvailable && !seedOfferDismissed;

  const dismiss = () => {
    if (resolvedKey) writeDismissed(resolvedKey);
    setDismissed(true);
  };

  const dismissSeedOffer = () => {
    if (seedOfferKey) writeDismissed(seedOfferKey);
    setSeedOfferDismissed(true);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ListChecks className="h-4 w-4 text-muted-foreground" aria-hidden />
          {titleForMode(mode)}
        </CardTitle>
        <CardDescription>
          {descriptionForMode(mode, data.opsLevel)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showSeedOffer ? (
          <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-sm font-medium text-foreground">
              {demoCopy.offerTitle}
            </p>
            <p className="text-xs text-muted-foreground">{demoCopy.offerBody}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                onClick={() => setSeedSheetOpen(true)}
              >
                {demoCopy.loadCta}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={dismissSeedOffer}
              >
                {demoCopy.startCleanCta}
              </Button>
            </div>
          </div>
        ) : null}
        {mode === "dispatcher_compact" && data.opsLevel === "empty" ? null : (
          <ul className="space-y-3">
            {visibleItems.map((item) => (
              <ActivationItemRow key={item.code} item={item} />
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={dismiss}>
            {copy.dismiss}
          </Button>
        </div>
      </CardContent>
      {showSeedOffer ? (
        <DemoSeedLoadSheet
          open={seedSheetOpen}
          onOpenChange={setSeedSheetOpen}
        />
      ) : null}
    </Card>
  );
}
