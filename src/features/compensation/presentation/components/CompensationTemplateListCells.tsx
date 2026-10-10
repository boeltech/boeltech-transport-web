import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@shared/ui/tooltip";
import type { CompensationTemplate } from "../../domain/entities";
import { CompensationTemplateDisplayStatusBadge } from "../config/compensationStatusConfig";
import { compensationCopy } from "../copy/compensationCopy";
import { buildTemplateListSummary } from "../utils/buildTemplateListSummary";
import type { BranchNameMap } from "../utils/formatCorridorRoute";
import {
  getFamilySupersededOperators,
  getTemplateStatusLine,
} from "../utils/getTemplateStatusLine";
import { isTemplateDimmed } from "../utils/templateListRow";

const copy = compensationCopy.templates;
const summaryCopy = copy.listSummary;
const familyCopy = copy.family;

/** PRD D15/D16: vigentes + «· +k programada(s)» tenue; sin el campo (API vieja) o en 0, solo el número. */
export function TemplateOperatorsCount({
  template,
  className,
}: {
  template: CompensationTemplate;
  className?: string;
}) {
  const current = template.activeAssignmentsCount ?? 0;
  const scheduled = template.scheduledAssignmentsCount ?? 0;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            className={cn("cursor-help whitespace-nowrap rounded-md tabular-nums", className)}
            data-testid="template-operators-count-trigger"
          >
            {current}
            {scheduled > 0 ? (
              <span className="font-normal text-muted-foreground">
                {` · ${copy.operatorsScheduled(scheduled)}`}
              </span>
            ) : null}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          {copy.operatorsTooltip(current, scheduled)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** PRD D18: botón que despliega la familia; nunca abre el panel. */
export function FamilySupersededOperatorsLine({
  template,
  onExpandFamily,
}: {
  template: CompensationTemplate;
  onExpandFamily: () => void;
}) {
  const operators = getFamilySupersededOperators(template);
  if (!operators) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="whitespace-nowrap rounded-sm text-left text-xs text-warning hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-testid="template-family-superseded-operators"
            onClick={(event) => {
              event.stopPropagation();
              onExpandFamily();
            }}
          >
            {familyCopy.supersededOperators(operators.total)}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" align="start" className="max-w-xs text-xs">
          {familyCopy.supersededOperatorsTooltip(operators.current, operators.scheduled)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Insignia + línea gris solo si aporta (PRD D10); en la fila activa, aviso D18 si aplica. */
export function TemplateStatusCell({
  template,
  onExpandFamily,
}: {
  template: CompensationTemplate;
  /** Solo en filas de familia: habilita el aviso de operadores en versiones reemplazadas. */
  onExpandFamily?: () => void;
}) {
  const showFamilyWarning =
    Boolean(onExpandFamily) && getFamilySupersededOperators(template) !== null;
  const line = showFamilyWarning ? null : getTemplateStatusLine(template);

  return (
    <div className="flex min-h-10 flex-col items-start justify-center gap-0.5">
      <CompensationTemplateDisplayStatusBadge template={template} />
      {showFamilyWarning && onExpandFamily ? (
        <FamilySupersededOperatorsLine template={template} onExpandFamily={onExpandFamily} />
      ) : line ? (
        <span
          className="whitespace-nowrap text-xs text-muted-foreground"
          data-testid="template-status-line"
        >
          {line}
        </span>
      ) : null}
    </div>
  );
}

/** Segmentos sin partir: el salto solo cae entre segmentos, nunca dentro de un importe. */
function SummarySegments({ segments }: { segments: string[] }) {
  return segments.map((segment, index) => (
    <span key={`${segment}-${index}`}>
      {index > 0 ? " · " : null}
      <span className="whitespace-nowrap">{segment}</span>
    </span>
  ));
}

/** «Cómo se paga» compacto, máx. 2 líneas + tooltip con el detalle (PRD D7–D9). */
export function TemplateSummaryCell({
  template,
  branchNameMap,
}: {
  template: CompensationTemplate;
  branchNameMap?: BranchNameMap;
}) {
  const summary = useMemo(
    () => buildTemplateListSummary(template, branchNameMap),
    [template, branchNameMap],
  );
  const dimmed = isTemplateDimmed(template);

  const content = (
    <div className="flex min-h-10 flex-col justify-center text-sm" data-testid="template-summary">
      <p
        className={cn(
          "line-clamp-1",
          summary.isEmpty || dimmed ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {summary.isEmpty ? copy.summaryEmpty : <SummarySegments segments={summary.primary} />}
      </p>
      {summary.secondary.length > 0 ? (
        <p className="line-clamp-1 text-xs text-muted-foreground">
          <SummarySegments segments={summary.secondary} />
        </p>
      ) : null}
    </div>
  );

  if (summary.tooltip.length === 0) return content;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            tabIndex={0}
            className="cursor-help rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-testid="template-summary-trigger"
          >
            {content}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" align="start" className="max-w-sm text-xs">
          <p className="font-medium">{summaryCopy.tooltipTitle}</p>
          <ul className="mt-1 space-y-0.5">
            {summary.tooltip.map((line, index) => (
              <li key={`${line}-${index}`}>{line}</li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** PRD D16: «Otras versiones (n)» / «Ocultar otras versiones»; no propaga a la fila. */
export function FamilyVersionsToggle({
  template,
  expanded,
  controlsId,
  onToggle,
}: {
  template: CompensationTemplate;
  expanded: boolean;
  controlsId: string;
  onToggle: () => void;
}) {
  const otherCount = (template.family?.versionsCount ?? 1) - 1;
  if (otherCount < 1) return null;

  return (
    <button
      type="button"
      className="flex items-center gap-1 rounded-sm text-xs text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-expanded={expanded}
      aria-controls={controlsId}
      aria-label={
        expanded
          ? familyCopy.hideOtherVersionsAria(template.name)
          : familyCopy.otherVersionsAria(template.name, otherCount)
      }
      data-testid="template-family-toggle"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
    >
      <ChevronRight
        aria-hidden="true"
        className={cn("h-3.5 w-3.5 shrink-0 transition-transform", expanded && "rotate-90")}
      />
      {expanded ? familyCopy.hideOtherVersions : familyCopy.otherVersions(otherCount)}
    </button>
  );
}
