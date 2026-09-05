import { Calendar, Route } from "lucide-react";
import { Card, CardContent, CardHeader } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Skeleton } from "@shared/ui/skeleton/skeleton";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { DriverSettlement } from "../../domain/entities";
import { SettlementStatusBadge } from "./SettlementStatusBadge";
import { SettlementActions } from "./SettlementActions";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy;

interface SettlementCardProps {
  settlement: DriverSettlement;
  onView: (id: string) => void;
  onDisburse?: (settlement: DriverSettlement) => void;
  onActionComplete?: () => void;
  approvalLinkOnly?: boolean;
  showRejectedCorrection?: boolean;
}

export function SettlementCard({
  settlement,
  onView,
  onDisburse,
  onActionComplete,
  approvalLinkOnly = false,
  showRejectedCorrection = false,
}: SettlementCardProps) {
  const tripsCount =
    settlement.tripsCount !== undefined && settlement.tripsCount !== null
      ? settlement.tripsCount
      : (settlement.items ? new Set(settlement.items.filter((it) => it.tripId).map((it) => it.tripId)).size : 0);

  return (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-colors shadow-sm"
      onClick={() => onView(settlement.id)}
    >
      <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {settlement.employeeFullName ?? "—"}
          </p>
          <span className="font-mono text-xs text-muted-foreground">
            {settlement.settlementNumber}
          </span>
        </div>
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col items-end gap-1">
            <SettlementStatusBadge status={settlement.status} showIcon size="sm" />
            {showRejectedCorrection && settlement.status === "rejected" ? (
              <Badge variant="destructive" tone="soft" className="text-xs">
                {settlementsCopy.workbench.backlog.correctBadge}
              </Badge>
            ) : null}
          </div>
          <SettlementActions
            settlement={settlement}
            onView={onView}
            onDisburse={onDisburse}
            onActionComplete={onActionComplete}
            approvalLinkOnly={approvalLinkOnly}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-xs">
        <div className="rounded-md bg-primary/5 p-2.5 flex justify-between items-center gap-2">
          <span className="text-muted-foreground font-medium">{copy.fields.netAmount}</span>
          <span className="text-lg font-extrabold tabular-nums text-primary">
            {formatMxCurrency(settlement.netAmount)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>
            {formatDate(settlement.periodStart)} – {formatDate(settlement.periodEnd)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Route className="h-3.5 w-3.5" />
            {tripsCount} viajes
          </span>
          {settlement.totalAdvancesDeducted > 0 ? (
            <span className="tabular-nums text-destructive">
              -{formatMxCurrency(settlement.totalAdvancesDeducted)} anticipos
            </span>
          ) : null}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between text-primary hover:text-primary"
          onClick={(e) => {
            e.stopPropagation();
            onView(settlement.id);
          }}
        >
          {copy.actions.viewDetail}
        </Button>
      </CardContent>
    </Card>
  );
}

export function SettlementCardSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-28" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  );
}
