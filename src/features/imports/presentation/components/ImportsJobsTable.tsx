/**
 * ImportsJobsTable — historial de cargas desde archivo (columnas operativas).
 */

import { Download, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Button } from "@shared/ui/button";
import { Skeleton } from "@shared/ui/skeleton";
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

export function ImportsJobsTable({
  jobs,
  isLoading = false,
}: ImportsJobsTableProps) {
  const copy = importsCopy.table;
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

  if (isLoading) {
    return (
      <div className="space-y-2 rounded-md border p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{copy.entityType}</TableHead>
            <TableHead>{copy.status}</TableHead>
            <TableHead>{copy.filename}</TableHead>
            <TableHead>{copy.result}</TableHead>
            <TableHead>{copy.when}</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">{copy.actions}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => {
            const showDownload = canRead && job.errorCount > 0;
            const isDownloading =
              downloadErrors.isPending && downloadErrors.variables === job.id;
            const when = job.committedAt ?? job.createdAt;

            return (
              <TableRow key={job.id}>
                <TableCell>
                  {IMPORT_ENTITY_TYPE_LABELS[job.entityType] ?? job.entityType}
                </TableCell>
                <TableCell>
                  <ImportJobStatusBadge status={job.status} />
                </TableCell>
                <TableCell className="max-w-[220px] truncate text-sm">
                  {job.originalFilename ?? "—"}
                </TableCell>
                <TableCell className="text-sm tabular-nums">
                  {copy.resultSummary(job)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatDateTime(when)}
                </TableCell>
                <TableCell>
                  {showDownload ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label={copy.downloadErrorsAria(job.originalFilename)}
                      title={copy.downloadErrors}
                      disabled={downloadErrors.isPending}
                      onClick={() => downloadErrors.mutate(job.id)}
                    >
                      {isDownloading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
