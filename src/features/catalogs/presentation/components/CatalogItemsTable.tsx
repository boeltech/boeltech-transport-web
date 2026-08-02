/**
 * CatalogItemsTable Component
 * Clean Architecture - Presentation Layer
 *
 * Tabla para mostrar items de un catálogo.
 * Con `embedded`, solo renderiza la tabla (búsqueda/paginación en el padre).
 */

import { useCallback, useState, useMemo, type ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Skeleton } from "@shared/ui/skeleton";
import { CheckCircle, Copy, XCircle } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { useToast } from "@shared/hooks";
import { copyToClipboard } from "@shared/utils/copyToClipboard";
import {
  ListingSearchInput,
  ListingPagination,
  ListingResultsSummary,
} from "@shared/ui/listing";
import { catalogsCopy } from "../copy/catalogsCopy";
import type { CatalogItem } from "../../domain";

const copy = catalogsCopy.table;

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
  /**
   * Solo en modo `embedded`: indica que el padre aplicó un filtro de búsqueda,
   * para distinguir "sin coincidencias" de "catálogo vacío".
   */
  isFiltered?: boolean;
  /** Columna de acciones por fila (permisos resueltos en el padre). */
  renderRowActions?: (item: CatalogItem) => ReactNode;
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
  isFiltered = false,
  renderRowActions,
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

  // El estado solo aporta cuando hay algún valor dado de baja.
  const showStatusColumn = useMemo(
    () => paginatedItems.some((item) => !item.isActive),
    [paginatedItems],
  );

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
          showActions={Boolean(renderRowActions)}
        />
      </div>
    );
  }

  const hasActiveSearch = embedded ? isFiltered : Boolean(searchTerm.trim());

  return (
    <div className={cn(embedded ? undefined : "space-y-4", className)}>
      {!embedded ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ListingSearchInput
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={catalogsCopy.detail.searchPlaceholder}
            className="w-full sm:max-w-sm"
          />
          <ListingResultsSummary
            entityLabelPlural={catalogsCopy.detail.resultsLabel}
            total={filteredItems.length}
            page={currentPage}
            limit={pageSize}
          />
        </div>
      ) : null}

      <CatalogItemsTableBody
        items={paginatedItems}
        showDescription={showDescription}
        showParentCode={showParentCode}
        showStatus={showStatusColumn}
        renderRowActions={renderRowActions}
        emptyMessage={hasActiveSearch ? copy.emptySearch : copy.emptyAll}
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
  showStatus: boolean;
  emptyMessage: string;
  renderRowActions?: (item: CatalogItem) => ReactNode;
}

function CatalogItemsTableBody({
  items,
  showDescription,
  showParentCode,
  showStatus,
  emptyMessage,
  renderRowActions,
}: CatalogItemsTableBodyProps) {
  const colSpan =
    2 +
    (showDescription ? 1 : 0) +
    (showParentCode ? 1 : 0) +
    (showStatus ? 1 : 0) +
    (renderRowActions ? 1 : 0);

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[160px]">{copy.code}</TableHead>
            <TableHead>{copy.name}</TableHead>
            {showDescription ? (
              <TableHead className="hidden md:table-cell">
                {copy.description}
              </TableHead>
            ) : null}
            {showParentCode ? (
              <TableHead className="w-[120px]">{copy.parent}</TableHead>
            ) : null}
            {showStatus ? (
              <TableHead className="w-[100px] text-center">
                {copy.status}
              </TableHead>
            ) : null}
            {renderRowActions ? (
              <TableHead className="w-[72px] text-right">
                {copy.actions}
              </TableHead>
            ) : null}
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
                <TableCell>
                  <CopyableCode code={item.code} />
                </TableCell>
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
                {showStatus ? (
                  <TableCell className="text-center">
                    {item.isActive ? (
                      <Badge variant="success" tone="soft">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {copy.active}
                      </Badge>
                    ) : (
                      <Badge variant="neutral" tone="soft">
                        <XCircle className="h-3 w-3 mr-1" />
                        {copy.inactive}
                      </Badge>
                    )}
                  </TableCell>
                ) : null}
                {renderRowActions ? (
                  <TableCell className="text-right">
                    {renderRowActions(item)}
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ============================================================================
// COPYABLE CODE
// ============================================================================

function CopyableCode({ code }: { code: string }) {
  const { toast } = useToast();

  const handleCopy = useCallback(async () => {
    const copied = await copyToClipboard(code);
    toast(
      copied
        ? { title: copy.copySuccess }
        : { title: copy.copyError, variant: "destructive" },
    );
  }, [code, toast]);

  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-sm">{code}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={() => void handleCopy()}
        aria-label={copy.copyCode(code)}
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function CatalogItemsTableSkeleton({
  showDescription,
  showParentCode,
  showActions = false,
}: {
  showDescription: boolean;
  showParentCode: boolean;
  showActions?: boolean;
}) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{copy.code}</TableHead>
            <TableHead>{copy.name}</TableHead>
            {showDescription ? <TableHead>{copy.description}</TableHead> : null}
            {showParentCode ? <TableHead>{copy.parent}</TableHead> : null}
            {showActions ? <TableHead>{copy.actions}</TableHead> : null}
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
              {showActions ? (
                <TableCell>
                  <Skeleton className="h-5 w-8" />
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default CatalogItemsTable;
