/**
 * CatalogItemsTable Component
 * Clean Architecture - Presentation Layer
 *
 * Tabla para mostrar items de un catálogo.
 * Con `embedded`, solo renderiza la tabla (búsqueda/paginación en el padre).
 */

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Badge } from "@shared/ui/badge";
import { Skeleton } from "@shared/ui/skeleton";
import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import {
  ListingSearchInput,
  ListingPagination,
  ListingResultsSummary,
} from "@shared/ui/listing";
import type { CatalogItem } from "../../domain";

// ============================================================================
// TYPES
// ============================================================================

export interface CatalogItemsTableProps {
  items: CatalogItem[];
  isLoading?: boolean;
  showParentCode?: boolean;
  showDescription?: boolean;
  pageSize?: number;
  className?: string;
  /** Si true, el padre controla búsqueda y paginación. */
  embedded?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CatalogItemsTable({
  items,
  isLoading = false,
  showParentCode = false,
  showDescription = true,
  pageSize = 20,
  className,
  embedded = false,
}: CatalogItemsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredItems = useMemo(() => {
    if (embedded || !searchTerm.trim()) return items;

    const term = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.code.toLowerCase().includes(term) ||
        item.name.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term),
    );
  }, [embedded, items, searchTerm]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = embedded
    ? items
    : filteredItems.slice(startIndex, endIndex);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className={cn(embedded ? undefined : "space-y-4", className)}>
        {!embedded ? <Skeleton className="h-10 w-64" /> : null}
        <CatalogItemsTableSkeleton
          showDescription={showDescription}
          showParentCode={showParentCode}
        />
      </div>
    );
  }

  return (
    <div className={cn(embedded ? undefined : "space-y-4", className)}>
      {!embedded ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <ListingSearchInput
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Buscar por código o nombre..."
              className="w-full sm:max-w-sm"
            />
            <ListingResultsSummary
              entityLabelPlural="registros"
              total={filteredItems.length}
              page={currentPage}
              limit={pageSize}
            />
          </div>
        </>
      ) : null}

      <CatalogItemsTableBody
        items={paginatedItems}
        showDescription={showDescription}
        showParentCode={showParentCode}
        emptyMessage={
          !embedded && searchTerm
            ? "No se encontraron resultados"
            : "No hay registros"
        }
      />

      {!embedded && totalPages > 1 ? (
        <ListingPagination
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      ) : null}
    </div>
  );
}

// ============================================================================
// TABLE BODY
// ============================================================================

interface CatalogItemsTableBodyProps {
  items: CatalogItem[];
  showDescription: boolean;
  showParentCode: boolean;
  emptyMessage: string;
}

function CatalogItemsTableBody({
  items,
  showDescription,
  showParentCode,
  emptyMessage,
}: CatalogItemsTableBodyProps) {
  const colSpan =
    2 + (showDescription ? 1 : 0) + (showParentCode ? 1 : 0) + 1;

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Código</TableHead>
            <TableHead>Nombre</TableHead>
            {showDescription ? (
              <TableHead className="hidden md:table-cell">Descripción</TableHead>
            ) : null}
            {showParentCode ? (
              <TableHead className="w-[100px]">Padre</TableHead>
            ) : null}
            <TableHead className="w-[100px] text-center">Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan} className="h-24 text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-sm">{item.code}</TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                {showDescription ? (
                  <TableCell className="hidden md:table-cell text-muted-foreground max-w-[300px] truncate">
                    {item.description || "—"}
                  </TableCell>
                ) : null}
                {showParentCode ? (
                  <TableCell className="font-mono text-sm">
                    {item.parentCode || "—"}
                  </TableCell>
                ) : null}
                <TableCell className="text-center">
                  {item.isActive ? (
                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-200 bg-green-50"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Activo
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-red-600 border-red-200 bg-red-50"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactivo
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function CatalogItemsTableSkeleton({
  showDescription,
  showParentCode,
}: {
  showDescription: boolean;
  showParentCode: boolean;
}) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Nombre</TableHead>
            {showDescription ? <TableHead>Descripción</TableHead> : null}
            {showParentCode ? <TableHead>Padre</TableHead> : null}
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-40" />
              </TableCell>
              {showDescription ? (
                <TableCell>
                  <Skeleton className="h-4 w-60" />
                </TableCell>
              ) : null}
              {showParentCode ? (
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
              ) : null}
              <TableCell>
                <Skeleton className="h-5 w-16" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default CatalogItemsTable;
