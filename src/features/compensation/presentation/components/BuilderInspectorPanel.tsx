import { useMemo } from "react";
import { useWatch, type Control } from "react-hook-form";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import type { CompensationTemplate } from "../../domain/entities";
import { buildTemplateStructuredSummary } from "../utils/buildTemplateSummary";
import { getTemplateCompleteness } from "../utils/getTemplateCompleteness";
import type { CompensationTemplateFormData } from "../validation/compensationSchemas";
import { compensationCopy } from "../copy/compensationCopy";
import { BuilderSimulationPanel } from "./BuilderSimulationPanel";
import { BuilderHistoryPanel } from "./BuilderHistoryPanel";

const copy = compensationCopy.builder;
const simCopy = compensationCopy.simulation;

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
 * Inspector: tabs Resumen ↔ Simulación ↔ Historial (Tabs canónico DS).
 */
export function BuilderInspectorPanel({
  control,
  template,
}: BuilderInspectorPanelProps) {
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

  return (
    <div className="space-y-4 text-sm">
      <Tabs defaultValue="summary">
        <TabsList aria-label="Inspector" className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">{simCopy.summaryTabLabel}</TabsTrigger>
          <TabsTrigger value="simulation">{simCopy.tabLabel}</TabsTrigger>
          <TabsTrigger value="history">{copy.historyTabLabel}</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-5">
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
        </TabsContent>

        <TabsContent value="simulation">
          <BuilderSimulationPanel control={control} template={template} />
        </TabsContent>

        <TabsContent value="history">
          <BuilderHistoryPanel template={template} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
