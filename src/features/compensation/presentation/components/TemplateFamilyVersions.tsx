import { useMemo, type ReactNode } from "react";
import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import { Skeleton } from "@shared/ui/skeleton";
import { TableCell, TableRow } from "@shared/ui/table";
import { useTemplateVersions } from "../../application/hooks";
import type {
  CompensationTemplate,
  CompensationTemplateVersionRef,
} from "../../domain/entities";
import { compensationCopy } from "../copy/compensationCopy";
import type { BranchNameMap } from "../utils/formatCorridorRoute";
import { pickActiveTemplateVersion } from "../utils/getTemplateDisplayStatus";
import { isTemplateDimmed } from "../utils/templateListRow";
import {
  TemplateOperatorsCount,
  TemplateStatusCell,
  TemplateSummaryCell,
} from "./CompensationTemplateListCells";
import { CompensationTemplateActions } from "./CompensationTemplateActions";

const copy = compensationCopy.templates;
const familyCopy = copy.family;

const TABLE_COLUMN_COUNT = 5;

interface FamilyVersionsState {
  status: "loading" | "error" | "ready";
  /** Versiones de la familia sin la fila, de la más nueva a la más vieja (PRD D16). */
  others: CompensationTemplate[];
  activeVersion: CompensationTemplateVersionRef | null;
  hasDraft: boolean;
  retry: () => void;
}

function useFamilyVersions(row: CompensationTemplate): FamilyVersionsState {
  const query = useTemplateVersions(row.id, true, { keepPrevious: true });
  const { data, isError, isFetching, refetch } = query;

  return useMemo(() => {
    const versions = data ?? [];
    const active = pickActiveTemplateVersion(versions);
    return {
      status: data ? "ready" : isError && !isFetching ? "error" : "loading",
      others: versions
        .filter((version) => version.id !== row.id)
        .sort((a, b) => b.version - a.version),
      activeVersion: active ? { id: active.id, version: active.version } : null,
      hasDraft: versions.some((version) => version.status === "draft"),
      retry: () => {
        void refetch();
      },
    };
  }, [data, isError, isFetching, refetch, row.id]);
}

interface FamilyVersionsProps {
  row: CompensationTemplate;
  /** Id del contenedor al que apunta `aria-controls` del botón «Otras versiones». */
  containerId: string;
  pendingEmployeeId?: string;
  branchNameMap?: BranchNameMap;
  onOpenOperators: (templateId: string, assignEmployeeId?: string) => void;
  onDeleted?: () => void;
}

/** «v{n}» + nombre solo si difiere del de la fila (PRD D16). */
function VersionNameButton({
  version,
  rowName,
  onOpenOperators,
}: {
  version: CompensationTemplate;
  rowName: string;
  onOpenOperators: (templateId: string) => void;
}) {
  const dimmed = isTemplateDimmed(version);
  return (
    <button
      type="button"
      aria-label={copy.rowAriaLabel(version.name, version.version)}
      className={cn(
        "flex min-w-0 items-baseline gap-2 rounded-sm text-left hover:underline",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
      data-template-focus-id={version.id}
      onClick={(event) => {
        event.stopPropagation();
        onOpenOperators(version.id);
      }}
    >
      <span className={cn("shrink-0 font-medium", dimmed && "text-muted-foreground")}>
        {copy.versionLabel(version.version)}
      </span>
      {version.name !== rowName ? (
        <span className="min-w-0 truncate text-muted-foreground">{version.name}</span>
      ) : null}
    </button>
  );
}

function MessageRow({
  children,
  testId,
}: {
  children: ReactNode;
  testId: string;
}) {
  return (
    <TableRow className="bg-muted/40 hover:bg-muted/40" data-testid={testId}>
      <TableCell colSpan={TABLE_COLUMN_COUNT}>
        <div className="ml-2 border-l-2 border-border pl-4 text-sm text-muted-foreground">
          {children}
        </div>
      </TableCell>
    </TableRow>
  );
}

function LoadErrorMessage({ onRetry }: { onRetry: () => void }) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      {familyCopy.loadError}
      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-auto p-0"
        onClick={(event) => {
          event.stopPropagation();
          onRetry();
        }}
      >
        {familyCopy.retry}
      </Button>
    </span>
  );
}

/** Subfilas de la familia dentro de la tabla (PRD D16/D20). */
export function TemplateFamilyVersionRows({
  row,
  containerId,
  pendingEmployeeId,
  branchNameMap,
  onOpenOperators,
  onDeleted,
}: FamilyVersionsProps) {
  const family = useFamilyVersions(row);

  return (
    <tbody id={containerId} data-testid="template-family-versions">
      {family.status === "loading" ? (
        <TableRow className="bg-muted/40 hover:bg-muted/40">
          <TableCell colSpan={TABLE_COLUMN_COUNT}>
            <div className="ml-2 border-l-2 border-border pl-4">
              <Skeleton className="h-10 w-full" />
            </div>
          </TableCell>
        </TableRow>
      ) : family.status === "error" ? (
        <MessageRow testId="template-family-versions-error">
          <LoadErrorMessage onRetry={family.retry} />
        </MessageRow>
      ) : family.others.length === 0 ? (
        <MessageRow testId="template-family-versions-empty">{familyCopy.empty}</MessageRow>
      ) : (
        family.others.map((version) => (
          <TableRow
            key={version.id}
            className="cursor-pointer bg-muted/40 hover:bg-muted/60"
            onClick={() => onOpenOperators(version.id)}
            data-testid="template-family-version-row"
          >
            <TableCell className="max-w-64">
              <div className="ml-2 min-w-0 border-l-2 border-border pl-4">
                <VersionNameButton
                  version={version}
                  rowName={row.name}
                  onOpenOperators={onOpenOperators}
                />
              </div>
            </TableCell>
            <TableCell>
              <TemplateStatusCell template={version} />
            </TableCell>
            <TableCell className="min-w-72">
              <TemplateSummaryCell template={version} branchNameMap={branchNameMap} />
            </TableCell>
            <TableCell className="text-right">
              <TemplateOperatorsCount template={version} />
            </TableCell>
            <TableCell
              className="w-56 text-right"
              onClick={(event) => event.stopPropagation()}
            >
              <CompensationTemplateActions
                template={version}
                pendingEmployeeId={pendingEmployeeId}
                onOpenOperators={onOpenOperators}
                onDeleted={onDeleted}
                familyActiveVersion={family.activeVersion}
                familyHasDraft={family.hasDraft}
              />
            </TableCell>
          </TableRow>
        ))
      )}
    </tbody>
  );
}

/** Mini-tarjetas indentadas bajo la tarjeta de la familia en móvil, sin «Cómo se paga» (PRD D25). */
export function TemplateFamilyVersionCards({
  row,
  containerId,
  pendingEmployeeId,
  onOpenOperators,
  onDeleted,
}: Omit<FamilyVersionsProps, "branchNameMap">) {
  const family = useFamilyVersions(row);

  return (
    <div
      id={containerId}
      className="ml-3 space-y-2 border-l-2 border-border pl-3"
      data-testid="template-family-versions"
    >
      {family.status === "loading" ? (
        <Skeleton className="h-20 w-full rounded-lg" />
      ) : family.status === "error" ? (
        <p className="text-sm text-muted-foreground" data-testid="template-family-versions-error">
          <LoadErrorMessage onRetry={family.retry} />
        </p>
      ) : family.others.length === 0 ? (
        <p className="text-sm text-muted-foreground" data-testid="template-family-versions-empty">
          {familyCopy.empty}
        </p>
      ) : (
        family.others.map((version) => (
          <div
            key={version.id}
            className="relative cursor-pointer space-y-2 rounded-lg border bg-muted/40 p-3 transition-colors hover:bg-muted/60"
            onClick={() => onOpenOperators(version.id)}
            data-testid="template-family-version-card"
          >
            <div className="flex items-start justify-between gap-2 pr-9">
              <div className="min-w-0 space-y-1">
                <VersionNameButton
                  version={version}
                  rowName={row.name}
                  onOpenOperators={onOpenOperators}
                />
                <TemplateStatusCell template={version} />
              </div>
              <TemplateOperatorsCount
                template={version}
                className="shrink-0 pt-1 text-sm font-medium text-foreground"
              />
            </div>
            <CompensationTemplateActions
              template={version}
              layout="cards"
              pendingEmployeeId={pendingEmployeeId}
              onOpenOperators={onOpenOperators}
              onDeleted={onDeleted}
              familyActiveVersion={family.activeVersion}
              familyHasDraft={family.hasDraft}
            />
          </div>
        ))
      )}
    </div>
  );
}
