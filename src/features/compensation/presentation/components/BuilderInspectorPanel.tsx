import { useMemo, useState } from "react";
import { useWatch, type Control } from "react-hook-form";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { cn } from "@shared/lib/utils/cn";
import type { CompensationTemplate } from "../../domain/entities";
import { buildTemplateStructuredSummary } from "../utils/buildTemplateSummary";
import { getTemplateCompleteness } from "../utils/getTemplateCompleteness";
import type { CompensationTemplateFormData } from "../validation/compensationSchemas";
import { compensationCopy } from "../copy/compensationCopy";
import { BuilderSimulationPanel } from "./BuilderSimulationPanel";
import { BuilderHistoryPanel } from "./BuilderHistoryPanel";

const copy = compensationCopy.builder;
const simCopy = compensationCopy.simulation;

type InspectorTab = "summary" | "simulation" | "history";

interface BuilderInspectorPanelProps {
  control: Control<CompensationTemplateFormData>;
  template: CompensationTemplate;
}

function formValuesToTemplate(
  template: CompensationTemplate,
  values: Partial<CompensationTemplateFormData> | CompensationTemplateFormData,
): CompensationTemplate {
  return {
    ...template,
    name: values.name ?? template.name,
    description: values.description ?? template.description ?? null,
    isActive: values.isActive ?? template.isActive,
    rules: values.rules ?? template.rules ?? [],
    fixedAllowances: values.fixedAllowances ?? template.fixedAllowances ?? [],
    deductions: values.deductions ?? template.deductions ?? [],
    corridorIds: values.corridorIds ?? template.corridorIds ?? [],
    corridors: template.corridors.filter((corridor) =>
      (values.corridorIds ?? template.corridorIds ?? []).includes(corridor.id),
    ),
  };
}

/**
 * Inspector: tabs Resumen ↔ Simulación ↔ Historial.
 */
export function BuilderInspectorPanel({
  control,
  template,
}: BuilderInspectorPanelProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>("summary");
  const values = useWatch({ control });

  const snapshot = useMemo(
    () =>
      formValuesToTemplate(
        template,
        (values ?? {}) as Partial<CompensationTemplateFormData>,
      ),
    [template, values],
  );

  const summaryLines = useMemo(
    () => buildTemplateStructuredSummary(snapshot),
    [snapshot],
  );
  const completeness = useMemo(() => getTemplateCompleteness(snapshot), [snapshot]);

  const tabs: { id: InspectorTab; label: string }[] = [
    { id: "summary", label: simCopy.summaryTabLabel },
    { id: "simulation", label: simCopy.tabLabel },
    { id: "history", label: copy.historyTabLabel },
  ];

  return (
    <div className="space-y-4 text-sm">
      <div
        role="tablist"
        aria-label="Inspector"
        className="flex rounded-md border bg-muted/30 p-0.5"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 rounded-sm px-2 py-1.5 text-xs font-medium transition-colors",
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "summary" ? (
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {copy.inspectorLiveLabel}
            </p>
            {snapshot.fixedAllowances.length > 0 ? (
              <p className="mb-2 text-xs text-muted-foreground">{copy.inspectorAllowancesHint}</p>
            ) : null}
            {snapshot.deductions.length > 0 ? (
              <p className="mb-2 text-xs text-muted-foreground">{copy.inspectorDeductionsHint}</p>
            ) : null}
            {summaryLines.length > 0 ? (
              <ul className="space-y-1.5 text-foreground break-words">
                {summaryLines.map((line) => (
                  <li
                    key={line.id}
                    className={
                      line.variant === "hint"
                        ? "text-xs text-muted-foreground"
                        : undefined
                    }
                  >
                    {line.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">{copy.reviewEmpty}</p>
            )}
          </div>

          {!completeness.isComplete ? (
            <Alert variant="warning">
              <AlertDescription>{copy.reviewIncomplete}</AlertDescription>
            </Alert>
          ) : (
            <p className="text-xs text-success">{copy.completenessOk}</p>
          )}
        </div>
      ) : null}

      {activeTab === "simulation" ? (
        <BuilderSimulationPanel control={control} template={template} />
      ) : null}

      {activeTab === "history" ? <BuilderHistoryPanel template={template} /> : null}
    </div>
  );
}
