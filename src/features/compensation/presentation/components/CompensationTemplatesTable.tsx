import { Link } from "react-router-dom";
import { Settings2, Users } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";
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
import { CompensationUsageStatusBadge } from "../config/compensationStatusConfig";
import { compensationCopy } from "../copy/compensationCopy";
import { buildTemplateSummary } from "../utils/buildTemplateSummary";
import { getTemplateUsageStatus } from "../utils/getTemplateCompleteness";
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
  const canAssignPending = Boolean(pendingEmployeeId) && canUpdate && usage === "ready";
  const buildHref = compensationTemplateBuildPath(template.id);

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
        usage === "needs_payment" ? (
          <>
            <Button type="button" size="sm" asChild>
              <Link to={buildHref} className="inline-flex items-center gap-2">
                <Settings2 className="h-3.5 w-3.5" aria-hidden />
                {copy.completePayment}
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
                {copy.edit}
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
  const operatorsCount = template.activeAssignmentsCount ?? 0;

  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <p className="truncate font-medium text-foreground">{template.name}</p>
            <CompensationUsageStatusBadge template={template} />
          </div>
          <span
            className="shrink-0 tabular-nums text-sm font-medium text-foreground"
            title={copy.operatorsCountLabel.replace("{{count}}", String(operatorsCount))}
          >
            {operatorsCount}
          </span>
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
            <TableHead>{copy.columns.usage}</TableHead>
            <TableHead>{copy.columns.summary}</TableHead>
            <TableHead className="text-right">{copy.columns.operators}</TableHead>
            <TableHead className="text-right">{copy.columns.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => {
            const operatorsCount = template.activeAssignmentsCount ?? 0;
            return (
              <TableRow key={template.id}>
                <TableCell>
                  <span className="font-medium">{template.name}</span>
                </TableCell>
                <TableCell>
                  <CompensationUsageStatusBadge template={template} />
                </TableCell>
                <TableCell className="max-w-xs text-sm text-muted-foreground">
                  <span className="line-clamp-1">{buildTemplateSummary(template)}</span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <span
                    title={copy.operatorsCountLabel.replace(
                      "{{count}}",
                      String(operatorsCount),
                    )}
                  >
                    {operatorsCount}
                  </span>
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
