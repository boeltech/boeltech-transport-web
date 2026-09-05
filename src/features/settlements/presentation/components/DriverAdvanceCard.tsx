import { Calendar, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader } from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton/skeleton";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { DriverAdvance } from "../../domain/entities";
import {
  ADVANCE_CATEGORY_LABELS,
  type AdvanceCategory,
} from "../../domain/enums";
import { AdvanceStatusBadge } from "./SettlementStatusBadge";
import { AdvanceActions } from "./AdvanceActions";

interface DriverAdvanceCardProps {
  advance: DriverAdvance;
}

export function DriverAdvanceCard({ advance }: DriverAdvanceCardProps) {
  const catLabel =
    ADVANCE_CATEGORY_LABELS[advance.category as AdvanceCategory] ??
    advance.category;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
        <div>
          <span className="font-mono font-bold text-sm text-primary">
            {advance.folio}
          </span>
          <p className="text-sm font-semibold text-foreground mt-0.5">
            {advance.employeeFullName ?? "—"}
          </p>
        </div>
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <AdvanceStatusBadge status={advance.status} showIcon size="sm" />
          <AdvanceActions advance={advance} />
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5 text-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="font-medium text-foreground">{catLabel}</span>
          {advance.tripCode ? (
            <span className="font-mono text-muted-foreground">Viaje: {advance.tripCode}</span>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5 text-muted-foreground">
          <CreditCard className="h-3.5 w-3.5" />
          <span>
            {advance.paymentMethod}
            {advance.bankReference ? ` (${advance.bankReference})` : ""}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {advance.disbursedAt ? formatDate(advance.disbursedAt) : "Sin fecha de entrega"}
          </span>
        </div>

        <div className="border-t pt-2 grid grid-cols-2 gap-2">
          <div>
            <span className="text-muted-foreground">Entregado:</span>
            <p className="font-medium text-foreground tabular-nums">
              {formatMxCurrency(advance.amount)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground">Saldo pendiente:</span>
            <p className="font-bold text-primary tabular-nums">
              {formatMxCurrency(advance.balanceRemaining)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DriverAdvanceCardSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1.5 w-full max-w-[140px]">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-5 w-20" />
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-36" />
        <div className="border-t pt-2 grid grid-cols-2 gap-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
