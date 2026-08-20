/**
 * TrailerTable
 * Clean Architecture - Presentation Layer (Components)
 *
 * Tabla de remolques: Placa | Tipo | Estado | Notas | acciones.
 * Sin navegación a detalle (Capa 1 D1').
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Skeleton } from "@shared/ui/skeleton";
import type { TrailerListItem } from "../../domain";
import { TrailerStatusBadge } from "../config/trailerStatusConfig";
import { trailersCopy } from "../copy/trailersCopy";
import { TrailerActions } from "./TrailerActions";

const listCopy = trailersCopy.list.table;

interface TrailerTableProps {
  trailers: TrailerListItem[];
  isLoading: boolean;
  typeLabelFor: (code: string | null | undefined) => string | null;
  typeLabelsLoading?: boolean;
  onEdit: (id: string) => void;
}

const TABLE_HEADERS: { key: string; label: string; className?: string }[] = [
  { key: "plate", label: listCopy.plate },
  { key: "type", label: listCopy.type },
  { key: "status", label: listCopy.status },
  { key: "notes", label: listCopy.notes },
  { key: "actions", label: "", className: "w-[1%] whitespace-nowrap text-right" },
];

function TableHeaderRow() {
  return (
    <TableHeader>
      <TableRow>
        {TABLE_HEADERS.map((header) => (
          <TableHead key={header.key} className={header.className}>
            {header.label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}

function LoadingSkeleton() {
  return (
    <TableBody>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-36" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-40" />
          </TableCell>
          <TableCell>
            <Skeleton className="ml-auto h-8 w-28" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}

function EmptyState() {
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={TABLE_HEADERS.length} className="h-24 text-center">
          {listCopy.empty}
        </TableCell>
      </TableRow>
    </TableBody>
  );
}

function NotesCell({ notes }: { notes: string | null }) {
  const trimmed = notes?.trim() ?? "";
  if (!trimmed) {
    return (
      <TableCell className="text-muted-foreground">{listCopy.notesEmpty}</TableCell>
    );
  }
  return (
    <TableCell className="max-w-[16rem] truncate text-muted-foreground" title={trimmed}>
      {trimmed}
    </TableCell>
  );
}

export function TrailerTable({
  trailers,
  isLoading,
  typeLabelFor,
  typeLabelsLoading = false,
  onEdit,
}: TrailerTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeaderRow />
          <LoadingSkeleton />
        </Table>
      </div>
    );
  }

  if (trailers.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeaderRow />
          <EmptyState />
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeaderRow />
        <TableBody>
          {trailers.map((trailer) => (
            <TableRow key={trailer.id}>
              <TableCell className="font-medium font-mono">
                {trailer.licensePlate}
              </TableCell>
              <TableCell>
                {typeLabelsLoading ? (
                  <Skeleton className="h-4 w-36" />
                ) : (
                  typeLabelFor(trailer.satSubTipoRemCode) ?? listCopy.typeMissing
                )}
              </TableCell>
              <TableCell>
                <TrailerStatusBadge
                  status={trailer.status}
                  size="sm"
                  showIcon
                />
              </TableCell>
              <NotesCell notes={trailer.notes} />
              <TableCell className="text-right">
                <TrailerActions
                  trailerId={trailer.id}
                  licensePlate={trailer.licensePlate}
                  onEdit={() => onEdit(trailer.id)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
