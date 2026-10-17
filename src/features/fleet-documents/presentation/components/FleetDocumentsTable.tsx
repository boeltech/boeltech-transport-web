import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Skeleton } from "@shared/ui/skeleton";
import { formatDate } from "@shared/utils/dateUtils";
import type { DocumentExpiryItem } from "../../domain";
import { fleetDocumentsCopy } from "../copy";
import { DocumentExpirySeverityBadge } from "../config/documentExpirySeverityConfig";

const copy = fleetDocumentsCopy.table;
const docTypeCopy = fleetDocumentsCopy.docType;

interface FleetDocumentsTableProps {
  items: DocumentExpiryItem[];
  isLoading: boolean;
  onOpen: (item: DocumentExpiryItem) => void;
}

const HEADERS: { key: string; label: string; className?: string }[] = [
  { key: "entity", label: copy.entity },
  { key: "docType", label: copy.docType },
  { key: "expiresOn", label: copy.expiresOn },
  { key: "days", label: copy.daysRemaining, className: "text-right" },
  { key: "severity", label: copy.severity },
];

function formatDaysRemaining(days: number | null): string {
  if (days == null) return copy.daysUnknown;
  if (days < 0) return copy.daysExpired(days);
  return copy.daysLeft(days);
}

export function FleetDocumentsTable({
  items,
  isLoading,
  onOpen,
}: FleetDocumentsTableProps) {
  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            {HEADERS.map((h) => (
              <TableHead key={h.key} className={h.className}>
                {h.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-36" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto h-4 w-10" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (items.length === 0) return null;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {HEADERS.map((h) => (
            <TableHead key={h.key} className={h.className}>
              {h.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow
            key={`${item.entityType}-${item.entityId}-${item.docType}`}
            className="cursor-pointer"
            onClick={() => onOpen(item)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen(item);
              }
            }}
            tabIndex={0}
            role="link"
            aria-label={`${copy.openDetail}: ${item.entityLabel}`}
          >
            <TableCell className="font-medium">{item.entityLabel}</TableCell>
            <TableCell>{docTypeCopy[item.docType]}</TableCell>
            <TableCell>
              {item.expiresOn
                ? formatDate(item.expiresOn)
                : copy.expiresUnknown}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatDaysRemaining(item.daysRemaining)}
            </TableCell>
            <TableCell>
              <DocumentExpirySeverityBadge
                status={item.severity}
                size="sm"
                showIcon
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
