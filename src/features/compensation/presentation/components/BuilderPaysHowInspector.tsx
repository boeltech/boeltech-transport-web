import { useMemo, useState } from "react";
import { useWatch, type Control } from "react-hook-form";
import { User } from "lucide-react";
import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";
import type { CompensationTemplate } from "../../domain/entities";
import type { CompensationTemplateFormData } from "../validation/compensationSchemas";
import { buildPaysHowProse } from "../utils/buildPaysHowProse";
import {
  DEFAULT_SAMPLE_WEEK_TRIPS,
  simulateCompensationWeek,
  type SampleWeekTrip,
} from "../utils/simulateCompensation";
import { compensationCopy } from "../copy/compensationCopy";
import { BuilderHistoryPanel } from "./BuilderHistoryPanel";

const copy = compensationCopy.builder;

interface BuilderPaysHowInspectorProps {
  control: Control<CompensationTemplateFormData>;
  template: CompensationTemplate;
  previewHref: string | null;
  onPreview: () => void;
  weekTotalFormatted: string | null;
  onWeekTotalChange?: (formatted: string | null) => void;
}

function formSnapshot(
  template: CompensationTemplate,
  values: Partial<CompensationTemplateFormData>,
): CompensationTemplate {
  return {
    ...template,
    name: values.name ?? template.name,
    description: values.description ?? template.description ?? null,
    paymentPeriod: values.paymentPeriod ?? template.paymentPeriod,
    salaryOnly: values.salaryOnly ?? template.salaryOnly,
    rules: values.rules ?? template.rules ?? [],
    fixedAllowances: values.fixedAllowances ?? template.fixedAllowances ?? [],
    deductions: values.deductions ?? template.deductions ?? [],
    corridorIds: values.corridorIds ?? template.corridorIds ?? [],
    corridors: template.corridors.filter((corridor) =>
      (values.corridorIds ?? template.corridorIds ?? []).includes(corridor.id),
    ),
  };
}

export function BuilderPaysHowInspector({
  control,
  template,
  previewHref,
  onPreview,
}: BuilderPaysHowInspectorProps) {
  const [trips, setTrips] = useState<SampleWeekTrip[]>(DEFAULT_SAMPLE_WEEK_TRIPS);
  const [showHistory, setShowHistory] = useState(false);
  const values = useWatch({ control });

  const snapshot = useMemo(
    () => formSnapshot(template, (values ?? {}) as Partial<CompensationTemplateFormData>),
    [template, values],
  );

  const prose = useMemo(() => buildPaysHowProse(snapshot), [snapshot]);

  const week = useMemo(
    () =>
      simulateCompensationWeek(
        snapshot.rules,
        snapshot.fixedAllowances,
        trips,
        snapshot.deductions,
      ),
    [snapshot, trips],
  );

  const tripLines = week.lines.filter((line) => line.group === "trips");
  const allowanceLines = week.lines.filter((line) => line.group === "allowances");
  const deductionLines = week.lines.filter((line) => line.group === "deductions");

  if (showHistory) {
    return (
      <div className="space-y-3">
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
          ← Así le pagas
        </Button>
        <BuilderHistoryPanel template={template} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-testid="builder-pays-how-inspector">
      <section className="rounded-xl border bg-card">
        <div className="px-5 pt-4">
          <h2 className="text-base font-semibold leading-6">{copy.paysHowTitle}</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{copy.paysHowSubtitle}</p>
        </div>
        <ul className="space-y-1.5 px-5 py-4 text-[13px] leading-5">
          {prose.map((line) => (
            <li key={line} className="list-disc list-inside">
              {line}
            </li>
          ))}
          {prose.length === 0 ? (
            <li className="list-none text-muted-foreground">{copy.reviewEmpty}</li>
          ) : null}
        </ul>
      </section>

      <section className="rounded-xl border bg-card">
        <div className="flex items-start gap-2 px-5 pt-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold leading-6">{copy.weekExampleTitle}</h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {copy.weekExampleSubtitle}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setTrips((current) =>
                current.length > 2
                  ? current.slice(0, 2)
                  : DEFAULT_SAMPLE_WEEK_TRIPS,
              )
            }
          >
            {copy.weekChangeTrips}
          </Button>
        </div>
        <div className="px-5 pb-5 pt-3">
          {tripLines.length > 0 ? (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {copy.weekGroupTrips}
              </p>
              {tripLines.map((line) => (
                <WeekLine key={line.id} line={line} />
              ))}
            </>
          ) : null}
          {allowanceLines.length > 0 ? (
            <>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {copy.weekGroupAllowances}
              </p>
              {allowanceLines.map((line) => (
                <WeekLine key={line.id} line={line} />
              ))}
            </>
          ) : null}
          {deductionLines.length > 0 ? (
            <>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {copy.weekGroupDeductions}
              </p>
              {deductionLines.map((line) => (
                <WeekLine key={line.id} line={line} negative />
              ))}
            </>
          ) : null}

          <div className="mt-1 flex items-baseline justify-between border-t-2 border-foreground pt-3">
            <span className="font-semibold">{copy.weekTotalLabel}</span>
            <b className="font-mono text-xl" data-testid="week-example-total">
              {week.formattedTotal}
            </b>
          </div>
          <p className="mt-2.5 text-xs text-muted-foreground">
            {copy.weekFooter(tripLines.length || trips.length)}
          </p>
          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<User className="h-3.5 w-3.5" />}
              disabled={!previewHref}
              onClick={onPreview}
            >
              {copy.weekTryOperator}
            </Button>
          </div>
        </div>
      </section>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-start text-muted-foreground"
        onClick={() => setShowHistory(true)}
      >
        {copy.historyTabLabel}
      </Button>
    </div>
  );
}

function WeekLine({
  line,
  negative,
}: {
  line: { label: string; formattedAmount: string; why: string };
  negative?: boolean;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 border-b border-border py-1.5 text-[13px]">
      <span>{line.label}</span>
      <span
        className={cn(
          "text-right font-mono tabular-nums",
          negative && "text-destructive",
        )}
      >
        {line.formattedAmount}
      </span>
      <span className="col-span-2 text-[11px] text-muted-foreground">{line.why}</span>
    </div>
  );
}

/** Expuesto para que el builder lea el total de la semana sin remontar el inspector. */
export function computeWeekTotalFormatted(
  template: CompensationTemplate,
  values: Partial<CompensationTemplateFormData>,
  trips: SampleWeekTrip[] = DEFAULT_SAMPLE_WEEK_TRIPS,
): string {
  const snapshot = formSnapshot(template, values);
  return simulateCompensationWeek(
    snapshot.rules,
    snapshot.fixedAllowances,
    trips,
    snapshot.deductions,
  ).formattedTotal;
}
