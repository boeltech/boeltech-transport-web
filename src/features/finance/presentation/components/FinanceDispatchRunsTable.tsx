/**
 * FinanceDispatchRunsTable — Correo del periodo (`EntityListTable`).
 *
 * Periodo · Esquema · Origen · Estado · Creada · Acciones.
 * Empty → null (FinanceDispatchPeriodPage / ListPageShell). `framed={false}`.
 * Fechas con `formatDate`. Sin sort API nuevo.
 */

import {
  EntityListTable,
  type EntityListColumnDef,
} from "@shared/ui/table";
import type { BillingDispatchRunListItem } from "../../domain/billingDispatchRun.types";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import { DispatchRunStatusBadge } from "./DispatchRunStatusBadge";
import { formatDispatchPeriodListLabel } from "../utils/formatDispatchPeriod";
import { DispatchRunOriginBadge } from "./DispatchRunOriginBadge";
import { DispatchRunActions } from "./DispatchRunActions";

const copy = dispatchRunsCopy.tab;
const PAGE_SIZE = 20;

interface FinanceDispatchRunsTableProps {
  runs: BillingDispatchRunListItem[];
  isLoading: boolean;
  schemeName: (id: string | null) => string;
  onView: (id: string) => void;
}

function buildColumns(
  schemeName: (id: string | null) => string,
  onView: (id: string) => void,
): EntityListColumnDef<BillingDispatchRunListItem>[] {
  return [
    {
      id: "period",
      header: copy.table.period,
      kind: "text",
      className: "text-sm",
      accessor: (run) => formatDispatchPeriodListLabel(run),
    },
    {
      id: "scheme",
      header: copy.table.scheme,
      kind: "text",
      accessor: (run) => schemeName(run.billingSchemeId),
    },
    {
      id: "origin",
      header: copy.table.origin,
      kind: "status",
      accessor: (run) => <DispatchRunOriginBadge origin={run.origin} />,
    },
    {
      id: "status",
      header: copy.table.status,
      kind: "status",
      accessor: (run) => (
        <DispatchRunStatusBadge status={run.status} origin={run.origin} />
      ),
    },
    {
      id: "createdAt",
      header: copy.table.createdAt,
      kind: "date",
      accessor: (run) => run.createdAt,
    },
    {
      id: "actions",
      header: "",
      kind: "actions",
      accessor: (run) => (
        <DispatchRunActions
          variant="dropdown"
          runId={run.id}
          status={run.status}
          periodLabel={formatDispatchPeriodListLabel(run)}
          onView={onView}
        />
      ),
    },
  ];
}

export function FinanceDispatchRunsTable({
  runs,
  isLoading,
  schemeName,
  onView,
}: FinanceDispatchRunsTableProps) {
  const columns = buildColumns(schemeName, onView);

  return (
    <EntityListTable
      framed={false}
      density="list"
      aria-label={copy.entityLabelPlural}
      columns={columns}
      rows={runs}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      onRowActivate={(run) => onView(run.id)}
    />
  );
}

export const DISPATCH_RUNS_PAGE_SIZE = PAGE_SIZE;
