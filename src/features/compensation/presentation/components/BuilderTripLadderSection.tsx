import { useMemo, useState } from "react";
import { Controller, useWatch } from "react-hook-form";
import { ArrowDown, Route, X } from "lucide-react";
import { Button } from "@shared/ui/button";
import { RHFSelectField } from "@shared/ui/form";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { BranchStatus, useBranches } from "@features/branches";
import {
  MID_TRIP_PAYOUT_POLICY_LABELS,
  type MidTripPayoutPolicy,
} from "@features/settlements/domain/enums";
import type { TripRouteType } from "@features/settlements";
import { useFrequentCityPairs } from "../../application/hooks";
import { useCorridorTariffs } from "../../application/hooks/useCorridors";
import { CORRIDOR_REF_TYPE_LABELS } from "../../domain/enums";
import type { UseCompensationTemplateFormResult } from "../hooks/useCompensationTemplateForm";
import { compensationCopy } from "../copy/compensationCopy";
import {
  buildBranchNameMap,
  formatCorridorRouteHuman,
} from "../utils/formatCorridorRoute";
import { BuilderAddCorridorsSheet } from "./BuilderAddCorridorsSheet";
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
};

export function BuilderTripLadderSection({
  form,
  ruleFields,
  appendRule,
  removeRule,
  watchedRules,
  readOnly = false,
}: BuilderTripLadderSectionProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const corridorIds =
    useWatch({ control: form.control, name: "corridorIds" }) ?? [];
  const midTripPayoutPolicy = useWatch({
    control: form.control,
    name: "midTripPayoutPolicy",
  }) as MidTripPayoutPolicy | undefined;
  const midTripHint =
    (midTripPayoutPolicy && copy.midTripPolicyHints[midTripPayoutPolicy]) ||
    copy.midTripPolicyHint;
  const { data: frequentPairs = [] } = useFrequentCityPairs(
    { limit: 5 },
    { enabled: true },
  );
  const { data: corridorsData } = useCorridorTariffs({
    isActive: true,
    pageSize: 100,
  });
  const corridors = corridorsData?.data ?? [];

  const { data: branchesData } = useBranches({
    page: 1,
    limit: 100,
    filters: {
      isActive: true,
      status: BranchStatus.ACTIVE,
    },
    sort: {
      field: "name",
      direction: "asc",
    },
  });

  const branchNameMap = useMemo(
    () => buildBranchNameMap(branchesData?.data ?? []),
    [branchesData?.data],
  );

  const assignedCorridors = useMemo(() => {
    const byId = new Map(corridors.map((corridor) => [corridor.id, corridor]));
    return corridorIds
      .map((id) => byId.get(id))
      .filter((corridor): corridor is NonNullable<typeof corridor> =>
        Boolean(corridor),
      );
  }, [corridorIds, corridors]);

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
                onClick={() => setPickerOpen(true)}
              >
                {copy.tripStep1Add}
              </Button>
            ) : null}
          </div>

          {assignedCorridors.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">
              {copy.tripStep1Empty}
            </p>
          ) : (
            <div
              className="overflow-hidden rounded-md border"
              data-testid="builder-assigned-corridors"
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2 font-medium">
                      {copy.tripStep1Columns.route}
                    </th>
                    <th className="px-3 py-2 font-medium">
                      {copy.tripStep1Columns.matchBy}
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      {copy.tripStep1Columns.pays}
                    </th>
                    {!readOnly ? <th className="w-10 px-2 py-2" /> : null}
                  </tr>
                </thead>
                <tbody>
                  {assignedCorridors.map((corridor) => (
                    <tr key={corridor.id} className="border-b last:border-b-0">
                      <td className="px-3 py-2">
                        <div className="font-medium">
                          {formatCorridorRouteHuman(corridor, branchNameMap)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {corridor.name}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {CORRIDOR_REF_TYPE_LABELS[corridor.originRefType]}
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">
                        {formatMxCurrency(corridor.fixedAmount)}
                      </td>
                      {!readOnly ? (
                        <td className="px-2 py-2 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            aria-label={copy.tripStep1Remove}
                            onClick={() => {
                              form.setValue(
                                "corridorIds",
                                corridorIds.filter((id) => id !== corridor.id),
                                { shouldDirty: true },
                              );
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {topSuggestion ? (
            <div className="flex items-center gap-2.5 rounded-md bg-info-soft px-2.5 py-2 text-xs text-info-soft-foreground">
              <span className="min-w-0 flex-1">
                {copy.frequentPairSuggest(
                  `${topSuggestion.originCity} → ${topSuggestion.destinationCity}`,
                  topSuggestion.tripCount,
                )}
              </span>
              {!readOnly ? (
                <button
                  type="button"
                  className="shrink-0 font-semibold text-info-soft-foreground underline-offset-2 hover:underline"
                  onClick={() => setPickerOpen(true)}
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
            <p className="text-xs text-muted-foreground">{midTripHint}</p>
          </div>
        </div>
      </div>

      <Controller
        control={form.control}
        name="corridorIds"
        render={({ field }) => (
          <BuilderAddCorridorsSheet
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            selectedIds={field.value ?? []}
            onChange={(ids) => field.onChange(ids)}
            readOnly={readOnly}
          />
        )}
      />
    </div>
  );
}
