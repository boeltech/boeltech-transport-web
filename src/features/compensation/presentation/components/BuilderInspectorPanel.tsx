import { useMemo } from "react";
import { useWatch, type Control } from "react-hook-form";
import { Alert, AlertDescription } from "@shared/ui/alert";
import type { CompensationTemplate } from "../../domain/entities";
import { buildTemplateStructuredSummary } from "../utils/buildTemplateSummary";
import { getTemplateCompleteness } from "../utils/getTemplateCompleteness";
import type { CompensationTemplateFormData } from "../validation/compensationSchemas";
import { compensationCopy } from "../copy/compensationCopy";

const copy = compensationCopy.builder;

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
    corridorIds: values.corridorIds ?? template.corridorIds ?? [],
    corridors: template.corridors.filter((corridor) =>
      (values.corridorIds ?? template.corridorIds ?? []).includes(corridor.id),
    ),
  };
}

/**
 * Inspector: resumen en vivo de lo construido + estado de completitud.
 * La vista previa vive solo en el footer.
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
    <div className="space-y-5 text-sm">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {copy.inspectorLiveLabel}
        </p>
        {summaryLines.length > 0 ? (
          <ul className="space-y-1.5 text-foreground break-words">
            {summaryLines.map((line) => (
              <li key={line.id}>{line.text}</li>
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
  );
}
