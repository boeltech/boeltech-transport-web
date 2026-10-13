import { useState, type ReactNode } from "react";
import { ClipboardList, Download, HelpCircle, RefreshCw } from "lucide-react";

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@shared/ui/tooltip";

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

function CardShell({
  action,
  children,
}: {
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card data-testid="trip-order-card">
      <CardHeader className="flex flex-col gap-3 space-y-0 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4 shrink-0 text-primary" />
            {copy.title}
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex text-muted-foreground hover:text-foreground"
                    aria-label={copy.helpTooltip}
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  {copy.helpTooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
        action={
          <div className="flex flex-wrap items-center gap-2">
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
            {showRegenerate ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0 gap-1.5"
                disabled={isMutating}
                onClick={() => setConfirmOpen(true)}
              >
                <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                {copy.action.regenerate}
              </Button>
            ) : null}
            {showGenerate ? (
              <Button
                type="button"
                size="sm"
                className="shrink-0 gap-1.5"
                disabled={generateDisabled || isMutating}
                title={generateDisabled ? (disabledReason ?? undefined) : undefined}
                onClick={() => generateMutation.mutate()}
              >
                <ClipboardList className="h-3.5 w-3.5" />
                {copy.action.generate}
              </Button>
            ) : null}
          </div>
        }
      >
        {emission ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">
                {copy.label.version(emission.version)}
              </span>
              <Badge
                variant={emission.outdated ? "warning" : "success"}
                tone="soft"
                className="text-[10px]"
              >
                {emission.outdated ? copy.badge.outdated : copy.badge.current}
              </Badge>
            </div>
            <dl className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
              <div>
                <dt className="inline text-xs">{copy.label.issuedAt}: </dt>
                <dd className="inline">{formatDateTime(emission.issuedAt)}</dd>
              </div>
              {emission.issuedByName ? (
                <div>
                  <dt className="inline text-xs">{copy.label.issuedBy}: </dt>
                  <dd className="inline">{emission.issuedByName}</dd>
                </div>
              ) : null}
              <div>
                <dt className="inline text-xs">{copy.label.statusAtIssue}: </dt>
                <dd className="inline">
                  {getStatusLabel(emission.tripStatusAtIssue)}
                </dd>
              </div>
            </dl>
            {emission.outdated ? (
              <p className="text-xs text-muted-foreground">{copy.outdatedHint}</p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-1 rounded-md border border-dashed bg-muted/20 px-3 py-3">
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
