/**
 * CorridorTariffsTable — listado Operate (`EntityListTable`).
 *
 * Nombre · Ruta · Monto · Estado · ⋯ (opcional). Empty → null (ListPageShell).
 * `framed={false}` bajo shell.
 */

import { Badge } from "@shared/ui/badge";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListStackedValue,
} from "@shared/ui/table";
import { CompensationActiveStatusBadge } from "../config/compensationStatusConfig";
import type { RouteCorridorTariff } from "../../domain/entities";
import { compensationCopy } from "../copy/compensationCopy";
import {
  type BranchNameMap,
  formatCorridorRouteHuman,
} from "../utils/formatCorridorRoute";
import { CorridorTariffActions } from "./CorridorTariffActions";

const copy = compensationCopy.corridors;

interface CorridorTariffsTableProps {
  corridors: RouteCorridorTariff[];
  isLoading?: boolean;
  branchNameMap?: BranchNameMap;
  duplicateIds?: ReadonlySet<string>;
  showActions?: boolean;
  onEdit?: (corridor: RouteCorridorTariff) => void;
  onActionComplete?: () => void;
}

function buildColumns(
  props: Pick<
    CorridorTariffsTableProps,
    "duplicateIds" | "showActions" | "onEdit" | "onActionComplete" | "branchNameMap"
  >,
): EntityListColumnDef<RouteCorridorTariff>[] {
  const {
    duplicateIds,
    showActions = false,
    onEdit,
    onActionComplete,
    branchNameMap,
  } = props;

  const columns: EntityListColumnDef<RouteCorridorTariff>[] = [
    {
      id: "name",
      header: copy.columns.name,
      kind: "primary",
      accessor: (corridor): EntityListStackedValue => ({
        primary: (
          <span className="inline-flex flex-wrap items-center gap-2">
            <span>{corridor.name}</span>
            {duplicateIds?.has(corridor.id) ? (
              <Badge variant="warning" tone="soft">
                {copy.duplicateBadge}
              </Badge>
            ) : null}
          </span>
        ),
      }),
    },
    {
      id: "route",
      header: copy.columns.route,
      kind: "meta",
      accessor: (corridor) =>
        formatCorridorRouteHuman(corridor, branchNameMap),
    },
    {
      id: "amount",
      header: copy.columns.amount,
      kind: "money",
      accessor: (corridor) => corridor.fixedAmount,
    },
    {
      id: "status",
      header: copy.columns.status,
      kind: "status",
      accessor: (corridor) => (
        <CompensationActiveStatusBadge isActive={corridor.isActive} />
      ),
    },
  ];

  if (showActions) {
    columns.push({
      id: "actions",
      header: "",
      kind: "actions",
      accessor: (corridor) => (
        <CorridorTariffActions
          corridor={corridor}
          onEdit={onEdit}
          onActionComplete={onActionComplete}
        />
      ),
    });
  }

  return columns;
}

export function CorridorTariffsTable({
  corridors,
  isLoading,
  branchNameMap,
  duplicateIds,
  showActions = false,
  onEdit,
  onActionComplete,
}: CorridorTariffsTableProps) {
  const columns = buildColumns({
    duplicateIds,
    showActions,
    onEdit,
    onActionComplete,
    branchNameMap,
  });

  return (
    <EntityListTable
      framed={false}
      density="list"
      columns={columns}
      rows={corridors}
      getRowId={(row) => row.id}
      isLoading={isLoading}
    />
  );
}
