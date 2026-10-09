import { Link } from "react-router-dom";
import { Settings2, Users } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@shared/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import type { CompensationTemplate } from "../../domain/entities";
import { compensationTemplateBuildPath } from "../../application/compensationRoutes";
import {
  CompensationTemplateDisplayStatusBadge,
  CompensationUsageStatusBadge,
} from "../config/compensationStatusConfig";
import { compensationCopy } from "../copy/compensationCopy";
import { buildTemplateSummary } from "../utils/buildTemplateSummary";
import { getTemplateUsageStatus } from "../utils/getTemplateCompleteness";
import { isTemplateLockedBySupersede } from "../utils/getTemplateDisplayStatus";
import { CompensationTemplateActions } from "./CompensationTemplateActions";

const copy = compensationCopy.templates;
const hubCopy = compensationCopy.hub;

interface CompensationTemplatesTableProps {
  templates: CompensationTemplate[];
  isLoading?: boolean;
  canUpdate?: boolean;
  pendingEmployeeId?: string;
  /** Desktop table vs compact mobile cards. Default: table. */
  layout?: "table" | "cards";
  onOpenOperators: (templateId: string, assignEmployeeId?: string) => void;
  onDeleted?: () => void;
}

/** PRD D15/D16: vigentes + «· +k programada(s)» tenue; sin el campo (API vieja) o en 0, solo el número. */
function TemplateOperatorsCount({
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

function RowActions({
  template,
  canUpdate,
  pendingEmployeeId,
  onOpenOperators,
  onDeleted,
}: {
  template: CompensationTemplate;
  canUpdate: boolean;
  pendingEmployeeId?: string;
  onOpenOperators: (templateId: string, assignEmployeeId?: string) => void;
  onDeleted?: () => void;
}) {
  const usage = getTemplateUsageStatus(template);
  const canAssignPending =
    Boolean(pendingEmployeeId) && canUpdate && usage === "ready";
  const buildHref = compensationTemplateBuildPath(template.id);
  const buildLabel = template.lockedForEdit
    ? isTemplateLockedBySupersede(template)
      ? copy.viewConfiguration
      : copy.createVersion
    : copy.edit;

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {canAssignPending ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => onOpenOperators(template.id, pendingEmployeeId)}
        >
          {hubCopy.employeeAssignBanner.assignAction}
        </Button>
      ) : null}
      {canUpdate ? (
        usage === "needs_payment" || usage === "ready_to_activate" ? (
          <>
            <Button type="button" size="sm" asChild>
              <Link to={buildHref} className="inline-flex items-center gap-2">
                <Settings2 className="h-3.5 w-3.5" aria-hidden />
                {usage === "needs_payment" ? copy.completePayment : copy.edit}
              </Link>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              leftIcon={<Users className="h-3.5 w-3.5" />}
              onClick={() => onOpenOperators(template.id)}
            >
              {copy.operators}
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              variant={usage === "ready" ? "default" : "outline"}
              leftIcon={<Users className="h-3.5 w-3.5" />}
              onClick={() => onOpenOperators(template.id)}
            >
              {copy.operators}
            </Button>
            <Button type="button" size="sm" variant="outline" asChild>
              <Link to={buildHref} className="inline-flex items-center gap-2">
                <Settings2 className="h-3.5 w-3.5" aria-hidden />
                {buildLabel}
              </Link>
            </Button>
          </>
        )
      ) : null}
      <CompensationTemplateActions template={template} onDeleted={onDeleted} />
    </div>
  );
}

function TemplateCatalogCard({
  template,
  canUpdate,
  pendingEmployeeId,
  onOpenOperators,
  onDeleted,
}: {
  template: CompensationTemplate;
  canUpdate: boolean;
  pendingEmployeeId?: string;
  onOpenOperators: (templateId: string, assignEmployeeId?: string) => void;
  onDeleted?: () => void;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-medium text-foreground">{template.name}</p>
              <span className="text-xs text-muted-foreground">
                {copy.versionLabel(template.version)}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <CompensationTemplateDisplayStatusBadge template={template} />
              <CompensationUsageStatusBadge template={template} />
            </div>
          </div>
          <TemplateOperatorsCount
            template={template}
            className="shrink-0 text-sm font-medium text-foreground"
          />
        </div>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {buildTemplateSummary(template)}
        </p>
        <RowActions
          template={template}
          canUpdate={canUpdate}
          pendingEmployeeId={pendingEmployeeId}
          onOpenOperators={onOpenOperators}
          onDeleted={onDeleted}
        />
      </CardContent>
    </Card>
  );
}

export function CompensationTemplatesTable({
  templates,
  isLoading,
  canUpdate = false,
  pendingEmployeeId,
  layout = "table",
  onOpenOperators,
  onDeleted,
}: CompensationTemplatesTableProps) {
  if (isLoading) {
    if (layout === "cards") {
      return (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-2 rounded-md border bg-card p-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (layout === "cards") {
    return (
      <div className="grid gap-3">
        {templates.map((template) => (
          <TemplateCatalogCard
            key={template.id}
            template={template}
            canUpdate={canUpdate}
            pendingEmployeeId={pendingEmployeeId}
            onOpenOperators={onOpenOperators}
            onDeleted={onDeleted}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{copy.columns.name}</TableHead>
            <TableHead>{copy.columns.status}</TableHead>
            <TableHead>{copy.columns.usage}</TableHead>
            <TableHead>{copy.columns.summary}</TableHead>
            <TableHead className="text-right">{copy.columns.operators}</TableHead>
            <TableHead className="text-right">{copy.columns.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => {
            return (
              <TableRow key={template.id}>
                <TableCell>
                  <div className="min-w-0">
                    <span className="font-medium">{template.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {copy.versionLabel(template.version)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <CompensationTemplateDisplayStatusBadge template={template} />
                </TableCell>
                <TableCell>
                  <CompensationUsageStatusBadge template={template} />
                </TableCell>
                <TableCell className="max-w-xs text-sm text-muted-foreground">
                  <span className="line-clamp-1">{buildTemplateSummary(template)}</span>
                </TableCell>
                <TableCell className="text-right">
                  <TemplateOperatorsCount template={template} />
                </TableCell>
                <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                  <RowActions
                    template={template}
                    canUpdate={canUpdate}
                    pendingEmployeeId={pendingEmployeeId}
                    onOpenOperators={onOpenOperators}
                    onDeleted={onDeleted}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
