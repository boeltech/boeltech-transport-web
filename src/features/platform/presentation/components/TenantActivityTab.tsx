import { Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { Button } from "@shared/ui/button";
import { AlertWithIcon } from "@shared/ui/alert";
import { EmptyState } from "@shared/ui/feedback-states";
import { Skeleton } from "@shared/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { formatDateTime } from "@shared/utils/dateUtils";
import { usePlatformAuditLog } from "../../application/hooks/usePlatformAuditLog";
import { platformCopy } from "../copy/platformCopy";
import {
  getAuditActionLabel,
  getAuditMetadataSummary,
  getAuditOperatorLabel,
} from "../utils/platformAuditFormatters";

interface TenantActivityTabProps {
  tenantId: string;
}

export function TenantActivityTab({ tenantId }: TenantActivityTabProps) {
  const copy = platformCopy.tenants.detail.activity;
  const { data, isLoading, isError } = usePlatformAuditLog({
    page: 1,
    limit: 20,
    targetTenantId: tenantId,
  });

  const entries = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <AlertWithIcon variant="destructive" title={copy.error.title}>
        {copy.error.description}
      </AlertWithIcon>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">{copy.title}</h3>
          <p className="text-xs text-muted-foreground">{copy.description}</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link
            to={`/platform/audit?targetTenantId=${encodeURIComponent(tenantId)}`}
          >
            {copy.viewAll}
          </Link>
        </Button>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-10 w-10" />}
          title={copy.empty.title}
          description={copy.empty.description}
          size="sm"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{copy.columns.date}</TableHead>
                <TableHead>{copy.columns.operator}</TableHead>
                <TableHead>{copy.columns.action}</TableHead>
                <TableHead>{copy.columns.details}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const summary = getAuditMetadataSummary(entry);
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap font-mono text-xs tabular-nums text-muted-foreground">
                      {formatDateTime(entry.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {getAuditOperatorLabel(entry)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {getAuditActionLabel(entry.action)}
                    </TableCell>
                    <TableCell
                      className="max-w-xs truncate text-xs text-muted-foreground"
                      title={summary || undefined}
                    >
                      {summary || "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
