import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { formatDateTime } from "@shared/utils/dateUtils";
import { usePlatformAuditLog } from "../../application/hooks/usePlatformAuditLog";
import {
  usePlatformPlans,
  usePlatformTenant,
} from "../../application/hooks/usePlatformTenants";
import { PlatformAuditAction } from "../../domain/entities";
import {
  getAuditActionLabel,
  getAuditMetadataSummary,
  getAuditOperatorLabel,
  getAuditTenantLabel,
  isDestructiveAuditAction,
} from "../utils/platformAuditFormatters";
import { platformCopy } from "../copy/platformCopy";
import { opsCopy } from "./opsCopy";
import { OpsAuditLine } from "./patterns/OpsAuditLine";
import { OpsEmptyState } from "./patterns/OpsEmptyState";
import { OpsTableSkeleton } from "./patterns/OpsTableSkeleton";
import { OpsButton } from "./ui/OpsButton";
import {
  OpsSelect,
  OpsSelectContent,
  OpsSelectItem,
  OpsSelectTrigger,
  OpsSelectValue,
} from "./ui/OpsSelect";

const ACTION_ALL = "__all__";

/**
 * Auditoría global Ops (flag ON) — una línea por evento, sin tabla.
 */
export function OpsAuditLogPage() {
  const copy = opsCopy.audit;
  const [searchParams, setSearchParams] = useSearchParams();
  const targetTenantId = searchParams.get("targetTenantId") || "";
  const [page, setPage] = useState(1);
  const [action, setAction] = useState(ACTION_ALL);
  const { data: plans } = usePlatformPlans();
  const { data: tenantFilter } = usePlatformTenant(targetTenantId);

  const queryParams = useMemo(
    () => ({
      page,
      limit: 20,
      action: action === ACTION_ALL ? undefined : action,
      targetTenantId: targetTenantId || undefined,
    }),
    [page, action, targetTenantId],
  );

  const { data, isLoading, isError, refetch } = usePlatformAuditLog(queryParams);
  const entries = data?.data ?? [];
  const pagination = data?.pagination;

  const clearTenantScope = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("targetTenantId");
      return next;
    });
  }, [setSearchParams]);

  const tenantFilterLabel = tenantFilter?.subdomain ?? null;

  return (
    <div data-testid="platform-ops-audit" className="space-y-3">
      <div>
        <h1 className="ops-type-h2 ops-text m-0">{copy.title}</h1>
        <p className="ops-type-caption ops-text-muted mt-1 max-w-xl">
          {copy.description}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="w-[14rem] space-y-1">
          <span className="ops-label">{copy.filterAction}</span>
          <OpsSelect
            value={action}
            onValueChange={(value) => {
              setAction(value);
              setPage(1);
            }}
          >
            <OpsSelectTrigger>
              <OpsSelectValue />
            </OpsSelectTrigger>
            <OpsSelectContent>
              <OpsSelectItem value={ACTION_ALL}>
                {copy.filterAll}
              </OpsSelectItem>
              {Object.values(PlatformAuditAction).map((value) => (
                <OpsSelectItem key={value} value={value}>
                  {getAuditActionLabel(value)}
                </OpsSelectItem>
              ))}
            </OpsSelectContent>
          </OpsSelect>
        </div>
        <OpsButton variant="ghost" size="sm" onClick={() => void refetch()}>
          Actualizar
        </OpsButton>
      </div>

      {targetTenantId ? (
        <div className="ops-rounded ops-hairline ops-bg-surface flex flex-wrap items-center justify-between gap-2 p-3">
          <p className="text-xs ops-text">
            Filtro empresa:{" "}
            <span className="font-medium">
              {tenantFilterLabel ?? targetTenantId.slice(0, 8)}
            </span>
          </p>
          <OpsButton variant="ghost" size="sm" onClick={clearTenantScope}>
            {copy.clearTenant}
          </OpsButton>
        </div>
      ) : null}

      {isError ? (
        <OpsEmptyState
          variant="error"
          title={copy.error}
          action={
            <OpsButton variant="ghost" size="sm" onClick={() => void refetch()}>
              {copy.retry}
            </OpsButton>
          }
        />
      ) : null}

      {isLoading ? <OpsTableSkeleton /> : null}

      {!isLoading && !isError && entries.length === 0 ? (
        <OpsEmptyState
          title={copy.empty}
          description="Las mutaciones platform aparecerán aquí."
        />
      ) : null}

      {!isLoading && !isError && entries.length > 0 ? (
        <div className="ops-line-list">
          {entries.map((entry) => {
            const detail = getAuditMetadataSummary(entry, plans);
            const tenantLabel = getAuditTenantLabel(
              entry,
              entry.targetTenantId === targetTenantId
                ? tenantFilterLabel
                : null,
            );
            return (
              <OpsAuditLine
                key={entry.id}
                time={formatDateTime(entry.createdAt)}
                actor={getAuditOperatorLabel(entry)}
                verb={getAuditActionLabel(entry.action)}
                object={tenantLabel}
                objectHref={
                  entry.targetTenantId
                    ? `/platform/tenants/${entry.targetTenantId}`
                    : undefined
                }
                detail={
                  detail === platformCopy.audit.noDetail ? undefined : detail
                }
                destructive={isDestructiveAuditAction(entry)}
              />
            );
          })}
        </div>
      ) : null}

      {pagination && pagination.totalPages > 1 ? (
        <div className="ops-type-caption ops-text-muted flex flex-wrap items-center gap-2">
          <span>
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <OpsButton
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </OpsButton>
          <OpsButton
            variant="ghost"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </OpsButton>
        </div>
      ) : null}
    </div>
  );
}
