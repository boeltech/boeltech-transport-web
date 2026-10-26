/**
 * Checklist de activación del tenant en Inicio (F1).
 * F2: bloque opt-in de datos de ejemplo cuando seedAvailable.
 * F3: éxito primer viaje (admin/manager), mid-setup dispatcher, pista fiscal accountant.
 * Dismiss = localStorage por tenant+user (no endpoint).
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  ListChecks,
  PartyPopper,
} from "lucide-react";

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
import { DetailAlertCard } from "@shared/ui/data-display";
import { Skeleton } from "@shared/ui/skeleton";

import { useDashboardActivation } from "../../application/hooks/useDashboardActivation";
import {
  filterActivationItemsForMode,
  findPendingSoftTrackItems,
  isOpsReadyForFiscalTrack,
  resolvePreferredFiscalItem,
  resolveActivationChecklistMode,
  shouldShowActivationChecklist,
  type ActivationChecklistMode,
} from "../../domain/activation";
import { trackActivationEvent } from "../../domain/trackActivationEvent";
import type {
  ActivationData,
  ActivationItem,
  ActivationItemCode,
  ActivationOpsLevel,
  ActivationReadyHint,
} from "../../domain/types";
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

function titleForMode(
  mode: ActivationChecklistMode,
  opsLevel: ActivationOpsLevel,
): string {
  if (mode === "full" && opsLevel === "l1_complete") return copy.successTitle;
  if (mode === "dispatcher_compact") return copy.titleDispatcher;
  if (mode === "accountant_fiscal") return copy.titleAccountant;
  return copy.title;
}

function descriptionForMode(
  mode: ActivationChecklistMode,
  opsLevel: ActivationOpsLevel,
  readyHint: ActivationReadyHint,
): string {
  if (mode === "dispatcher_compact") {
    if (opsLevel === "empty") return copy.descriptionDispatcherEmpty;
    if (opsLevel === "l1_complete") return copy.descriptionDispatcherComplete;
    return copy.descriptionDispatcherReady;
  }
  if (mode === "accountant_fiscal") {
    if (isOpsReadyForFiscalTrack(opsLevel) && readyHint !== "configured") {
      return copy.descriptionAccountantOpsReady;
    }
    return copy.descriptionAccountant;
  }
  if (mode === "full" && opsLevel === "l1_complete") return copy.successBody;
  return copy.description;
}

function ActivationItemRow({
  item,
  emphasize,
}: {
  item: ActivationItem;
  emphasize?: boolean;
}) {
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
          <span
            className={
              done
                ? "text-muted-foreground line-through"
                : emphasize
                  ? "font-medium text-foreground"
                  : ""
            }
          >
            {label}
          </span>
          <Badge
            variant={done ? "success" : "neutral"}
            tone="soft"
            className="text-xs"
          >
            {done ? copy.doneBadge : copy.pendingBadge}
          </Badge>
        </div>
        {!done && item.canAct ? (
          <Link
            to={item.ctaPath}
            className={
              emphasize
                ? "font-semibold text-primary underline-offset-4 hover:underline"
                : "font-medium text-primary underline-offset-4 hover:underline"
            }
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

function FirstTripSuccessBlock({ data }: { data: ActivationData }) {
  const softPending = findPendingSoftTrackItems(data.items);

  return (
    <div
      className="space-y-2 rounded-lg border border-border bg-success/5 p-3"
      aria-label={copy.successTitle}
    >
      <div className="flex flex-wrap items-center gap-2">
        {softPending.map((item) =>
          item.canAct ? (
            <Button key={item.code} asChild variant="outline" size="sm">
              <Link to={item.ctaPath}>{itemCtaLabel(item.code)}</Link>
            </Button>
          ) : null,
        )}
        <Button asChild variant="secondary" size="sm">
          <Link to="/trips">{copy.successTripsCta}</Link>
        </Button>
      </div>
    </div>
  );
}

function AccountantFiscalEmphasis({
  data,
}: {
  data: ActivationData;
}) {
  if (!isOpsReadyForFiscalTrack(data.opsLevel)) return null;
  if (data.fiscalTrack.readyHint === "configured") return null;

  const preferred = resolvePreferredFiscalItem(
    data.items,
    data.fiscalTrack.readyHint,
  );
  if (!preferred || !preferred.canAct) return null;

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
      <p className="text-sm text-foreground">
        {copy.fiscalReadyHints[data.fiscalTrack.readyHint]}
      </p>
      <Button asChild size="sm">
        <Link to={preferred.ctaPath}>{itemCtaLabel(preferred.code)}</Link>
      </Button>
    </div>
  );
}

export function DashboardActivationChecklist({
  storageKey: storageKeyProp,
  onGuideVisibleChange,
}: {
  storageKey?: string;
  /** D3: cuando la guía manda (loading / error / checklist), ocultar Orientation. */
  onGuideVisibleChange?: (visible: boolean) => void;
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

  const { data, isLoading, isError, refetch } = useDashboardActivation({
    enabled: Boolean(mode) && isAuthenticated && !dismissed,
  });

  const panelVisible =
    Boolean(mode) &&
    !dismissed &&
    !isLoading &&
    !isError &&
    data != null &&
    shouldShowActivationChecklist(data, mode!);

  const guideVisible =
    Boolean(mode) &&
    !dismissed &&
    (isLoading || isError || panelVisible);

  useEffect(() => {
    onGuideVisibleChange?.(guideVisible);
    return () => onGuideVisibleChange?.(false);
  }, [guideVisible, onGuideVisibleChange]);

  const sessionOnceKey =
    tenantId && userId ? `${tenantId}:${userId}` : undefined;

  useEffect(() => {
    if (!panelVisible || !data || !mode || !sessionOnceKey) return;
    trackActivationEvent(
      "activation_checklist_viewed",
      { mode, opsLevel: data.opsLevel },
      { onceKey: sessionOnceKey },
    );
  }, [panelVisible, data, mode, sessionOnceKey]);

  useEffect(() => {
    if (!panelVisible || !data || !sessionOnceKey) return;
    if (mode !== "full" || data.opsLevel !== "l1_complete") return;
    trackActivationEvent(
      "activation_first_trip_ready",
      { opsLevel: data.opsLevel },
      { onceKey: sessionOnceKey },
    );
  }, [panelVisible, data, mode, sessionOnceKey]);

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

  if (isError) {
    return (
      <DetailAlertCard
        severity="critical"
        icon={<AlertCircle className="h-4 w-4" />}
        title={copy.error.title}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void refetch();
            }}
          >
            {copy.error.retry}
          </Button>
        }
      />
    );
  }

  if (!data) return null;
  if (!shouldShowActivationChecklist(data, mode)) return null;

  const items = filterActivationItemsForMode(data.items, mode);
  const showFirstTripSuccess =
    mode === "full" && data.opsLevel === "l1_complete";
  const showDispatcherComplete =
    mode === "dispatcher_compact" && data.opsLevel === "l1_complete";
  const preferredFiscal =
    mode === "accountant_fiscal"
      ? resolvePreferredFiscalItem(data.items, data.fiscalTrack.readyHint)
      : undefined;

  let visibleItems = items;
  if (mode === "dispatcher_compact") {
    if (data.opsLevel === "l1_complete") {
      visibleItems = [];
    } else {
      // Compact mid-setup: pending ops items (CTAs only when canAct).
      visibleItems = items.filter((i) => i.status === "pending");
    }
  } else if (mode === "full" && data.opsLevel === "l1_complete") {
    visibleItems = items.filter((i) => i.status === "pending");
  }

  const showSeedOffer =
    mode === "full" && data.demo.seedAvailable && !seedOfferDismissed;

  const dismiss = () => {
    trackActivationEvent("activation_checklist_dismissed", {
      mode,
      opsLevel: data.opsLevel,
    });
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
          {showFirstTripSuccess ? (
            <PartyPopper className="h-4 w-4 text-success" aria-hidden />
          ) : (
            <ListChecks className="h-4 w-4 text-muted-foreground" aria-hidden />
          )}
          {titleForMode(mode, data.opsLevel)}
        </CardTitle>
        <CardDescription>
          {descriptionForMode(mode, data.opsLevel, data.fiscalTrack.readyHint)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showFirstTripSuccess ? <FirstTripSuccessBlock data={data} /> : null}
        {mode === "accountant_fiscal" ? (
          <AccountantFiscalEmphasis data={data} />
        ) : null}
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
        {showDispatcherComplete ? (
          <Button asChild size="sm" variant="secondary">
            <Link to="/trips">{copy.successTripsCta}</Link>
          </Button>
        ) : null}
        {visibleItems.length > 0 ? (
          <ul className="space-y-3">
            {visibleItems.map((item) => (
              <ActivationItemRow
                key={item.code}
                item={item}
                emphasize={
                  mode === "accountant_fiscal" &&
                  preferredFiscal?.code === item.code
                }
              />
            ))}
          </ul>
        ) : null}
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
