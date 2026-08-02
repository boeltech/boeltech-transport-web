import { useState } from "react";
import { ChevronDown, Stamp } from "lucide-react";
import { AlertWithIcon } from "@shared/ui/alert";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { EmptyState } from "@shared/ui/feedback-states";
import { Progress } from "@shared/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { cn } from "@shared/lib/utils/cn";
import type { BillingUsage } from "../../domain/entities";
import { billingCopy } from "../copy/billingCopy";
import {
  formatBillingPeriodKey,
  formatBillingPriceCents,
  getStampRunOutSentence,
  getStampUsageTone,
} from "../utils/billingFormatters";

interface BillingStampsCardProps {
  usage?: BillingUsage;
  isLoading: boolean;
  usagePercent: number;
  stampsRemaining: number;
}

const TONE_INDICATOR: Record<
  ReturnType<typeof getStampUsageTone>,
  string
> = {
  primary: "bg-primary",
  warning: "bg-warning",
  destructive: "bg-destructive",
};

export function BillingStampsCard({
  usage,
  isLoading,
  usagePercent,
  stampsRemaining,
}: BillingStampsCardProps) {
  const copy = billingCopy.stamps;
  const [historyOpen, setHistoryOpen] = useState(false);
  const tone = getStampUsageTone(usagePercent);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Stamp className="h-4 w-4" />
          {copy.title}
        </CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{copy.loading}</p>
        ) : usage ? (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="space-y-1">
                <p className="text-3xl font-semibold tabular-nums">
                  {copy.summary(usage.stampsUsed, usage.includedStamps)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {copy.remaining(stampsRemaining)}
                </p>
              </div>
              <Badge
                variant={tone === "primary" ? "neutral" : tone}
                tone="soft"
                className="tabular-nums"
              >
                {copy.usedPercent(usagePercent)}
              </Badge>
            </div>

            <Progress
              value={usagePercent}
              indicatorClassName={TONE_INDICATOR[tone]}
            />

            {getStampRunOutSentence(usage.quotaPolicy) ? (
              <p className="text-sm">
                {getStampRunOutSentence(usage.quotaPolicy)}
              </p>
            ) : null}

            {usage.prepaidRemaining > 0 ? (
              <p className="text-sm text-muted-foreground">
                {copy.prepaidRemaining(usage.prepaidRemaining)}
              </p>
            ) : null}

            {usage.overageStamps > 0 ? (
              <AlertWithIcon variant="warning" title={copy.overageTitle}>
                {copy.overage(
                  usage.overageStamps,
                  formatBillingPriceCents(usage.overageTotalCents),
                )}
              </AlertWithIcon>
            ) : null}

            {usage.history.length > 0 ? (
              <Collapsible
                open={historyOpen}
                onOpenChange={setHistoryOpen}
                className="border-t pt-2"
              >
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="px-0 hover:bg-transparent"
                  >
                    {historyOpen
                      ? copy.history.hideLabel
                      : copy.history.showLabel}
                    <ChevronDown
                      aria-hidden
                      className={cn(
                        "ml-1.5 h-4 w-4 transition-transform",
                        historyOpen && "rotate-180",
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="hidden sm:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{copy.history.columns.period}</TableHead>
                          <TableHead>{copy.history.columns.used}</TableHead>
                          <TableHead>{copy.history.columns.overage}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usage.history.map((item) => (
                          <TableRow key={item.periodKey}>
                            <TableCell>
                              {formatBillingPeriodKey(item.periodKey)}
                            </TableCell>
                            <TableCell className="tabular-nums">
                              {item.stampsUsed}
                            </TableCell>
                            <TableCell className="tabular-nums">
                              {item.overageStamps > 0
                                ? item.overageStamps
                                : copy.history.none}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <ul className="space-y-2 sm:hidden">
                    {usage.history.map((item) => (
                      <li
                        key={item.periodKey}
                        className="rounded-md border px-3 py-2 text-sm"
                      >
                        <p className="font-medium">
                          {formatBillingPeriodKey(item.periodKey)}
                        </p>
                        <p className="text-muted-foreground">
                          {copy.history.mobileUsed(item.stampsUsed)}
                          {item.overageStamps > 0
                            ? ` · ${copy.history.mobileOverage(item.overageStamps)}`
                            : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            ) : null}
          </>
        ) : (
          <EmptyState
            icon={<Stamp className="h-10 w-10" />}
            title={copy.unavailable}
            size="sm"
          />
        )}
      </CardContent>
    </Card>
  );
}
