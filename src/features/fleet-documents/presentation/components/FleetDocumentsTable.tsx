/**
 * FleetDocumentsTable — listado Operate (`EntityListTable`, SoT §7 T1–T10).
 *
 * 5 cols: Entidad · Documento · Vence · Días · Severidad.
 * Link primario al detalle (driver/vehicle docs). Empty → null.
 * `framed={false}`.
 */

import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListStackedValue,
} from "@shared/ui/table";
import { FLEET_DOCUMENTS_PATH, type DocumentExpiryItem } from "../../domain";
import { fleetDocumentsCopy } from "../copy";
import { DocumentExpirySeverityBadge } from "../config/documentExpirySeverityConfig";
import { documentExpiryDetailPath } from "../utils/documentExpiryNavigation";

const copy = fleetDocumentsCopy.table;
const docTypeCopy = fleetDocumentsCopy.docType;

export interface FleetDocumentsTableProps {
  items: DocumentExpiryItem[];
  isLoading: boolean;
}

function formatDaysRemaining(days: number | null): string {
  if (days == null) return copy.daysUnknown;
  if (days < 0) return copy.daysExpired(days);
  return copy.daysLeft(days);
}

function buildColumns(): EntityListColumnDef<DocumentExpiryItem>[] {
  return [
    {
      id: "entity",
      header: copy.entity,
      kind: "primary",
      accessor: (item): EntityListStackedValue => ({
        primary: item.entityLabel,
      }),
    },
    {
      id: "docType",
      header: copy.docType,
      kind: "meta",
      accessor: (item) => docTypeCopy[item.docType],
    },
    {
      id: "expiresOn",
      header: copy.expiresOn,
      kind: "date",
      headerClassName: "hidden md:table-cell",
      className: "hidden md:table-cell",
      accessor: (item) => item.expiresOn ?? copy.expiresUnknown,
    },
    {
      id: "days",
      header: copy.daysRemaining,
      kind: "meta",
      headerClassName: "text-right",
      className: "text-right tabular-nums",
      accessor: (item) => formatDaysRemaining(item.daysRemaining),
    },
    {
      id: "severity",
      header: copy.severity,
      kind: "status",
      accessor: (item) => (
        <DocumentExpirySeverityBadge
          status={item.severity}
          size="sm"
          showIcon
        />
      ),
    },
  ];
}

function getRowId(item: DocumentExpiryItem): string {
  return `${item.entityType}-${item.entityId}-${item.docType}`;
}

export function FleetDocumentsTable({
  items,
  isLoading,
}: FleetDocumentsTableProps) {
  const columns = buildColumns();

  return (
    <EntityListTable
      framed={false}
      density="list"
      columns={columns}
      rows={items}
      getRowId={getRowId}
      isLoading={isLoading}
      primaryTo={documentExpiryDetailPath}
      primaryState={() => ({ from: FLEET_DOCUMENTS_PATH })}
    />
  );
}
