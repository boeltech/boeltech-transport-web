import { useId, useMemo } from "react";
import { ChevronDown, ChevronRight, Users } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";
import type { CompensationTemplate } from "../../domain/entities";
import { CompensationActiveStatusBadge } from "../config/compensationStatusConfig";
import { compensationCopy } from "../copy/compensationCopy";
import { buildTemplateCompositionBlocks } from "../utils/buildTemplateCompositionBlocks";
import { buildTemplateSummary } from "../utils/buildTemplateSummary";
import { getTemplateCompleteness } from "../utils/getTemplateCompleteness";
import { CompensationTemplateActions } from "./CompensationTemplateActions";
import { TemplateCompositionPanel } from "./TemplateCompositionPanel";

const copy = compensationCopy.compositionCanvas;

interface TemplateCompositionCardProps {
  template: CompensationTemplate;
  variant?: "canvas" | "master";
  isExpanded?: boolean;
  isSelected?: boolean;
  isEditing?: boolean;
  canUpdate?: boolean;
  isDuplicating?: boolean;
  pendingEmployeeId?: string;
  /** When set, primary edit CTA opens Builder (ADR-0091). */
  editHref?: string;
  onToggleExpand?: () => void;
  onSelect?: () => void;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  onEditSuccess?: () => void;
  onDuplicate?: () => void;
  onAssignEmployee?: (templateId: string) => void;
  onShowOperators?: () => void;
  onDeleted?: () => void;
  className?: string;
}

function MetricChip({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center rounded-md border bg-background px-2 py-0.5 text-xs text-muted-foreground">
      <span className="font-mono tabular-nums text-foreground">{value}</span>
      <span className="ml-1">{label}</span>
    </span>
  );
}

export function TemplateCompositionCard({
  template,
  variant = "canvas",
  isExpanded = false,
  isSelected = false,
  isEditing = false,
  canUpdate = false,
  isDuplicating = false,
  pendingEmployeeId,
  editHref,
  onToggleExpand,
  onSelect,
  onStartEdit,
  onCancelEdit,
  onEditSuccess,
  onDuplicate,
  onAssignEmployee,
  onShowOperators,
  onDeleted,
  className,
}: TemplateCompositionCardProps) {
  const panelId = useId();
  const isMaster = variant === "master";
  const blocks = useMemo(() => buildTemplateCompositionBlocks(template), [template]);
  const completeness = useMemo(() => getTemplateCompleteness(template), [template]);
  const summary = useMemo(() => buildTemplateSummary(template), [template]);
  const [rulesBlock, allowancesBlock, corridorsBlock] = blocks;

  const expandLabel = copy.expandCard.replace("{{name}}", template.name);
  const collapseLabel = copy.collapseCard.replace("{{name}}", template.name);
  const showAssignCta = Boolean(pendingEmployeeId && canUpdate && !isEditing);

  const handleExpandFromSummary = () => {
    if (!isExpanded) {
      onToggleExpand?.();
    }
  };

  const handleMasterSelect = () => {
    onSelect?.();
  };

  return (
    <article
      className={cn(
        "rounded-xl border bg-card p-4 shadow-sm transition-colors",
        isMaster && "cursor-pointer hover:bg-muted/30",
        isMaster && isSelected && "ring-2 ring-primary/30 bg-primary/5",
        !isMaster && isExpanded && "ring-1 ring-primary/20",
        !isMaster && isEditing && "ring-1 ring-primary/30",
        className,
      )}
      onClick={isMaster ? handleMasterSelect : undefined}
      onKeyDown={
        isMaster
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleMasterSelect();
              }
            }
          : undefined
      }
      role={isMaster ? "option" : undefined}
      tabIndex={isMaster ? 0 : undefined}
      aria-selected={isMaster ? isSelected : undefined}
      aria-label={isMaster ? template.name : undefined}
    >
      <header className="flex flex-wrap items-start gap-3">
        {!isMaster ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-0.5 h-8 w-8 shrink-0"
            aria-expanded={isExpanded}
            aria-controls={panelId}
            aria-label={isExpanded ? collapseLabel : expandLabel}
            onClick={onToggleExpand}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : null}

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-foreground">{template.name}</h3>
            <CompensationActiveStatusBadge isActive={template.isActive} />
            {isEditing ? (
              <Badge variant="info" tone="soft">{copy.editingBadge}</Badge>
            ) : null}
            {!completeness.isComplete ? (
              <Badge variant="warning" tone="soft">{copy.incompleteBadge}</Badge>
            ) : null}
          </div>
          {template.description ? (
            <p
              className={cn(
                "text-sm text-muted-foreground",
                !isMaster && isExpanded ? "line-clamp-2" : "line-clamp-1",
              )}
            >
              {template.description}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {showAssignCta ? (
            <Button
              type="button"
              size="sm"
              leftIcon={<Users className="h-4 w-4" />}
              onClick={(event) => {
                event.stopPropagation();
                onAssignEmployee?.(template.id);
              }}
            >
              {copy.assignHere}
            </Button>
          ) : !isMaster && isExpanded && onShowOperators ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              leftIcon={<Users className="h-4 w-4" />}
              onClick={(event) => {
                event.stopPropagation();
                onShowOperators();
              }}
            >
              {copy.viewOperators}
            </Button>
          ) : null}
          {!isMaster ? (
            <CompensationTemplateActions template={template} onDeleted={onDeleted} />
          ) : null}
        </div>
      </header>

      {isMaster || !isExpanded ? (
        <div
          className={cn(
            "mt-3 space-y-3 rounded-md",
            isMaster ? "pt-0.5" : "cursor-pointer pl-11 transition-colors hover:bg-muted/30",
          )}
          onClick={!isMaster ? handleExpandFromSummary : undefined}
        >
          <div className={cn("flex flex-wrap gap-2", !isMaster && "pt-0.5")}>
            <MetricChip label={copy.metrics.rules} value={rulesBlock.items.length} />
            <MetricChip label={copy.metrics.allowances} value={allowancesBlock.items.length} />
            <MetricChip label={copy.metrics.corridors} value={corridorsBlock.items.length} />
          </div>
          <p className="text-sm text-muted-foreground tabular-nums">{summary}</p>
        </div>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-2 pl-11">
            <MetricChip label={copy.metrics.rules} value={rulesBlock.items.length} />
            <MetricChip label={copy.metrics.allowances} value={allowancesBlock.items.length} />
            <MetricChip label={copy.metrics.corridors} value={corridorsBlock.items.length} />
          </div>
          <div className="pl-11">
            <TemplateCompositionPanel
              template={template}
              id={panelId}
              mode={isEditing ? "edit" : "view"}
              canUpdate={canUpdate}
              hideDetailLink
              isDuplicating={isDuplicating}
              editHref={editHref}
              onEdit={onStartEdit}
              onCancelEdit={onCancelEdit}
              onEditSuccess={onEditSuccess}
              onDuplicate={onDuplicate}
              onShowOperatorsTab={onShowOperators}
            />
          </div>
        </>
      )}
    </article>
  );
}
