import { useMemo, useState } from "react";
import {
  Controller,
  type Control,
  type UseFieldArrayAppend,
  type UseFieldArrayRemove,
} from "react-hook-form";
import { Button } from "@shared/ui/button";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { MoneyInput } from "@shared/ui/form";
import { cn } from "@shared/lib/utils/cn";
import type { AgreementCommissionType, TripRouteType } from "@features/settlements";
import type { CompensationTemplateFormData } from "../validation/compensationSchemas";
import { buildRulePhraseParts, routeTypeLabel } from "../utils/rulePhrase";
import { compensationCopy } from "../copy/compensationCopy";
import { MinimumGuaranteeChart } from "./MinimumGuaranteeChart";

const copy = compensationCopy.builder;

const COMMISSION_OPTIONS = Object.entries(copy.commissionTypeLabels).filter(
  ([value]) => value !== "none",
) as Array<[AgreementCommissionType, string]>;

interface BuilderRulePhraseCardProps {
  control: Control<CompensationTemplateFormData>;
  routeType: TripRouteType;
  ruleIndex: number | null;
  watchedRule: CompensationTemplateFormData["rules"][number] | undefined;
  appendRule: UseFieldArrayAppend<CompensationTemplateFormData, "rules">;
  removeRule: UseFieldArrayRemove;
  readOnly?: boolean;
}

function Phrase({
  rule,
}: {
  rule: Pick<
    CompensationTemplateFormData["rules"][number],
    "routeType" | "commissionType" | "rateValue" | "minimumGuaranteedAmount"
  >;
}) {
  const parts = useMemo(() => buildRulePhraseParts(rule), [rule]);
  return (
    <span className="flex-1 text-sm leading-5">
      {parts.map((part, index) =>
        part.kind === "chip" ? (
          <span
            key={`${part.text}-${index}`}
            className="mx-0.5 inline-block rounded-md border-b-[1.5px] border-dashed border-primary/50 bg-primary/10 px-1.5 font-mono text-[13px] font-semibold text-primary"
          >
            {part.text}
          </span>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        ),
      )}
    </span>
  );
}

export function BuilderRulePhraseCard({
  control,
  routeType,
  ruleIndex,
  watchedRule,
  appendRule,
  removeRule,
  readOnly = false,
}: BuilderRulePhraseCardProps) {
  const [open, setOpen] = useState(false);
  const isEmpty = ruleIndex == null || !watchedRule;
  const classLabel = routeTypeLabel(routeType);

  if (isEmpty) {
    return (
      <div
        className="flex items-center gap-2.5 rounded-lg border border-dashed bg-muted/40 px-3.5 py-3"
        data-testid={`rule-card-empty-${routeType}`}
      >
        <span className="min-w-[7rem] text-xs font-semibold">{classLabel}</span>
        <span className="flex-1 text-sm text-muted-foreground">{copy.emptyRuleCopy}</span>
        {!readOnly ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              appendRule({
                routeType,
                commissionType: "rate_per_km",
                rateValue: 0,
                minimumGuaranteedAmount: 0,
                notes: null,
              });
              setOpen(true);
            }}
          >
            {copy.addRule}
          </Button>
        ) : null}
      </div>
    );
  }

  const index = ruleIndex;
  const rateSuffix =
    watchedRule.commissionType === "rate_per_km"
      ? copy.rateSuffixKm
      : watchedRule.commissionType === "percentage_of_freight"
        ? copy.rateSuffixPct
        : copy.rateSuffixFixed;

  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 rounded-lg border px-3.5 py-3",
        open && "border-primary/40 shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]",
      )}
      data-testid={`rule-card-${routeType}`}
      data-open={open ? "true" : "false"}
    >
      <div className="flex items-center gap-2.5">
        <span className="min-w-[7rem] text-xs font-semibold">{classLabel}</span>
        <Phrase rule={watchedRule} />
        {!readOnly ? (
          open ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              {copy.doneRule}
            </Button>
          ) : (
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
              {copy.editRule}
            </Button>
          )
        ) : null}
      </div>

      {open && !readOnly ? (
        <>
          <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr]">
            <div className="space-y-1.5">
              <Label>{copy.ruleFormaLabel}</Label>
              <Controller
                control={control}
                name={`rules.${index}.commissionType`}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) =>
                      field.onChange(value as AgreementCommissionType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMISSION_OPTIONS.map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{copy.ruleTarifaLabel}</Label>
              <Controller
                control={control}
                name={`rules.${index}.rateValue`}
                render={({ field }) => (
                  <div className="relative">
                    <MoneyInput
                      value={field.value}
                      onValueChange={field.onChange}
                      className="pr-20 font-mono"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded bg-secondary px-1.5 text-[11px] font-semibold text-muted-foreground">
                      {rateSuffix}
                    </span>
                  </div>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{copy.ruleMinimumLabel}</Label>
              <Controller
                control={control}
                name={`rules.${index}.minimumGuaranteedAmount`}
                render={({ field }) => (
                  <MoneyInput value={field.value} onValueChange={field.onChange} />
                )}
              />
              <p className="text-xs text-muted-foreground">{copy.ruleMinimumHint}</p>
            </div>
          </div>
          <MinimumGuaranteeChart rule={watchedRule} />
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => {
                removeRule(index);
                setOpen(false);
              }}
            >
              Quitar regla
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
