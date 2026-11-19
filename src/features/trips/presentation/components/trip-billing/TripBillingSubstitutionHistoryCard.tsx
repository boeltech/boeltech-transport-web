/**
 * Historial «Sustitución» (D27) — derivado de la cadena linked invoices.
 */

import { FileText } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { DetailTimeline } from "@shared/ui/data-display";
import { formatDateTime } from "@shared/utils/dateUtils";

import { billingCopy } from "../../copy/tripDetail/billingCopy";
import type { TripBillingSubstitutionHistoryItem } from "./resolveTripBillingSubstitution";

const copy = billingCopy.substitute;

export interface TripBillingSubstitutionHistoryCardProps {
  items: readonly TripBillingSubstitutionHistoryItem[];
}

export function TripBillingSubstitutionHistoryCard({
  items,
}: TripBillingSubstitutionHistoryCardProps) {
  if (items.length === 0) return null;

  return (
    <Card data-testid="trip-billing-substitution-history">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{copy.historyTitle}</CardTitle>
        <CardDescription>{copy.historyDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <DetailTimeline
          items={items.map((item) => ({
            id: item.id,
            icon: <FileText className="h-4 w-4" aria-hidden />,
            completed: !item.active,
            dotSize: "sm" as const,
            dotBgClassName: item.active ? "bg-warning" : undefined,
            dotIconClassName: item.active
              ? "text-warning-foreground"
              : undefined,
            content: (
              <div className="space-y-0.5 pb-3">
                <p
                  className={
                    item.active
                      ? "text-sm font-medium text-foreground"
                      : "text-sm text-foreground"
                  }
                >
                  {item.title}
                </p>
                {item.when ? (
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(item.when)}
                  </p>
                ) : null}
              </div>
            ),
          }))}
        />
      </CardContent>
    </Card>
  );
}
