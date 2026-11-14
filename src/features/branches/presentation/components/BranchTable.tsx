/**
 * BranchTable — listado Operate (`EntityListTable`, SoT §7 T1–T10).
 *
 * 5 cols: Código · Nombre · Ciudad · Contacto · Estado · ⋯.
 * Sort URL `sortBy`/`sortOrder` (page). Empty → null. `framed={false}`.
 */

import { Badge } from "@shared/ui/badge";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListSortState,
  type EntityListStackedValue,
} from "@shared/ui/table";
import type { BranchListItem } from "../../domain";
import { BranchStatusBadge } from "../config/branchStatusConfig";
import { formatBranchListLocation } from "../utils/branchAddressFormatters";
import { branchesCopy } from "../copy/branchesCopy";
import { BranchActions } from "./BranchActions";

const columnsCopy = branchesCopy.list.columns;

export interface BranchTableProps {
  branches: BranchListItem[];
  isLoading: boolean;
  showDeleted?: boolean;
  /** Href del detalle (link primario + fila). */
  primaryTo: (branch: BranchListItem) => string;
  /** Cola del listado (`location.state.from`). */
  primaryState?: (branch: BranchListItem) => { from: string };
  sort: EntityListSortState;
  onSortChange: (next: EntityListSortState) => void;
}

function buildColumns(
  props: Pick<
    BranchTableProps,
    "showDeleted" | "primaryState"
  >,
): EntityListColumnDef<BranchListItem>[] {
  const { showDeleted = false, primaryState } = props;

  return [
    {
      id: "code",
      header: columnsCopy.code,
      kind: "code",
      sortable: true,
      sortField: "code",
      accessor: (branch) => branch.code,
    },
    {
      id: "name",
      header: columnsCopy.name,
      kind: "primary",
      sortable: true,
      sortField: "name",
      accessor: (branch): EntityListStackedValue => ({
        primary: branch.isMain ? (
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <span>{branch.name}</span>
            <Badge
              variant="outline"
              className="border-warning/40 text-xs font-normal text-warning-soft-foreground"
            >
              {branchesCopy.card.mainBadge}
            </Badge>
          </span>
        ) : (
          branch.name
        ),
      }),
    },
    {
      id: "city",
      header: columnsCopy.city,
      kind: "meta",
      sortable: true,
      sortField: "city",
      headerClassName: "hidden md:table-cell",
      className: "hidden md:table-cell",
      accessor: (branch) =>
        formatBranchListLocation(branch.city, branch.state) || null,
    },
    {
      id: "contact",
      header: columnsCopy.contact,
      kind: "meta",
      headerClassName: "hidden lg:table-cell",
      className: "hidden lg:table-cell",
      accessor: (branch) => branch.phone || null,
    },
    {
      id: "status",
      header: columnsCopy.status,
      kind: "status",
      sortable: true,
      sortField: "status",
      accessor: (branch) => (
        <BranchStatusBadge status={branch.status} size="sm" showIcon />
      ),
    },
    {
      id: "actions",
      header: "",
      kind: "actions",
      accessor: (branch) => (
        <BranchActions
          branchId={branch.id}
          branchName={branch.name}
          fromState={primaryState?.(branch)}
          isActive={!showDeleted && branch.isActive}
          isMain={branch.isMain}
        />
      ),
    },
  ];
}

export function BranchTable({
  branches,
  isLoading,
  showDeleted = false,
  primaryTo,
  primaryState,
  sort,
  onSortChange,
}: BranchTableProps) {
  const columns = buildColumns({ showDeleted, primaryState });

  return (
    <EntityListTable
      framed={false}
      density="list"
      columns={columns}
      rows={branches}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      primaryTo={primaryTo}
      primaryState={primaryState}
      sort={sort}
      onSortChange={onSortChange}
    />
  );
}
