import { HeartPulse } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { EmptyState } from "@shared/ui/feedback-states";
import { Progress } from "@shared/ui/progress";
import type { PlatformTenantHealth } from "../../domain/entities";
import { platformCopy } from "../copy/platformCopy";
import { TenantHealthDot } from "./TenantHealthDot";
import { formatDateTime } from "@shared/utils/dateUtils";

interface TenantHealthBreakdownCardProps {
  health: PlatformTenantHealth;
}

const SIGNAL_KEYS = [
  "fiscal",
  "payment",
  "adoption",
  "fleet",
  "engagement",
] as const;

export function TenantHealthBreakdownCard({
  health,
}: TenantHealthBreakdownCardProps) {
  const copy = platformCopy.health;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{copy.breakdownTitle}</CardTitle>
            <CardDescription>{copy.breakdownDescription}</CardDescription>
          </div>
          <TenantHealthDot score={health.score} />
        </div>
        {health.asOf ? (
          <p className="text-xs text-muted-foreground">
            {copy.asOf(formatDateTime(health.asOf))}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">{copy.pending}</p>
        )}
      </CardHeader>
      <CardContent>
        {health.signals ? (
          <ul className="space-y-3">
            {SIGNAL_KEYS.map((key) => {
              const value = health.signals?.[key] ?? 0;
              const weightPct = Math.round((health.weights[key] ?? 0) * 100);
              return (
                <li key={key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">
                      {copy.signals[key]}
                      <span className="ml-1 font-normal text-muted-foreground">
                        ({weightPct}%)
                      </span>
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {Math.round(value)}
                    </span>
                  </div>
                  <Progress value={Math.max(0, Math.min(100, value))} />
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon={<HeartPulse className="h-10 w-10" />}
            title={copy.pending}
            size="sm"
          />
        )}
      </CardContent>
    </Card>
  );
}
