import { useEffect, useMemo, useRef, useState } from "react";
import { Label } from "@shared/ui/label";
import { Switch } from "@shared/ui/switch";
import { DateField } from "@shared/ui/form";
import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { useEmployeeBasic } from "@features/employees/application";
import {
  PeriodStepper,
  buildSuggestedSettlementPeriod,
  type SalaryPeriodKind,
} from "@features/settlements/application";
import {
  useFixedAllowanceOverrides,
  useUpsertFixedAllowanceOverride,
} from "../../application/hooks";
import type { TemplateAssignment, TemplateFixedAllowance } from "../../domain/entities";
import { FIXED_ALLOWANCE_PERIOD_LABELS } from "../../domain/enums";
import { compensationCopy } from "../copy/compensationCopy";

const copy = compensationCopy.allowanceOverrides;

function resolveUsableSalaryPeriod(
  salaryType?: string | null,
): SalaryPeriodKind | null {
  if (salaryType === "weekly" || salaryType === "biweekly" || salaryType === "monthly") {
    return salaryType;
  }
  return null;
}

function resolveInitialPeriod(opts: {
  paymentPeriodStart?: string;
  paymentPeriodEnd?: string;
  salaryType?: string | null;
}): { start: string; end: string } {
  const ps = opts.paymentPeriodStart?.trim();
  const pe = opts.paymentPeriodEnd?.trim();
  if (ps && pe && ps <= pe) return { start: ps, end: pe };

  const salaryPeriod: SalaryPeriodKind =
    opts.salaryType === "biweekly" || opts.salaryType === "monthly"
      ? opts.salaryType
      : "weekly";
  const suggested = buildSuggestedSettlementPeriod({ salaryPeriod });
  return { start: suggested.periodStart, end: suggested.periodEnd };
}

/** Si el rango no es ventana canónica del ritmo, snappear a la que contiene `start`. */
function snapToCanonicalPeriod(
  salaryPeriod: SalaryPeriodKind,
  start: string,
  end: string,
): { start: string; end: string } {
  const canonical = buildSuggestedSettlementPeriod({
    salaryPeriod,
    asOfDate: start,
  });
  if (canonical.periodStart === start && canonical.periodEnd === end) {
    return { start, end };
  }
  return { start: canonical.periodStart, end: canonical.periodEnd };
}

interface FixedAllowanceOverridePanelProps {
  assignment: TemplateAssignment;
  fixedAllowances: TemplateFixedAllowance[];
  paymentPeriodStart?: string;
  paymentPeriodEnd?: string;
}

export function FixedAllowanceOverridePanel({
  assignment,
  fixedAllowances,
  paymentPeriodStart,
  paymentPeriodEnd,
}: FixedAllowanceOverridePanelProps) {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission("settlements", "update");

  const { data: employeeBasic } = useEmployeeBasic(assignment.employeeId);
  const salaryPeriod = resolveUsableSalaryPeriod(employeeBasic?.salaryType);

  const [{ start: periodStart, end: periodEnd }, setPeriod] = useState(() => {
    const initial = resolveInitialPeriod({
      paymentPeriodStart,
      paymentPeriodEnd,
      salaryType: employeeBasic?.salaryType,
    });
    const usable = resolveUsableSalaryPeriod(employeeBasic?.salaryType);
    return usable
      ? snapToCanonicalPeriod(usable, initial.start, initial.end)
      : initial;
  });
  const periodTouchedRef = useRef(false);
  const upsertMutation = useUpsertFixedAllowanceOverride();

  useEffect(() => {
    if (periodTouchedRef.current) return;
    let next = resolveInitialPeriod({
      paymentPeriodStart,
      paymentPeriodEnd,
      salaryType: employeeBasic?.salaryType,
    });
    const usable = resolveUsableSalaryPeriod(employeeBasic?.salaryType);
    if (usable) {
      next = snapToCanonicalPeriod(usable, next.start, next.end);
    }
    setPeriod((prev) =>
      prev.start === next.start && prev.end === next.end ? prev : next,
    );
  }, [paymentPeriodStart, paymentPeriodEnd, employeeBasic?.salaryType]);

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

  const handlePeriodChange = (patch: Partial<{ start: string; end: string }>) => {
    periodTouchedRef.current = true;
    setPeriod((prev) => ({ ...prev, ...patch }));
  };

  const handleStepperChange = (start: string, end: string) => {
    periodTouchedRef.current = true;
    setPeriod({ start, end });
  };

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

      <div className="space-y-1.5">
        <Label>{copy.periodLabel}</Label>
        {salaryPeriod ? (
          <PeriodStepper
            salaryPeriod={salaryPeriod}
            periodStart={periodStart}
            periodEnd={periodEnd}
            onChange={handleStepperChange}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`override-start-${assignment.id}`}>{copy.periodStart}</Label>
              <DateField
                id={`override-start-${assignment.id}`}
                value={periodStart}
                onChange={(value) => handlePeriodChange({ start: value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`override-end-${assignment.id}`}>{copy.periodEnd}</Label>
              <DateField
                id={`override-end-${assignment.id}`}
                value={periodEnd}
                onChange={(value) => handlePeriodChange({ end: value })}
              />
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground">{copy.exactMatchHint}</p>
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
                  {isSuspended ? copy.omitLabel : copy.includeLabel}
                </Label>
                <Switch
                  id={`suspend-${assignment.id}-${allowanceId}`}
                  checked={isSuspended}
                  disabled={!canUpdate || isLoading || upsertMutation.isPending || !allowance.id}
                  onCheckedChange={(checked) => void handleToggle(allowance, checked)}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
