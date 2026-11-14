/**
 * ImportsJobsTable — historial de cargas desde archivo (`EntityListTable`).
 *
 * Tipo · Estado · Archivo · Resultado · Cuándo · Acciones.
 * Empty → null (ImportsHubPage / ListPageShell). `framed={false}`.
 * Fechas con `formatDateTime`. Sin sort API.
 */

import { Download, Loader2 } from "lucide-react";
import {
  EntityListTable,
  type EntityListColumnDef,
} from "@shared/ui/table";
import { Button } from "@shared/ui/button";
import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import { formatDateTime } from "@shared/utils/dateUtils";
import { getErrorMessage } from "@shared/utils/errorMapper";
import {
  IMPORT_ENTITY_TYPE_LABELS,
  type ImportJob,
} from "../../domain";
import { useDownloadImportJobErrors } from "../../application";
import { ImportJobStatusBadge } from "../config/importJobStatusConfig";
import { importsCopy } from "../copy/importsCopy";

export interface ImportsJobsTableProps {
  jobs: ImportJob[];
  isLoading?: boolean;
}

function buildColumns(args: {
  canRead: boolean;
  isDownloadPending: boolean;
  downloadingId: string | undefined;
  onDownload: (id: string) => void;
}): EntityListColumnDef<ImportJob>[] {
  const { canRead, isDownloadPending, downloadingId, onDownload } = args;
  const copy = importsCopy.table;

  return [
    {
      id: "entityType",
      header: copy.entityType,
      kind: "text",
      accessor: (job) =>
        IMPORT_ENTITY_TYPE_LABELS[job.entityType] ?? job.entityType,
    },
    {
      id: "status",
      header: copy.status,
      kind: "status",
      accessor: (job) => <ImportJobStatusBadge status={job.status} />,
    },
    {
      id: "filename",
      header: copy.filename,
      kind: "meta",
      className: "max-w-[220px] truncate",
      accessor: (job) => job.originalFilename ?? "—",
    },
    {
      id: "result",
      header: copy.result,
      kind: "meta",
      className: "tabular-nums",
      accessor: (job) => copy.resultSummary(job),
    },
    {
      id: "when",
      header: copy.when,
      kind: "meta",
      className: "whitespace-nowrap",
      accessor: (job) => formatDateTime(job.committedAt ?? job.createdAt),
    },
    {
      id: "actions",
      header: "",
      kind: "actions",
      accessor: (job) => {
        const showDownload = canRead && job.errorCount > 0;
        if (!showDownload) return null;
        const isDownloading =
          isDownloadPending && downloadingId === job.id;
        return (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={copy.downloadErrorsAria(job.originalFilename)}
            title={copy.downloadErrors}
            disabled={isDownloadPending}
            onClick={() => onDownload(job.id)}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        );
      },
    },
  ];
}

export function ImportsJobsTable({
  jobs,
  isLoading = false,
}: ImportsJobsTableProps) {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const canRead = hasPermission("imports", "read");

  const downloadErrors = useDownloadImportJobErrors({
    onError: (err) => {
      toast({
        title: importsCopy.errors.errorsDownloadFailed,
        description: getErrorMessage(err),
        variant: "destructive",
      });
    },
  });

  const columns = buildColumns({
    canRead,
    isDownloadPending: downloadErrors.isPending,
    downloadingId: downloadErrors.variables,
    onDownload: (id) => downloadErrors.mutate(id),
  });

  return (
    <EntityListTable
      framed={false}
      density="list"
      aria-label="Historial de cargas"
      columns={columns}
      rows={jobs}
      getRowId={(row) => row.id}
      isLoading={isLoading}
    />
  );
}
