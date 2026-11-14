/**
 * CompensationTemplatesTable — listado Operate (`EntityListTable`).
 *
 * Nombre · Estado · Cómo se paga · Operadores · ⋯. Familias vía `renderAfterRow`.
 * Empty → null (ListPageShell). `framed={false}`. Layout `cards` = móvil (sin EntityListTable).
 */

import { useCallback, useState } from "react";
import { cn } from "@shared/lib/utils/cn";
import { Card, CardContent } from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListStackedValue,
} from "@shared/ui/table";
import type { CompensationTemplate } from "../../domain/entities";
import { compensationCopy } from "../copy/compensationCopy";
import type { BranchNameMap } from "../utils/formatCorridorRoute";
import { getFamilySupersededOperators } from "../utils/getTemplateStatusLine";
import { CompensationTemplateActions } from "./CompensationTemplateActions";
import { isTemplateDimmed } from "../utils/templateListRow";
import {
  FamilySupersededOperatorsLine,
  FamilyVersionsToggle,
  TemplateOperatorsCount,
  TemplateStatusCell,
  TemplateSummaryCell,
} from "./CompensationTemplateListCells";
import {
  TemplateFamilyVersionCards,
  TemplateFamilyVersionRows,
} from "./TemplateFamilyVersions";

const copy = compensationCopy.templates;

interface CompensationTemplatesTableProps {
  templates: CompensationTemplate[];
  isLoading?: boolean;
  pendingEmployeeId?: string;
  /** Nombres de sucursal para origen/destino de rutas fijas en el tooltip. */
  branchNameMap?: BranchNameMap;
  /** Desktop table vs compact mobile cards. Default: table. */
  layout?: "table" | "cards";
  /** Familias desplegadas (por `familyId`); sin prop, el estado vive en la tabla. */
  expandedFamilyIds?: ReadonlySet<string>;
  onFamilyExpandedChange?: (familyId: string, expanded: boolean) => void;
  onOpenOperators: (templateId: string, assignEmployeeId?: string) => void;
  onDeleted?: () => void;
}

function familyVersionsContainerId(template: CompensationTemplate): string {
  return `template-family-${template.familyId}-versions`;
}

/** Filas agrupadas se identifican por familia: al activar otra versión cambia el id de la fila. */
function rowKey(template: CompensationTemplate): string {
  return template.family ? template.familyId : template.id;
}

function hasOtherVersions(template: CompensationTemplate): boolean {
  return (template.family?.versionsCount ?? 1) > 1;
}

/** Nombre como botón enfocable: Enter abre el panel de Operadores (PRD D1). */
function TemplateNameButton({
  template,
  onOpenOperators,
}: {
  template: CompensationTemplate;
  onOpenOperators: (templateId: string) => void;
}) {
  return (
    <div className="flex min-w-0 items-baseline gap-2">
      <button
        type="button"
        aria-label={copy.rowAriaLabel(template.name, template.version)}
        className={cn(
          "min-w-0 truncate rounded-sm text-left font-medium hover:underline",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isTemplateDimmed(template) && "text-muted-foreground",
        )}
        data-template-focus-id={template.id}
        onClick={(event) => {
          event.stopPropagation();
          onOpenOperators(template.id);
        }}
      >
        {template.name}
      </button>
      <span className="shrink-0 text-xs text-muted-foreground">
        {copy.versionLabel(template.version)}
      </span>
    </div>
  );
}

function useFamilyExpansion(
  expandedFamilyIds: ReadonlySet<string> | undefined,
  onFamilyExpandedChange: ((familyId: string, expanded: boolean) => void) | undefined,
) {
  const [internalExpanded, setInternalExpanded] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const expanded = expandedFamilyIds ?? internalExpanded;

  const setExpanded = useCallback(
    (familyId: string, next: boolean) => {
      if (onFamilyExpandedChange) {
        onFamilyExpandedChange(familyId, next);
        return;
      }
      setInternalExpanded((current) => {
        const updated = new Set(current);
        if (next) updated.add(familyId);
        else updated.delete(familyId);
        return updated;
      });
    },
    [onFamilyExpandedChange],
  );

  return { expanded, setExpanded };
}

interface FamilyRowProps {
  template: CompensationTemplate;
  expanded: boolean;
  pendingEmployeeId?: string;
  branchNameMap?: BranchNameMap;
  onExpandedChange: (familyId: string, expanded: boolean) => void;
  onOpenOperators: (templateId: string, assignEmployeeId?: string) => void;
  onDeleted?: () => void;
}

function TemplateCatalogCard({
  template,
  expanded,
  pendingEmployeeId,
  branchNameMap,
  onExpandedChange,
  onOpenOperators,
  onDeleted,
}: FamilyRowProps) {
  const isOpen = expanded && hasOtherVersions(template);
  const containerId = familyVersionsContainerId(template);
  const hasFamilyFooter =
    hasOtherVersions(template) || getFamilySupersededOperators(template) !== null;

  return (
    <div className="space-y-2">
      <Card
        className="relative cursor-pointer shadow-sm transition-colors hover:bg-muted/30"
        onClick={() => onOpenOperators(template.id)}
        data-testid="template-catalog-card"
      >
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-2 pr-9">
            <div className="min-w-0 space-y-1">
              <TemplateNameButton template={template} onOpenOperators={onOpenOperators} />
              <TemplateStatusCell template={template} />
            </div>
            <TemplateOperatorsCount
              template={template}
              className="shrink-0 pt-1.5 text-sm font-medium text-foreground"
            />
          </div>
          <TemplateSummaryCell template={template} branchNameMap={branchNameMap} />
          <CompensationTemplateActions
            template={template}
            layout="cards"
            pendingEmployeeId={pendingEmployeeId}
            onOpenOperators={onOpenOperators}
            onDeleted={onDeleted}
          />
          {hasFamilyFooter ? (
            <div
              className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-2"
              data-testid="template-card-family-footer"
            >
              <FamilySupersededOperatorsLine
                template={template}
                onExpandFamily={() => onExpandedChange(template.familyId, true)}
              />
              <FamilyVersionsToggle
                template={template}
                expanded={isOpen}
                controlsId={containerId}
                onToggle={() => onExpandedChange(template.familyId, !isOpen)}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
      {isOpen ? (
        <TemplateFamilyVersionCards
          row={template}
          containerId={containerId}
          pendingEmployeeId={pendingEmployeeId}
          onOpenOperators={onOpenOperators}
          onDeleted={onDeleted}
        />
      ) : null}
    </div>
  );
}

function buildColumns(
  props: Pick<
    CompensationTemplatesTableProps,
    "pendingEmployeeId" | "branchNameMap" | "onOpenOperators" | "onDeleted"
  > & {
    expanded: ReadonlySet<string>;
    setExpanded: (familyId: string, expanded: boolean) => void;
  },
): EntityListColumnDef<CompensationTemplate>[] {
  const {
    pendingEmployeeId,
    branchNameMap,
    onOpenOperators,
    onDeleted,
    expanded,
    setExpanded,
  } = props;

  return [
    {
      id: "name",
      header: copy.columns.name,
      kind: "primary",
      className: "max-w-64",
      accessor: (template): EntityListStackedValue => {
        const isOpen =
          expanded.has(template.familyId) && hasOtherVersions(template);
        return {
          primary: (
            <TemplateNameButton
              template={template}
              onOpenOperators={onOpenOperators}
            />
          ),
          secondary: hasOtherVersions(template) ? (
            <FamilyVersionsToggle
              template={template}
              expanded={isOpen}
              controlsId={familyVersionsContainerId(template)}
              onToggle={() => setExpanded(template.familyId, !isOpen)}
            />
          ) : undefined,
        };
      },
    },
    {
      id: "status",
      header: copy.columns.status,
      kind: "status",
      accessor: (template) => (
        <TemplateStatusCell
          template={template}
          onExpandFamily={() => setExpanded(template.familyId, true)}
        />
      ),
    },
    {
      id: "summary",
      header: copy.columns.summary,
      kind: "text",
      className: "min-w-72",
      accessor: (template) => (
        <TemplateSummaryCell template={template} branchNameMap={branchNameMap} />
      ),
    },
    {
      id: "operators",
      header: copy.columns.operators,
      kind: "number",
      accessor: (template) => <TemplateOperatorsCount template={template} />,
    },
    {
      id: "actions",
      header: "",
      kind: "actions",
      className: "w-56",
      headerClassName: "w-56",
      accessor: (template) => (
        <CompensationTemplateActions
          template={template}
          pendingEmployeeId={pendingEmployeeId}
          onOpenOperators={onOpenOperators}
          onDeleted={onDeleted}
        />
      ),
    },
  ];
}

export function CompensationTemplatesTable({
  templates,
  isLoading,
  pendingEmployeeId,
  branchNameMap,
  layout = "table",
  expandedFamilyIds,
  onFamilyExpandedChange,
  onOpenOperators,
  onDeleted,
}: CompensationTemplatesTableProps) {
  const { expanded, setExpanded } = useFamilyExpansion(
    expandedFamilyIds,
    onFamilyExpandedChange,
  );

  if (layout === "cards") {
    if (isLoading) {
      return (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      );
    }

    return (
      <div className="grid gap-3">
        {templates.map((template) => (
          <TemplateCatalogCard
            key={rowKey(template)}
            template={template}
            expanded={expanded.has(template.familyId)}
            pendingEmployeeId={pendingEmployeeId}
            branchNameMap={branchNameMap}
            onExpandedChange={setExpanded}
            onOpenOperators={onOpenOperators}
            onDeleted={onDeleted}
          />
        ))}
      </div>
    );
  }

  const columns = buildColumns({
    pendingEmployeeId,
    branchNameMap,
    onOpenOperators,
    onDeleted,
    expanded,
    setExpanded,
  });

  return (
    <EntityListTable
      framed={false}
      density="list"
      columns={columns}
      rows={templates}
      getRowId={rowKey}
      isLoading={isLoading}
      onRowActivate={(template) => onOpenOperators(template.id)}
      renderAfterRow={(template) => {
        const isOpen =
          expanded.has(template.familyId) && hasOtherVersions(template);
        if (!isOpen) return null;
        return (
          <TemplateFamilyVersionRows
            row={template}
            containerId={familyVersionsContainerId(template)}
            pendingEmployeeId={pendingEmployeeId}
            branchNameMap={branchNameMap}
            onOpenOperators={onOpenOperators}
            onDeleted={onDeleted}
          />
        );
      }}
    />
  );
}
