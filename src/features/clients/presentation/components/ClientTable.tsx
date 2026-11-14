/**
 * ClientTable — listado Operate (`EntityListTable`, SoT §7 T1–T10).
 *
 * 7 cols: Código · Razón social · RFC · Tipo · Pago · Contacto ·
 * Estado · ⋯. Sort URL `sortBy`/`sortOrder` (page). Empty → null.
 * `framed={false}`.
 */

import { Badge } from "@shared/ui/badge";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListSortState,
  type EntityListStackedValue,
} from "@shared/ui/table";

import type { ClientListItem } from "../../domain";
import {
  getClientTypeConfig,
  getPaymentTermsConfig,
  formatCreditDays,
} from "../config/clientConfig";
import {
  ClientStatusBadge,
  operationalStatusFromClient,
} from "../config/clientStatusConfig";
import { clientsCopy } from "../copy/clientsCopy";
import { ClientActions } from "./ClientActions";

const tableCopy = clientsCopy.table;

export interface ClientTableProps {
  clients: ClientListItem[];
  isLoading?: boolean;
  /** Href del detalle (link primario + fila). */
  primaryTo: (client: ClientListItem) => string;
  /** Cola del listado (`location.state.from`). */
  primaryState?: (client: ClientListItem) => unknown;
  sort: EntityListSortState;
  onSortChange: (next: EntityListSortState) => void;
}

function buildColumns(): EntityListColumnDef<ClientListItem>[] {
  return [
    {
      id: "code",
      header: tableCopy.code,
      kind: "code",
      sortable: true,
      sortField: "client_code",
      accessor: (client) => client.clientCode,
    },
    {
      id: "legalName",
      header: tableCopy.legalName,
      kind: "primary",
      sortable: true,
      sortField: "legal_name",
      accessor: (client): EntityListStackedValue => ({
        primary: client.legalName,
        secondary: client.tradeName || undefined,
      }),
    },
    {
      id: "taxId",
      header: tableCopy.taxId,
      kind: "code",
      headerClassName: "hidden md:table-cell",
      className: "hidden md:table-cell",
      accessor: (client) => client.taxId,
    },
    {
      id: "type",
      header: tableCopy.type,
      kind: "status",
      sortable: true,
      sortField: "type",
      headerClassName: "hidden lg:table-cell",
      className: "hidden lg:table-cell",
      accessor: (client) => {
        const typeConfig = getClientTypeConfig(client.type);
        const TypeIcon = typeConfig.icon;
        return (
          <Badge variant={typeConfig.variant} className="gap-1">
            <TypeIcon className="h-3 w-3" />
            {typeConfig.labelShort}
          </Badge>
        );
      },
    },
    {
      id: "payment",
      header: tableCopy.payment,
      kind: "stacked",
      headerClassName: "hidden lg:table-cell",
      className: "hidden lg:table-cell",
      accessor: (client): EntityListStackedValue => {
        const paymentConfig = getPaymentTermsConfig(client.paymentTerms);
        return {
          primary: (
            <Badge variant={paymentConfig.variant} className="w-fit">
              {paymentConfig.labelShort}
            </Badge>
          ),
          secondary:
            client.paymentTerms === "credit"
              ? formatCreditDays(client.creditDays)
              : undefined,
        };
      },
    },
    {
      id: "contact",
      header: tableCopy.contact,
      kind: "stacked",
      headerClassName: "hidden xl:table-cell",
      className: "hidden xl:table-cell",
      accessor: (client): EntityListStackedValue => {
        const contactPhone =
          client.primaryContact?.phone ?? client.phone;
        const contactEmail =
          client.primaryContact?.email ?? client.email;
        const contactName = client.primaryContact?.fullName;
        return {
          primary: contactName || contactPhone || contactEmail || undefined,
          secondary: contactName
            ? contactPhone || contactEmail || undefined
            : contactPhone && contactEmail
              ? contactEmail
              : undefined,
        };
      },
    },
    {
      id: "status",
      header: tableCopy.status,
      kind: "status",
      accessor: (client) => (
        <ClientStatusBadge
          status={operationalStatusFromClient(client.isActive)}
          size="sm"
        />
      ),
    },
    {
      id: "actions",
      header: "",
      kind: "actions",
      accessor: (client) => (
        <ClientActions client={client} variant="dropdown" />
      ),
    },
  ];
}

export function ClientTable({
  clients,
  isLoading = false,
  primaryTo,
  primaryState,
  sort,
  onSortChange,
}: ClientTableProps) {
  const columns = buildColumns();

  return (
    <EntityListTable
      framed={false}
      density="list"
      columns={columns}
      rows={clients}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      primaryTo={primaryTo}
      primaryState={primaryState}
      sort={sort}
      onSortChange={onSortChange}
    />
  );
}

export default ClientTable;
