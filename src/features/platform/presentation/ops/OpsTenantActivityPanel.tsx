import { Link } from "react-router-dom";
import { formatDateTime } from "@shared/utils/dateUtils";
import { usePlatformAuditLog } from "../../application/hooks/usePlatformAuditLog";
import { platformCopy } from "../copy/platformCopy";
import {
  getAuditActionLabel,
  getAuditMetadataSummary,
  getAuditOperatorLabel,
} from "../utils/platformAuditFormatters";
import { OpsEmptyState } from "./patterns/OpsEmptyState";
import { OpsBadge } from "./ui/OpsBadge";
import { OpsButton } from "./ui/OpsButton";
import {
  OpsPanel,
  OpsPanelBody,
  OpsPanelDescription,
  OpsPanelHeader,
  OpsPanelTitle,
} from "./ui/OpsPanel";
import {
  OpsTable,
  OpsTableBody,
  OpsTableCell,
  OpsTableHead,
  OpsTableHeader,
  OpsTableRow,
} from "./ui/OpsTable";

interface OpsTenantActivityPanelProps {
  tenantId: string;
}

export function OpsTenantActivityPanel({
  tenantId,
}: OpsTenantActivityPanelProps) {
  const copy = platformCopy.tenants.detail.activity;
  const { data, isLoading, isError, refetch } = usePlatformAuditLog({
    page: 1,
    limit: 20,
    targetTenantId: tenantId,
  });

  const entries = data?.data ?? [];

  return (
    <OpsPanel data-testid="ops-tenant-activity">
      <OpsPanelHeader className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <OpsPanelTitle>{copy.title}</OpsPanelTitle>
          <OpsPanelDescription>{copy.description}</OpsPanelDescription>
        </div>
        <OpsButton variant="ghost" size="sm" asChild>
          <Link
            to={`/platform/audit?targetTenantId=${encodeURIComponent(tenantId)}`}
          >
            {copy.viewAll}
          </Link>
        </OpsButton>
      </OpsPanelHeader>
      <OpsPanelBody className="space-y-3">
        {isLoading ? (
          <OpsEmptyState variant="loading" title="Cargando…" />
        ) : null}

        {isError ? (
          <OpsEmptyState
            variant="error"
            title={copy.error.title}
            description={copy.error.description}
            panel={false}
            action={
              <OpsButton
                variant="ghost"
                size="sm"
                onClick={() => void refetch()}
              >
                {copy.error.retry}
              </OpsButton>
            }
          />
        ) : null}

        {!isLoading && !isError && entries.length === 0 ? (
          <OpsEmptyState
            title={copy.empty.title}
            description={copy.empty.description}
            panel={false}
          />
        ) : null}

        {!isLoading && !isError && entries.length > 0 ? (
          <OpsTable>
            <OpsTableHeader>
              <OpsTableRow>
                <OpsTableHead>{copy.columns.date}</OpsTableHead>
                <OpsTableHead>{copy.columns.operator}</OpsTableHead>
                <OpsTableHead>{copy.columns.action}</OpsTableHead>
                <OpsTableHead>{copy.columns.details}</OpsTableHead>
              </OpsTableRow>
            </OpsTableHeader>
            <OpsTableBody>
              {entries.map((entry) => {
                const summary = getAuditMetadataSummary(entry);
                return (
                  <OpsTableRow key={entry.id}>
                    <OpsTableCell className="whitespace-nowrap ops-font-mono ops-type-caption ops-text-muted">
                      {formatDateTime(entry.createdAt)}
                    </OpsTableCell>
                    <OpsTableCell className="ops-type-caption ops-text">
                      {getAuditOperatorLabel(entry)}
                    </OpsTableCell>
                    <OpsTableCell>
                      <OpsBadge tone="muted">
                        {getAuditActionLabel(entry.action)}
                      </OpsBadge>
                    </OpsTableCell>
                    <OpsTableCell
                      className="max-w-xs truncate ops-type-caption ops-text-muted"
                      title={summary || undefined}
                    >
                      {summary || "—"}
                    </OpsTableCell>
                  </OpsTableRow>
                );
              })}
            </OpsTableBody>
          </OpsTable>
        ) : null}
      </OpsPanelBody>
    </OpsPanel>
  );
}
