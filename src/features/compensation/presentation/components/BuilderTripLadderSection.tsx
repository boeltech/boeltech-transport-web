import { useMemo } from "react";
import { useWatch } from "react-hook-form";
import { ArrowDown, Route } from "lucide-react";
import { Button } from "@shared/ui/button";
import { RHFSelectField } from "@shared/ui/form";
import { MID_TRIP_PAYOUT_POLICY_LABELS } from "@features/settlements/domain/enums";
import type { TripRouteType } from "@features/settlements";
import { useFrequentCityPairs } from "../../application/hooks";
import type { UseCompensationTemplateFormResult } from "../hooks/useCompensationTemplateForm";
import { compensationCopy } from "../copy/compensationCopy";
import { TemplateCorridorsSection } from "./TemplateCorridorsSection";
import { BuilderRulePhraseCard } from "./BuilderRulePhraseCard";

const copy = compensationCopy.builder;

const ROUTE_ORDER: TripRouteType[] = ["long_haul", "local", "transfer"];

const MID_TRIP_OPTIONS = (
  Object.entries(MID_TRIP_PAYOUT_POLICY_LABELS) as Array<[string, string]>
).map(([value, label]) => ({ value, label }));

type BuilderTripLadderSectionProps = Pick<
  UseCompensationTemplateFormResult,
  "form" | "ruleFields" | "appendRule" | "removeRule" | "watchedRules"
> & {
  readOnly?: boolean;
  onAddCorridor?: () => void;
};

export function BuilderTripLadderSection({
  form,
  ruleFields,
  appendRule,
  removeRule,
  watchedRules,
  readOnly = false,
  onAddCorridor,
}: BuilderTripLadderSectionProps) {
  useWatch({ control: form.control, name: "corridorIds" });
  const { data: frequentPairs = [] } = useFrequentCityPairs(
    { limit: 5 },
    { enabled: true },
  );

  const ruleIndexByType = useMemo(() => {
    const map = new Map<TripRouteType, number>();
    (watchedRules ?? []).forEach((rule, index) => {
      if (rule?.routeType) map.set(rule.routeType, index);
    });
    return map;
  }, [watchedRules]);

  const topSuggestion = frequentPairs[0];

  return (
    <div className="space-y-0" data-testid="builder-trip-ladder">
      <p className="mb-4 text-sm text-muted-foreground">{copy.tripsDescription}</p>

      {/* Paso 1 · Rutas fijas */}
      <div className="grid grid-cols-[28px_1fr] gap-3">
        <div>
          <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
            1
          </div>
        </div>
        <div className="min-w-0 space-y-2.5">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{copy.tripStep1Title}</p>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {copy.tripStep1Description}
              </p>
            </div>
            {!readOnly ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Route className="h-3.5 w-3.5" />}
                onClick={onAddCorridor}
              >
                {copy.tripStep1Add}
              </Button>
            ) : null}
          </div>
          <TemplateCorridorsSection control={form.control} stepPrefix="" />
          {topSuggestion ? (
            <div className="flex items-center gap-2.5 rounded-md bg-info/15 px-2.5 py-2 text-xs text-info-foreground">
              <span className="min-w-0 flex-1">
                {copy.frequentPairSuggest(
                  `${topSuggestion.originCity} → ${topSuggestion.destinationCity}`,
                  topSuggestion.tripCount,
                )}
              </span>
              {!readOnly ? (
                <button
                  type="button"
                  className="shrink-0 font-semibold underline-offset-2 hover:underline"
                  onClick={onAddCorridor}
                >
                  {copy.frequentPairAdd}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* Conector */}
      <div className="grid grid-cols-[28px_1fr] gap-3 py-2">
        <div className="mx-auto w-0.5 bg-border" aria-hidden />
        <div className="flex items-center gap-1.5 self-center text-xs font-semibold text-muted-foreground">
          <ArrowDown className="h-3 w-3" aria-hidden />
          {copy.tripConnector}
        </div>
      </div>

      {/* Paso 2 · Clases */}
      <div className="grid grid-cols-[28px_1fr] gap-3">
        <div>
          <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
            2
          </div>
        </div>
        <div className="min-w-0 space-y-3">
          <div>
            <p className="text-sm font-semibold">{copy.tripStep2Title}</p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {copy.tripStep2Description}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {ROUTE_ORDER.map((routeType) => {
              const index = ruleIndexByType.get(routeType) ?? null;
              return (
                <BuilderRulePhraseCard
                  key={routeType}
                  control={form.control}
                  routeType={routeType}
                  ruleIndex={index}
                  watchedRule={index != null ? watchedRules?.[index] : undefined}
                  appendRule={appendRule}
                  removeRule={removeRule}
                  readOnly={readOnly}
                />
              );
            })}
          </div>
          {/* ruleFields length kept for React field array identity */}
          <span className="sr-only">{ruleFields.length} reglas</span>
        </div>
      </div>

      {/* Conector suave */}
      <div className="grid grid-cols-[28px_1fr] gap-3 py-2">
        <div className="mx-auto w-0.5 bg-border" aria-hidden />
        <div />
      </div>

      {/* Paso 3 · Medio viaje */}
      <div className="grid grid-cols-[28px_1fr] gap-3">
        <div>
          <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">
            3
          </div>
        </div>
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-semibold">{copy.tripStep3Title}</p>
          <div className="grid gap-3 sm:grid-cols-[280px_1fr] sm:items-center">
            <RHFSelectField
              control={form.control}
              name="midTripPayoutPolicy"
              label=""
              options={MID_TRIP_OPTIONS}
              fieldId="mid-trip-payout-policy"
              disabled={readOnly}
            />
            <p className="text-xs text-muted-foreground">{copy.midTripPolicyHint}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
