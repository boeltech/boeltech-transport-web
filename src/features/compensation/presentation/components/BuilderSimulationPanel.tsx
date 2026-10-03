import { useMemo, useState } from "react";
import { useWatch, type Control } from "react-hook-form";
import { Calculator, Info } from "lucide-react";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { MoneyInput } from "@shared/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Separator } from "@shared/ui/separator";
import { cn } from "@shared/lib/utils/cn";
import type { TripRouteType } from "@features/settlements";
import type { CompensationTemplate } from "../../domain/entities";
import type { CompensationTemplateFormData } from "../validation/compensationSchemas";
import { compensationCopy } from "../copy/compensationCopy";
import {
  simulateCompensation,
  SIMULATION_DEFAULTS,
  type SimulationInput,
} from "../utils/simulateCompensation";

const copy = compensationCopy.simulation;

const ROUTE_TYPE_OPTIONS: { value: TripRouteType; label: string }[] = [
  { value: "long_haul", label: copy.routeTypes.long_haul },
  { value: "local", label: copy.routeTypes.local },
  { value: "transfer", label: copy.routeTypes.transfer },
];

interface BuilderSimulationPanelProps {
  control: Control<CompensationTemplateFormData>;
  template: CompensationTemplate;
}

export function BuilderSimulationPanel({
  control,
  template,
}: BuilderSimulationPanelProps) {
  const [input, setInput] = useState<SimulationInput>({ ...SIMULATION_DEFAULTS });

  const values = useWatch({ control });
  const rules = (values.rules ?? template.rules ?? []) as CompensationTemplateFormData["rules"];
  const fixedAllowances = (values.fixedAllowances ??
    template.fixedAllowances ??
    []) as CompensationTemplateFormData["fixedAllowances"];
  const deductions = (values.deductions ??
    template.deductions ??
    []) as CompensationTemplateFormData["deductions"];

  const result = useMemo(
    () => simulateCompensation(rules, fixedAllowances, input, undefined, undefined, deductions),
    [rules, fixedAllowances, deductions, input],
  );

  const hasConfig =
    rules.length > 0 || fixedAllowances.length > 0 || deductions.length > 0;

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Calculator className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wide">
          {copy.title}
        </span>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="sim-route-type" className="text-xs">
            {copy.routeTypeLabel}
          </Label>
          <Select
            value={input.routeType}
            onValueChange={(value) =>
              setInput((prev) => ({ ...prev, routeType: value as TripRouteType }))
            }
          >
            <SelectTrigger id="sim-route-type" className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROUTE_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="sim-distance" className="text-xs">
              {copy.distanceLabel}
            </Label>
            <div className="relative">
              <Input
                id="sim-distance"
                type="number"
                min={0}
                className="h-8 pr-8 text-xs"
                value={input.distanceKm}
                onChange={(e) =>
                  setInput((prev) => ({
                    ...prev,
                    distanceKm: Math.max(0, Number(e.target.value) || 0),
                  }))
                }
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {copy.distanceSuffix}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sim-freight" className="text-xs">
              {copy.freightRevenueLabel}
            </Label>
            <MoneyInput
              id="sim-freight"
              name="sim-freight"
              value={input.freightRevenue}
              onValueChange={(val) =>
                setInput((prev) => ({
                  ...prev,
                  freightRevenue: typeof val === "number" ? val : 0,
                }))
              }
              className="h-8 text-xs"
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {copy.resultTitle}
        </p>

        {!hasConfig ? (
          <p className="text-xs text-muted-foreground">{copy.emptyResult}</p>
        ) : result.items.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {copy.noRuleForRouteType}
          </p>
        ) : (
          <div className="space-y-1.5">
            {result.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 text-foreground"
              >
                <span className="truncate text-xs">{item.label}</span>
                <span
                  className={cn(
                    "shrink-0 font-mono text-xs tabular-nums",
                    item.source === "deduction" && "text-destructive",
                  )}
                >
                  {item.formattedAmount}
                </span>
              </div>
            ))}

            <Separator className="my-1.5" />

            {result.totalDeductions > 0 ? (
              <div className="flex items-center justify-between gap-2 text-muted-foreground">
                <span className="text-xs">{copy.grossLabel}</span>
                <span className="font-mono text-xs tabular-nums">
                  {result.formattedGross}
                </span>
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-2 font-semibold text-foreground">
              <span className="text-xs">{copy.totalLabel}</span>
              <span className="font-mono tabular-nums">
                {result.formattedTotal}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 rounded-md border border-dashed bg-muted/30 p-2.5 text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p className="text-xs leading-relaxed">{copy.disclaimer}</p>
      </div>
    </div>
  );
}
