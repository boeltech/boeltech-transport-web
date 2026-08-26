/**
 * FinanceDispatchRunsTable — historial de envíos del periodo (hub Finanzas).
 */

import { Skeleton } from "@shared/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { formatDate } from "@shared/utils/dateUtils";
import type { BillingDispatchRunListItem } from "../../domain/billingDispatchRun.types";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import { DispatchRunStatusBadge } from "../config/dispatchRunStatusConfig";
import { DispatchRunOriginBadge } from "./DispatchRunOriginBadge";

const copy = dispatchRunsCopy.tab;
const PAGE_SIZE = 20;

const TABLE_HEADERS = [
  { key: "period", label: copy.table.period },
  { key: "scheme", label: copy.table.scheme },
  { key: "origin", label: copy.table.origin },
  { key: "status", label: copy.table.status },
  { key: "createdAt", label: copy.table.createdAt },
] as const;

interface FinanceDispatchRunsTableProps {
  runs: BillingDispatchRunListItem[];
  isLoading: boolean;
  schemeName: (id: string | null) => string;
  onView: (id: string) => void;
}

export function FinanceDispatchRunsTable({
  runs,
  isLoading,
  schemeName,
  onView,
}: FinanceDispatchRunsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {TABLE_HEADERS.map((header) => (
              <TableHead key={header.key}>{header.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        {isLoading ? (
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                {TABLE_HEADERS.map((header) => (
                  <TableCell key={header.key}>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        ) : (
          <TableBody>
            {runs.map((run) => (
              <TableRow
                key={run.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onView(run.id)}
              >
                <TableCell className="text-sm">
                  {formatDate(run.periodStart)} — {formatDate(run.periodEnd)}
                </TableCell>
                <TableCell>{schemeName(run.billingSchemeId)}</TableCell>
                <TableCell>
                  <DispatchRunOriginBadge origin={run.origin} />
                </TableCell>
                <TableCell>
                  <DispatchRunStatusBadge status={run.status} />
                </TableCell>
                <TableCell>{formatDate(run.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        )}
      </Table>
    </div>
  );
}

export const DISPATCH_RUNS_PAGE_SIZE = PAGE_SIZE;
