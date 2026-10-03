import {
  Controller,
  useFormState,
  type Control,
  type UseFieldArrayAppend,
  type UseFieldArrayRemove,
} from "react-hook-form";
import { Plus, Route, Trash2 } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { FieldInlineError, MoneyInput } from "@shared/ui/form";
import {
  type AgreementCommissionType,
  type TripRouteType,
} from "@features/settlements";
import { FormSectionCard } from "@shared/ui/form-section-card";
import { compensationCopy } from "../copy/compensationCopy";
import { describeRuleProse } from "../utils/simulateCompensation";
import type { CompensationTemplateFormData } from "../validation/compensationSchemas";

const sheetCopy = compensationCopy.sheet;
const builderCopy = compensationCopy.builder;
const detailCopy = compensationCopy.templateDetail;

const ROUTE_TYPE_KEYS = Object.keys(builderCopy.routeTypeLabels) as TripRouteType[];
const COMMISSION_TYPE_KEYS = Object.keys(
  builderCopy.commissionTypeLabels,
) as AgreementCommissionType[];

interface TemplateRulesSectionProps {
  control: Control<CompensationTemplateFormData>;
  ruleFields: { id: string }[];
  watchedRules: CompensationTemplateFormData["rules"] | undefined;
  appendRule: UseFieldArrayAppend<CompensationTemplateFormData, "rules">;
  removeRule: UseFieldArrayRemove;
  stepPrefix?: string;
  /** Usa léxico operativo del builder (default true en Builder; false en Sheet legacy). */
  operationalLexicon?: boolean;
}

function firstAvailableRouteType(
  rules: CompensationTemplateFormData["rules"] | undefined,
): TripRouteType | null {
  const used = new Set((rules ?? []).map((rule) => rule.routeType));
  return ROUTE_TYPE_KEYS.find((key) => !used.has(key)) ?? null;
}

export function TemplateRulesSection({
  control,
  ruleFields,
  watchedRules,
  appendRule,
  removeRule,
  stepPrefix = "1.",
  operationalLexicon = true,
}: TemplateRulesSectionProps) {
  const { errors } = useFormState({ control, name: "rules" });
  const nextRouteType = firstAvailableRouteType(watchedRules);
  const canAddRule = nextRouteType != null;

  const routeLabels = operationalLexicon
    ? builderCopy.routeTypeLabels
    : {
        local: "Local",
        long_haul: "Foráneo",
        transfer: "Transfer / Patio",
      };
  const commissionLabels = operationalLexicon
    ? builderCopy.commissionTypeLabels
    : {
        rate_per_km: "Tarifa por kilómetro",
        percentage_of_freight: "Porcentaje sobre flete",
        fixed_per_trip: "Importe fijo por viaje",
        none: "Sin comisión (cubierto por sueldo base)",
      };
  const rateLabels = operationalLexicon
    ? builderCopy.ruleRateLabels
    : sheetCopy.ruleRateLabels;
  const noExtraNote = operationalLexicon
    ? builderCopy.localNoExtraPayNote
    : sheetCopy.localNoCommissionNote;
  const sectionTitle = operationalLexicon
    ? builderCopy.paymentSectionTitle
    : detailCopy.rulesTitle;
  const emptyLabel = operationalLexicon
    ? builderCopy.noPaymentRules
    : detailCopy.noRules;

  return (
    <FormSectionCard
      title={stepPrefix.trim() ? `${stepPrefix} ${sectionTitle}` : sectionTitle}
      icon={<Route className="h-4 w-4" />}
      contentClassName="space-y-4"
      action={
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          disabled={!canAddRule}
          title={!canAddRule ? builderCopy.addRuleDisabledAllTypes : undefined}
          onClick={() => {
            if (!nextRouteType) return;
            appendRule({
              routeType: nextRouteType,
              commissionType: "none",
              rateValue: 0,
              minimumGuaranteedAmount: 0,
              notes: null,
            });
          }}
        >
          {sheetCopy.addRule}
        </Button>
      }
    >
      {ruleFields.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        ruleFields.map((field, index) => {
          const routeType = watchedRules?.[index]?.routeType ?? "long_haul";
          const commissionType =
            (watchedRules?.[index]?.commissionType ?? "none") as AgreementCommissionType;
          const routeLabel = routeLabels[routeType as TripRouteType] ?? routeType;
          const isPercentage = commissionType === "percentage_of_freight";
          const usedByOthers = new Set(
            (watchedRules ?? [])
              .map((rule, ruleIndex) =>
                ruleIndex === index ? null : rule.routeType,
              )
              .filter((value): value is TripRouteType => value != null),
          );
          const routeTypeError = errors.rules?.[index]?.routeType?.message;

          return (
            <div key={field.id} className="rounded-lg border bg-muted/15 p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{routeLabel}</p>
                {ruleFields.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    onClick={() => removeRule(index)}
                  >
                    {sheetCopy.remove}
                  </Button>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Controller
                    control={control}
                    name={`rules.${index}.routeType`}
                    render={({ field: routeField }) => (
                      <Select value={routeField.value} onValueChange={routeField.onChange}>
                        <SelectTrigger
                          className="h-8 text-xs"
                          aria-label={builderCopy.routeTypeLabel}
                          aria-invalid={Boolean(routeTypeError)}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROUTE_TYPE_KEYS.map((key) => (
                            <SelectItem
                              key={key}
                              value={key}
                              disabled={usedByOthers.has(key)}
                            >
                              {routeLabels[key]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldInlineError
                    fieldId={`rule-route-type-${index}`}
                    message={routeTypeError}
                  />
                </div>
                <Controller
                  control={control}
                  name={`rules.${index}.commissionType`}
                  render={({ field: commField }) => (
                    <Select value={commField.value} onValueChange={commField.onChange}>
                      <SelectTrigger className="h-8 text-xs" aria-label="Tipo de pago">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMISSION_TYPE_KEYS.map((key) => (
                          <SelectItem key={key} value={key}>
                            {commissionLabels[key]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              {commissionType !== "none" ? (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dashed">
                  <div className="space-y-1.5">
                    <Label htmlFor={`rule-rate-${index}`}>
                      {rateLabels[commissionType]}
                    </Label>
                    <Controller
                      control={control}
                      name={`rules.${index}.rateValue`}
                      render={({ field: rateField, fieldState }) => (
                        <MoneyInput
                          id={`rule-rate-${index}`}
                          name={rateField.name}
                          value={rateField.value}
                          onValueChange={rateField.onChange}
                          onBlur={rateField.onBlur}
                          error={Boolean(fieldState.error)}
                          currencyCode={isPercentage ? "%" : "MXN"}
                          placeholder={isPercentage ? "0.00" : "$0.00"}
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`rule-min-${index}`}>{sheetCopy.minimumGuaranteed}</Label>
                    <Controller
                      control={control}
                      name={`rules.${index}.minimumGuaranteedAmount`}
                      render={({ field: minField, fieldState }) => (
                        <MoneyInput
                          id={`rule-min-${index}`}
                          name={minField.name}
                          value={minField.value}
                          onValueChange={minField.onChange}
                          onBlur={minField.onBlur}
                          error={Boolean(fieldState.error)}
                        />
                      )}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic bg-muted/40 p-2.5 rounded-md border border-dashed">
                  {noExtraNote}
                </p>
              )}
              {(() => {
                const rateValue = watchedRules?.[index]?.rateValue;
                const minGuaranteed = watchedRules?.[index]?.minimumGuaranteedAmount;
                const prose = describeRuleProse(
                  routeType as TripRouteType,
                  commissionType,
                  rateValue,
                  minGuaranteed,
                );
                if (!prose) return null;
                return (
                  <p className="text-xs text-muted-foreground leading-relaxed bg-primary/5 p-2.5 rounded-md border border-primary/10">
                    {prose}
                  </p>
                );
              })()}
            </div>
          );
        })
      )}
    </FormSectionCard>
  );
}
