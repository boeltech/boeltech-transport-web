/**
 * VehicleTable — ancla Operate (`EntityListTable`, SoT §7 T1–T10).
 *
 * 7 cols: Unidad+tipo · Marca y modelo+año · Placa · Sucursal ·
 * Kilometraje (km) · Estado · ⋯. Sort solo `unit_number` (Q2: sin km).
 * Empty → null (ListPageShell). Bajo shell: `framed={false}`.
 */

import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListSortState,
  type EntityListStackedValue,
} from "@shared/ui/table";
import { formatBranchLabel } from "@shared/utils/branchSelectUtils";
import type { VehicleListItem } from "../../domain";
import { VEHICLE_TYPE_LABELS } from "../../domain";
import {
  VehicleLifecycleBadge,
  VehicleStatusBadge,
} from "../config/vehicleStatusConfig";
import { vehiclesCopy } from "../copy";
import { VehicleActions } from "./VehicleActions";

const listCopy = vehiclesCopy.list.table;

export interface VehicleTableProps {
  vehicles: VehicleListItem[];
  isLoading: boolean;
  /** Href del detalle (link primario + fila). */
  primaryTo: (vehicle: VehicleListItem) => string;
  /** Cola del listado (`location.state.from`). */
  primaryState?: (vehicle: VehicleListItem) => unknown;
  sort: EntityListSortState;
  onSortChange: (next: EntityListSortState) => void;
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  onDeactivate?: (id: string) => void;
  onRestore?: (id: string) => void;
}

function buildColumns(
  props: Pick<
    VehicleTableProps,
    "onView" | "onEdit" | "onDeactivate" | "onRestore"
  >,
): EntityListColumnDef<VehicleListItem>[] {
  const { onView, onEdit, onDeactivate, onRestore } = props;

  return [
    {
      id: "unit",
      header: listCopy.unit,
      kind: "primary",
      sortable: true,
      sortField: "unit_number",
      accessor: (vehicle): EntityListStackedValue => ({
        primary: vehicle.unitNumber,
        secondary: VEHICLE_TYPE_LABELS[vehicle.type],
      }),
    },
    {
      id: "brandModel",
      header: listCopy.brandModel,
      kind: "stacked",
      accessor: (vehicle): EntityListStackedValue => ({
        primary: `${vehicle.brand} ${vehicle.model}`.trim(),
        secondary:
          vehicle.year != null ? String(vehicle.year) : undefined,
      }),
    },
    {
      id: "plate",
      header: listCopy.plate,
      kind: "code",
      accessor: (vehicle) => vehicle.licensePlate,
    },
    {
      id: "branch",
      header: listCopy.branch,
      kind: "meta",
      accessor: (vehicle) =>
        formatBranchLabel(vehicle.branchName, vehicle.branchCode),
    },
    {
      id: "mileage",
      header: listCopy.mileage,
      kind: "number",
      accessor: (vehicle) => vehicle.currentMileage,
    },
    {
      id: "status",
      header: listCopy.status,
      kind: "status",
      accessor: (vehicle) =>
        vehicle.isActive === false ? (
          <VehicleLifecycleBadge status="deactivated" size="sm" showIcon />
        ) : (
          <VehicleStatusBadge status={vehicle.status} size="sm" showIcon />
        ),
    },
    {
      id: "actions",
      header: "",
      kind: "actions",
      accessor: (vehicle) => (
        <VehicleActions
          vehicle={vehicle}
          onView={onView}
          onEdit={onEdit}
          onDeactivate={onDeactivate}
          onRestore={onRestore}
        />
      ),
    },
  ];
}

export function VehicleTable({
  vehicles,
  isLoading,
  primaryTo,
  primaryState,
  sort,
  onSortChange,
  onView,
  onEdit,
  onDeactivate,
  onRestore,
}: VehicleTableProps) {
  const columns = buildColumns({
    onView,
    onEdit,
    onDeactivate,
    onRestore,
  });

  return (
    <EntityListTable
      framed={false}
      density="list"
      columns={columns}
      rows={vehicles}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      primaryTo={primaryTo}
      primaryState={primaryState}
      sort={sort}
      onSortChange={onSortChange}
    />
  );
}
