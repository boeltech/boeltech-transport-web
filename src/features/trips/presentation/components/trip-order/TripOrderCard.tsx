import { useState, type ReactNode } from "react";
import { Download } from "lucide-react";

import {
  getStatusLabel,
  type Trip,
} from "@features/trips/domain";
import {
  useDownloadTripOrder,
  useGenerateTripOrder,
  useTripOrder,
} from "@features/trips/application";
import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import { formatDateTime } from "@shared/utils/dateUtils";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";

import { tripDetailCopy } from "../../copy";
import {
  describeTripOrderDisabledReason,
  isForbiddenError,
  resolveTripOrderCardVisible,
  shouldQueryTripOrder,
} from "./tripOrderHelpers";

const copy = tripDetailCopy.tripOrder.card;
const toastCopy = tripDetailCopy.tripOrder.toast;

export interface TripOrderCardProps {
  trip: Pick<Trip, "id" | "status">;
  isClientPortalView?: boolean;
  isDriverPortalView?: boolean;
}

function Kv({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-1 sm:flex-row sm:items-baseline sm:gap-6">
      <span className="w-36 shrink-0 text-sm text-muted-foreground">{label}</span>
      <div className="min-w-0 text-sm">{children}</div>
    </div>
  );
}

function CardShell({
  badge,
  action,
  children,
}: {
  badge?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card data-testid="trip-order-card">
      <CardHeader className="flex flex-col gap-3 space-y-0 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex flex-wrap items-center gap-2 text-base">
            {copy.title}
            {badge}
          </CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </div>
        {action}
      </CardHeader>
      <CardContent className="space-y-3 pt-0">{children}</CardContent>
    </Card>
  );
}

export function TripOrderCard({
  trip,
  isClientPortalView = false,
  isDriverPortalView = false,
}: TripOrderCardProps) {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const canRead = hasPermission("trips_trip_order", "read");
  const canExecute = hasPermission("trips_trip_order", "execute");
  const enabled = shouldQueryTripOrder({
    canRead,
    isClientPortalView,
    isDriverPortalView,
  });
  const [confirmOpen, setConfirmOpen] = useState(false);

  const query = useTripOrder(trip.id, { enabled });

  const downloadMutation = useDownloadTripOrder(trip.id, {
    onError: (err) => {
      toast({
        title: err.message || copy.downloadError,
        variant: "destructive",
      });
    },
  });

  const generateMutation = useGenerateTripOrder(trip.id, {
    onSuccess: async (result) => {
      toast({
        title: toastCopy.ready,
        description: toastCopy.versionGenerated(result.emission.version),
        variant: "success",
      });
      try {
        await downloadMutation.mutateAsync(result.emission.filename);
      } catch {
        // onError del download ya tostea
      }
    },
    onError: (err) => {
      toast({
        title: err.message || copy.loadError,
        variant: "destructive",
      });
    },
  });

  if (!enabled) return null;

  if (query.isPending) {
    return (
      <CardShell>
        <Skeleton className="h-20 w-full" />
      </CardShell>
    );
  }

  if (query.isError) {
    if (isForbiddenError(query.error)) return null;
    return (
      <CardShell>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
          <span>{copy.loadError}</span>
          <Button type="button" size="sm" variant="outline" onClick={() => void query.refetch()}>
            {copy.retry}
          </Button>
        </div>
      </CardShell>
    );
  }

  const view = query.data;
  if (!resolveTripOrderCardVisible(view)) return null;

  const emission = view.currentEmission;
  const eligibility = view.eligibility;
  const disabledReason = describeTripOrderDisabledReason(eligibility.reasonCode);
  const showGenerate =
    canExecute && !emission && (eligibility.canGenerate || Boolean(disabledReason));
  const showRegenerate = canExecute && Boolean(emission) && eligibility.canRegenerate;
  const showDownload = canRead && eligibility.canDownload && Boolean(emission);
  const generateDisabled = !eligibility.canGenerate;
  const isMutating = generateMutation.isPending || downloadMutation.isPending;
  const nextVersion = (emission?.version ?? 0) + 1;

  return (
    <>
      <CardShell
        badge={
          emission ? (
            <Badge
              variant={emission.outdated ? "warning" : "success"}
              tone="soft"
              className="text-[10px]"
            >
              {emission.outdated ? copy.badge.outdated : copy.badge.current}
            </Badge>
          ) : undefined
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            {showRegenerate ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="shrink-0"
                disabled={isMutating}
                onClick={() => setConfirmOpen(true)}
              >
                {copy.action.regenerate}
              </Button>
            ) : null}
            {showDownload ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0 gap-1.5"
                disabled={isMutating}
                onClick={() => downloadMutation.mutate(emission?.filename)}
              >
                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                {copy.action.download}
              </Button>
            ) : null}
            {showGenerate ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0"
                disabled={generateDisabled || isMutating}
                title={generateDisabled ? (disabledReason ?? undefined) : undefined}
                onClick={() => generateMutation.mutate()}
              >
                {copy.action.generate}
              </Button>
            ) : null}
          </div>
        }
      >
        {emission ? (
          <div className="space-y-0">
            <Kv label="Versión">{copy.label.version(emission.version)}</Kv>
            <Kv label={copy.label.issuedAt}>
              {formatDateTime(emission.issuedAt)}
              {emission.issuedByName ? ` · por ${emission.issuedByName}` : null}
            </Kv>
            <Kv label={copy.label.statusAtIssue}>
              {getStatusLabel(emission.tripStatusAtIssue)}
            </Kv>
            {emission.outdated ? (
              <p className="pt-2 text-xs text-muted-foreground">{copy.outdatedHint}</p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-1 rounded-md bg-muted/40 px-3 py-3">
            <p className="text-sm font-medium text-foreground">{copy.empty.title}</p>
            <p className="text-xs text-muted-foreground">{copy.empty.description}</p>
            {generateDisabled && disabledReason ? (
              <p className="pt-1 text-xs text-muted-foreground">{disabledReason}</p>
            ) : null}
          </div>
        )}
      </CardShell>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.confirmRegenerate.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.confirmRegenerate.description(nextVersion)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={generateMutation.isPending}>
              {copy.confirmRegenerate.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={generateMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                setConfirmOpen(false);
                generateMutation.mutate();
              }}
            >
              {copy.confirmRegenerate.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
