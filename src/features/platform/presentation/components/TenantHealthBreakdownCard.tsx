import { useState } from "react";
import { ChevronDown, HeartPulse } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { EmptyState } from "@shared/ui/feedback-states";
import { Progress } from "@shared/ui/progress";
import { cn } from "@shared/lib/utils/cn";
import type { PlatformTenantHealth } from "../../domain/entities";
import { platformCopy } from "../copy/platformCopy";
import { TenantHealthDot } from "./TenantHealthDot";
import { formatDateTime } from "@shared/utils/dateUtils";

interface TenantHealthBreakdownCardProps {
  health: PlatformTenantHealth;
  /** When true, body starts collapsed (Resumen ATF — D3). Default false. */
  defaultCollapsed?: boolean;
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
  defaultCollapsed = false,
}: TenantHealthBreakdownCardProps) {
  const copy = platformCopy.health;
  const sections = platformCopy.tenants.detail.sections;
  const [open, setOpen] = useState(!defaultCollapsed);

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">{copy.breakdownTitle}</CardTitle>
              <CardDescription>{copy.breakdownDescription}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <TenantHealthDot score={health.score} />
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-xs text-muted-foreground"
                >
                  {open ? sections.healthHide : sections.healthShow}
                  <ChevronDown
                    aria-hidden
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      open && "rotate-180",
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
          {health.asOf ? (
            <p className="text-xs text-muted-foreground">
              {copy.asOf(formatDateTime(health.asOf))}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">{copy.pending}</p>
          )}
        </CardHeader>
        <CollapsibleContent>
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
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
