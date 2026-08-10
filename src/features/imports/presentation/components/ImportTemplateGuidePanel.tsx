/**
 * Guía de columnas de la plantilla CSV (paso Archivo del wizard).
 */

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { cn } from "@shared/lib/utils/cn";
import type { ImportImplementedEntityType } from "../../domain";
import {
  IMPORT_TEMPLATE_GUIDES,
  importTemplateGuideCopy,
  type TemplateColumnGuide,
  type TemplateColumnRequirement,
  type TemplateGuideSectionId,
} from "../copy/importTemplateGuide";

export interface ImportTemplateGuidePanelProps {
  entityType: ImportImplementedEntityType;
}

function RequirementBadge({
  requirement,
}: {
  requirement: TemplateColumnRequirement;
}) {
  const variant =
    requirement === "required"
      ? "default"
      : requirement === "recommended"
        ? "secondary"
        : "outline";
  return (
    <Badge variant={variant} className="shrink-0 text-[10px] font-normal">
      {importTemplateGuideCopy.requirementLabel(requirement)}
    </Badge>
  );
}

function ColumnRow({ column }: { column: TemplateColumnGuide }) {
  return (
    <li className="border-b border-border/60 py-2.5 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-medium leading-snug">{column.label}</p>
          <p className="text-xs text-muted-foreground">
            {importTemplateGuideCopy.technicalHint(column.header)}
          </p>
        </div>
        <RequirementBadge requirement={column.requirement} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{column.tip}</p>
      {column.writeAs ? (
        <p className="mt-1 text-xs text-foreground/90">
          <span className="font-medium">En la celda: </span>
          {column.writeAs}
        </p>
      ) : null}
    </li>
  );
}

function CompactColumnList({
  columns,
}: {
  columns: ReadonlyArray<TemplateColumnGuide>;
}) {
  const primary = columns.filter((c) => c.requirement !== "optional");
  const optional = columns.filter((c) => c.requirement === "optional");

  return (
    <div className="space-y-3">
      <ul className="list-none">
        {primary.map((column) => (
          <ColumnRow key={column.header} column={column} />
        ))}
      </ul>
      {optional.length > 0 ? (
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            Otras columnas (opcionales)
          </p>
          <ul className="list-none">
            {optional.map((column) => (
              <ColumnRow key={column.header} column={column} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function SectionedColumnList({
  columns,
  sections,
}: {
  columns: ReadonlyArray<TemplateColumnGuide>;
  sections: ReadonlyArray<{ id: TemplateGuideSectionId; title: string }>;
}) {
  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const sectionColumns = columns.filter((c) => c.section === section.id);
        if (sectionColumns.length === 0) return null;
        return (
          <div key={section.id}>
            <h5 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {section.title}
            </h5>
            <ul className="list-none">
              {sectionColumns.map((column) => (
                <ColumnRow key={column.header} column={column} />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function ImportTemplateGuidePanel({
  entityType,
}: ImportTemplateGuidePanelProps) {
  const guide = IMPORT_TEMPLATE_GUIDES[entityType];
  const [open, setOpen] = useState(guide.defaultOpen);

  useEffect(() => {
    setOpen(IMPORT_TEMPLATE_GUIDES[entityType].defaultOpen);
  }, [entityType]);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-lg border bg-muted/30 px-3 py-2"
    >
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto w-full justify-between px-1 py-1.5 text-left hover:bg-transparent"
        >
          <span className="text-sm font-medium">{guide.title}</span>
          <ChevronDown
            aria-hidden
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
          <span className="sr-only">
            {open
              ? importTemplateGuideCopy.toggleHide
              : importTemplateGuideCopy.toggleShow}
          </span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pb-2 pt-1">
        <p className="text-xs text-muted-foreground">{guide.intro}</p>
        <p className="text-xs font-medium text-foreground/90">
          {guide.leaveHeadersNote}
        </p>
        {guide.sections ? (
          <SectionedColumnList
            columns={guide.columns}
            sections={guide.sections}
          />
        ) : (
          <CompactColumnList columns={guide.columns} />
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
