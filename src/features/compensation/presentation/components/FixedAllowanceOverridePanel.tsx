import { useMemo, useState } from "react";
import { Label } from "@shared/ui/label";
import { Switch } from "@shared/ui/switch";
import { DateField } from "@shared/ui/form";
import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { getTodayString } from "@shared/utils/dateUtils";
import {
  useFixedAllowanceOverrides,
  useUpsertFixedAllowanceOverride,
} from "../../application/hooks";
import type { TemplateAssignment, TemplateFixedAllowance } from "../../domain/entities";
import { FIXED_ALLOWANCE_PERIOD_LABELS } from "../../domain/enums";
import { compensationCopy } from "../copy/compensationCopy";

const copy = compensationCopy.allowanceOverrides;

function defaultPeriodBounds(): { start: string; end: string } {
  const end = getTodayString();
  const start = `${end.slice(0, 7)}-01`;
  return { start, end };
}

interface FixedAllowanceOverridePanelProps {
  assignment: TemplateAssignment;
  fixedAllowances: TemplateFixedAllowance[];
}

export function FixedAllowanceOverridePanel({
  assignment,
  fixedAllowances,
}: FixedAllowanceOverridePanelProps) {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission("settlements", "update");

  const [{ start: periodStart, end: periodEnd }, setPeriod] = useState(defaultPeriodBounds);
  const upsertMutation = useUpsertFixedAllowanceOverride();

  const { data: overrides = [], isLoading } = useFixedAllowanceOverrides({
    employeeId: assignment.employeeId,
    periodStart,
    periodEnd,
    enabled: fixedAllowances.length > 0,
  });

  const suspendedByAllowanceId = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const override of overrides) {
      map.set(override.allowanceId, override.isSuspended);
    }
    return map;
  }, [overrides]);

  if (fixedAllowances.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-2">{copy.noAllowancesOnTemplate}</p>
    );
  }

  const handleToggle = async (allowance: TemplateFixedAllowance, nextSuspended: boolean) => {
    if (!allowance.id) {
      toast({ title: copy.missingAllowanceId, variant: "error" });
      return;
    }

    try {
      await upsertMutation.mutateAsync({
        employeeId: assignment.employeeId,
        allowanceId: allowance.id,
        periodStart,
        periodEnd,
        isSuspended: nextSuspended,
      });
      toast({
        title: nextSuspended ? copy.toasts.suspended : copy.toasts.resumed,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: copy.toasts.error,
        description: getErrorMessage(error),
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-4 rounded-md border bg-muted/20 p-4">
      <div>
        <p className="text-sm font-medium">{copy.title}</p>
        <p className="text-xs text-muted-foreground">{copy.description}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`override-start-${assignment.id}`}>{copy.periodStart}</Label>
          <DateField
            id={`override-start-${assignment.id}`}
            value={periodStart}
            onChange={(value) => setPeriod((prev) => ({ ...prev, start: value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`override-end-${assignment.id}`}>{copy.periodEnd}</Label>
          <DateField
            id={`override-end-${assignment.id}`}
            value={periodEnd}
            onChange={(value) => setPeriod((prev) => ({ ...prev, end: value }))}
          />
        </div>
      </div>

      <ul className="space-y-3">
        {fixedAllowances.map((allowance) => {
          const allowanceId = allowance.id ?? allowance.label;
          const isSuspended = suspendedByAllowanceId.get(allowance.id ?? "") ?? false;

          return (
            <li
              key={allowanceId}
              className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{allowance.label}</p>
                <p className="text-xs text-muted-foreground">
                  {formatMxCurrency(allowance.amount)} ·{" "}
                  {FIXED_ALLOWANCE_PERIOD_LABELS[allowance.period]}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Label htmlFor={`suspend-${assignment.id}-${allowanceId}`} className="text-xs">
                  {isSuspended ? copy.suspendedLabel : copy.activeLabel}
                </Label>
                <Switch
                  id={`suspend-${assignment.id}-${allowanceId}`}
                  checked={!isSuspended}
                  disabled={!canUpdate || isLoading || upsertMutation.isPending || !allowance.id}
                  onCheckedChange={(checked) => void handleToggle(allowance, !checked)}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

