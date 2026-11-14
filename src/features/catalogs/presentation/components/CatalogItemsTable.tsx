/**
 * CatalogItemsTable — items de catálogo (`EntityListTable`).
 *
 * Código · Nombre · Descripción? · Padre? · Estado? · Acciones?.
 * Empty → null (CatalogDetailPage EmptyState). `framed={false}` bajo SettingsCard.
 * Con `embedded`, búsqueda/paginación viven en el padre.
 */

import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  EntityListTable,
  type EntityListColumnDef,
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

export interface CatalogItemsTableProps {
  items: CatalogItem[];
  isLoading?: boolean;
  showParentCode?: boolean;
  showDescription?: boolean;
  pageSize?: number;
  className?: string;
  /** Si true, el padre controla búsqueda y paginación. */
  embedded?: boolean;
  /** Columna de acciones por fila (permisos resueltos en el padre). */
  renderRowActions?: (item: CatalogItem) => ReactNode;
}

export function CatalogItemsTable({
  items,
  isLoading = false,
  showParentCode = false,
  showDescription = true,
  pageSize = 20,
  className,
  embedded = false,
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

  const showStatusColumn = useMemo(
    () => paginatedItems.some((item) => !item.isActive),
    [paginatedItems],
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const columns = useMemo(
    () =>
      buildColumns({
        showDescription,
        showParentCode,
        showStatus: showStatusColumn,
        renderRowActions,
      }),
    [showDescription, showParentCode, showStatusColumn, renderRowActions],
  );

  if (isLoading) {
    return (
      <div className={cn(embedded ? undefined : "space-y-4", className)}>
        {!embedded ? <Skeleton className="h-10 w-64" /> : null}
        <EntityListTable
          framed={false}
          density="list"
          columns={columns}
          rows={[]}
          getRowId={(row) => row.id}
          isLoading
        />
      </div>
    );
  }

  // El padre (CatalogDetailPage) posee EmptyState único — D6.
  if (paginatedItems.length === 0) {
    return null;
  }

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

      <EntityListTable
        framed={false}
        density="list"
        aria-label={copy.name}
        columns={columns}
        rows={paginatedItems}
        getRowId={(row) => row.id}
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

function buildColumns(args: {
  showDescription: boolean;
  showParentCode: boolean;
  showStatus: boolean;
  renderRowActions?: (item: CatalogItem) => ReactNode;
}): EntityListColumnDef<CatalogItem>[] {
  const { showDescription, showParentCode, showStatus, renderRowActions } =
    args;

  const columns: EntityListColumnDef<CatalogItem>[] = [
    {
      id: "code",
      header: copy.code,
      kind: "code",
      className: "w-[160px]",
      headerClassName: "w-[160px]",
      accessor: (item) => <CopyableCode code={item.code} />,
    },
    {
      id: "name",
      header: copy.name,
      kind: "text",
      className: "font-medium",
      accessor: (item) => item.name,
    },
  ];

  if (showDescription) {
    columns.push({
      id: "description",
      header: copy.description,
      kind: "meta",
      headerClassName: "hidden md:table-cell",
      className: "hidden md:table-cell max-w-[300px] truncate",
      accessor: (item) => item.description || "—",
    });
  }

  if (showParentCode) {
    columns.push({
      id: "parent",
      header: copy.parent,
      kind: "code",
      className: "w-[120px]",
      headerClassName: "w-[120px]",
      accessor: (item) => item.parentCode || "—",
    });
  }

  if (showStatus) {
    columns.push({
      id: "status",
      header: copy.status,
      kind: "status",
      className: "w-[100px]",
      headerClassName: "w-[100px] text-center",
      accessor: (item) =>
        item.isActive ? (
          <Badge variant="success" tone="soft">
            <CheckCircle className="mr-1 h-3 w-3" />
            {copy.active}
          </Badge>
        ) : (
          <Badge variant="neutral" tone="soft">
            <XCircle className="mr-1 h-3 w-3" />
            {copy.inactive}
          </Badge>
        ),
    });
  }

  if (renderRowActions) {
    columns.push({
      id: "actions",
      header: "",
      kind: "actions",
      accessor: (item) => renderRowActions(item),
    });
  }

  return columns;
}

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

export default CatalogItemsTable;
