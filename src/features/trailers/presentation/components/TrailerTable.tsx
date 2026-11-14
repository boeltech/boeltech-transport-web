/**
 * TrailerTable — listado Operate (`EntityListTable`, SoT §7 T1–T10).
 *
 * 4 cols: Placa · Tipo · Estado · Notas · ⋯. Sin detalle (sin primaryTo).
 * Empty → null (ListPageShell). `framed={false}`.
 */

import { Skeleton } from "@shared/ui/skeleton";
import {
  EntityListTable,
  type EntityListColumnDef,
} from "@shared/ui/table";
import type { TrailerListItem } from "../../domain";
import { TrailerStatusBadge } from "../config/trailerStatusConfig";
import { trailersCopy } from "../copy/trailersCopy";
import { TrailerActions } from "./TrailerActions";

const listCopy = trailersCopy.list.table;

export interface TrailerTableProps {
  trailers: TrailerListItem[];
  isLoading: boolean;
  typeLabelFor: (code: string | null | undefined) => string | null;
  typeLabelsLoading?: boolean;
  onEdit: (id: string) => void;
}

function buildColumns(
  props: Pick<
    TrailerTableProps,
    "typeLabelFor" | "typeLabelsLoading" | "onEdit"
  >,
): EntityListColumnDef<TrailerListItem>[] {
  const { typeLabelFor, typeLabelsLoading = false, onEdit } = props;

  return [
    {
      id: "plate",
      header: listCopy.plate,
      kind: "code",
      accessor: (trailer) => trailer.licensePlate,
    },
    {
      id: "type",
      header: listCopy.type,
      kind: "meta",
      accessor: (trailer) => {
        if (typeLabelsLoading) {
          return <Skeleton className="h-4 w-36" />;
        }
        return typeLabelFor(trailer.satSubTipoRemCode) ?? listCopy.typeMissing;
      },
    },
    {
      id: "status",
      header: listCopy.status,
      kind: "status",
      accessor: (trailer) => (
        <TrailerStatusBadge status={trailer.status} size="sm" showIcon />
      ),
    },
    {
      id: "notes",
      header: listCopy.notes,
      kind: "text",
      headerClassName: "hidden md:table-cell",
      className: "hidden max-w-[16rem] md:table-cell",
      accessor: (trailer) => {
        const trimmed = trailer.notes?.trim() ?? "";
        return trimmed || listCopy.notesEmpty;
      },
    },
    {
      id: "actions",
      header: "",
      kind: "actions",
      accessor: (trailer) => (
        <TrailerActions
          trailerId={trailer.id}
          licensePlate={trailer.licensePlate}
          status={trailer.status}
          onEdit={() => onEdit(trailer.id)}
        />
      ),
    },
  ];
}

export function TrailerTable({
  trailers,
  isLoading,
  typeLabelFor,
  typeLabelsLoading = false,
  onEdit,
}: TrailerTableProps) {
  const columns = buildColumns({
    typeLabelFor,
    typeLabelsLoading,
    onEdit,
  });

  return (
    <EntityListTable
      framed={false}
      density="list"
      columns={columns}
      rows={trailers}
      getRowId={(row) => row.id}
      isLoading={isLoading}
    />
  );
}
