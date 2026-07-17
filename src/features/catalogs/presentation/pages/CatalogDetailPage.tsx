/**
 * CatalogDetailPage (Settings Integration)
 *
 * Detalle de catálogo: regulatorios e internos en solo lectura para el tenant.
 */

import { memo, useState, useCallback, useMemo } from "react";
import { useDebounce } from "@shared/hooks/use-debounce";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Database,
  FileText,
  AlertTriangle,
  Layers,
  Loader2,
} from "lucide-react";

import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Skeleton } from "@shared/ui/skeleton";
import { StatCard } from "@shared/ui/data-display";
import {
  ListingSearchInput,
  ListingPagination,
  ListingResultsSummary,
} from "@shared/ui/listing";

import { usePermissions } from "@shared/permissions";
import {
  SettingsLayout,
  SettingsCard,
} from "@features/settings/presentation/components/SettingsLayout";
import {
  useCatalogTypes,
  useCatalogItems,
  useCatalogStatistics,
  useCatalogSearch,
} from "../../application/hooks";
import { CatalogItemsTable } from "../components/CatalogItemsTable";
import { CatalogGlobalReadOnlyBanner } from "../components/CatalogGlobalReadOnlyBanner";
import { CatalogItemFormSheet } from "../components/CatalogItemFormSheet";
import { CatalogItemRowActions } from "../components/CatalogItemRowActions";
import { catalogsCopy } from "../copy/catalogsCopy";
import {
  isGlobalCatalog,
  isCatalogReadOnly,
  isCatalogItemMutable,
  isHierarchicalCatalog,
  CATALOG_SOURCE_LABELS,
  type CatalogItem,
} from "../../domain";

const LARGE_CATALOG_THRESHOLD = 1000;

const KNOWN_LARGE_CATALOGS = [
  "sat_municipio",
  "sat_localidad",
  "sat_colonia",
  "sat_codigo_postal",
  "sat_clave_prod_serv_cp",
  "sat_clave_unidad",
  "sat_material_peligroso",
  "sat_fraccion_arancelaria",
];

const DEFAULT_PAGE_SIZE = 50;

export const CatalogDetailPage = memo(function CatalogDetailPage() {
  const { typeCode } = useParams<{ typeCode: string }>();
  const { hasPermission } = usePermissions();
  const copy = catalogsCopy;

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);

  const isKnownLargeCatalog = typeCode
    ? KNOWN_LARGE_CATALOGS.includes(typeCode)
    : false;

  const { data: types, isLoading: isLoadingTypes } = useCatalogTypes();
  const { data: statistics } = useCatalogStatistics();

  const { data: allItems, isLoading: isLoadingAllItems } = useCatalogItems(
    typeCode ?? "",
    undefined,
    {
      enabled: !!typeCode && !isKnownLargeCatalog,
    },
  );

  const catalogType = useMemo(
    () => types?.find((t) => t.code === typeCode),
    [types, typeCode],
  );

  const catalogStats = useMemo(
    () => statistics?.find((s) => s.typeCode === typeCode),
    [statistics, typeCode],
  );

  const isGlobal = catalogType ? isGlobalCatalog(catalogType) : false;
  const isReadOnly = catalogType ? isCatalogReadOnly(catalogType) : true;
  const canCreate =
    catalogType &&
    isCatalogItemMutable(catalogType) &&
    hasPermission("catalogs", "create");
  const canMutate =
    catalogType &&
    isCatalogItemMutable(catalogType) &&
    (hasPermission("catalogs", "update") ||
      hasPermission("catalogs", "delete"));

  const isLargeCatalog = useMemo(() => {
    if (isKnownLargeCatalog) return true;
    const itemCount = catalogStats?.itemCount ?? allItems?.length ?? 0;
    return itemCount > LARGE_CATALOG_THRESHOLD;
  }, [isKnownLargeCatalog, catalogStats?.itemCount, allItems?.length]);

  const {
    data: searchResult,
    isLoading: isLoadingSearch,
    isFetching: isFetchingSearch,
  } = useCatalogSearch(typeCode ?? "", {
    query: debouncedSearch || " ",
    limit: DEFAULT_PAGE_SIZE,
    offset: (currentPage - 1) * DEFAULT_PAGE_SIZE,
    includeInactive: true,
    enabled: isLargeCatalog,
  });

  const clientFilteredItems = useMemo(() => {
    if (isLargeCatalog) return [];

    const term = debouncedSearch.trim().toLowerCase();
    const source = allItems ?? [];
    if (!term) return source;

    return source.filter(
      (item) =>
        item.code.toLowerCase().includes(term) ||
        item.name.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term),
    );
  }, [isLargeCatalog, allItems, debouncedSearch]);

  const listTotal = useMemo(() => {
    if (isLargeCatalog) return searchResult?.total ?? 0;
    return clientFilteredItems.length;
  }, [isLargeCatalog, searchResult?.total, clientFilteredItems.length]);

  const listTotalPages = Math.max(
    1,
    Math.ceil(listTotal / DEFAULT_PAGE_SIZE),
  );

  const displayItems: CatalogItem[] = useMemo(() => {
    if (isLargeCatalog) return searchResult?.items ?? [];

    const start = (currentPage - 1) * DEFAULT_PAGE_SIZE;
    return clientFilteredItems.slice(start, start + DEFAULT_PAGE_SIZE);
  }, [
    isLargeCatalog,
    searchResult?.items,
    clientFilteredItems,
    currentPage,
  ]);

  const catalogTotalCount = catalogStats?.itemCount ?? listTotal;

  const isHierarchical = typeCode ? isHierarchicalCatalog(typeCode) : false;

  const hasParentCodes = useMemo(
    () => displayItems.some((item) => item.parentCode !== null) ?? false,
    [displayItems],
  );

  const showParentColumn = isHierarchical || hasParentCodes;

  const isLoading =
    isLoadingTypes || (isLargeCatalog ? isLoadingSearch : isLoadingAllItems);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleAddRecord = useCallback(() => {
    setEditingItem(null);
    setFormOpen(true);
  }, []);

  const handleEditItem = useCallback((item: CatalogItem) => {
    setEditingItem(item);
    setFormOpen(true);
  }, []);

  const handleFormOpenChange = useCallback((open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditingItem(null);
    }
  }, []);

  const sourceLabel = catalogType?.source
    ? (CATALOG_SOURCE_LABELS[catalogType.source] ?? catalogType.source)
    : copy.badges.internal;

  if (isLoadingTypes) {
    return (
      <SettingsLayout sectionTitle="Cargando...">
        <CatalogDetailSkeleton />
      </SettingsLayout>
    );
  }

  if (!catalogType) {
    return (
      <SettingsLayout sectionTitle="No encontrado">
        <div className="py-12 text-center">
          <Database className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-lg font-semibold">
            {copy.detail.notFoundTitle}
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {copy.detail.notFoundDescription(typeCode ?? "")}
          </p>
          <Button asChild>
            <Link to="/settings/catalogs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {copy.detail.back}
            </Link>
          </Button>
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout sectionTitle={catalogType.name}>
      <div className="space-y-6">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/settings/catalogs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {copy.detail.back}
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">{catalogType.name}</h2>
              <Badge variant={isGlobal ? "default" : "secondary"}>
                {isGlobal ? copy.badges.regulatory : copy.badges.internal}
              </Badge>
              {isReadOnly ? (
                <Badge variant="outline">{copy.badges.readOnly}</Badge>
              ) : null}
              {showParentColumn ? (
                <Badge variant="outline">
                  <Layers className="mr-1 h-3 w-3" />
                  Jerárquico
                </Badge>
              ) : null}
              {isLargeCatalog ? (
                <Badge variant="warning" tone="soft">
                  <Database className="mr-1 h-3 w-3" />
                  Grande
                </Badge>
              ) : null}
            </div>
            <p className="font-mono text-sm text-muted-foreground">
              {catalogType.code}
            </p>
            {catalogType.description ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {catalogType.description}
              </p>
            ) : null}
          </div>

          {canCreate ? (
            <Button onClick={handleAddRecord}>
              <Plus className="mr-2 h-4 w-4" />
              {copy.detail.addRecord}
            </Button>
          ) : null}
        </div>

        {isReadOnly ? (
          <CatalogGlobalReadOnlyBanner
            variant="detail"
            scope={isGlobal ? "global" : "internal"}
            sourceLabel={sourceLabel}
            version={catalogStats?.currentVersion}
          />
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Registros"
            value={(catalogStats?.itemCount ?? catalogTotalCount).toLocaleString(
              "es-MX",
            )}
            icon={<FileText className="h-5 w-5 text-primary" />}
            isLoading={isLoading}
          />
          <StatCard
            title="Fuente"
            value={sourceLabel}
            icon={<Database className="h-5 w-5 text-primary" />}
          />
          <StatCard
            title="Tipo"
            value={showParentColumn ? "Jerárquico" : "Plano"}
            icon={<Layers className="h-5 w-5 text-primary" />}
          />
          <StatCard
            title="Versión"
            value={catalogStats?.currentVersion ?? "—"}
            icon={<FileText className="h-5 w-5 text-primary" />}
            className="[&_p:last-child]:font-mono [&_p:last-child]:text-sm"
          />
        </div>

        {isLargeCatalog ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {copy.detail.largeCatalogHint(
                LARGE_CATALOG_THRESHOLD.toLocaleString("es-MX"),
              )}
            </AlertDescription>
          </Alert>
        ) : null}

        <SettingsCard
          title={copy.detail.recordsSection}
          description={copy.detail.recordsDescription(
            catalogTotalCount.toLocaleString("es-MX"),
          )}
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 items-center gap-3">
                <ListingSearchInput
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder={
                    isLargeCatalog
                      ? "Buscar en el servidor..."
                      : "Buscar por código o nombre..."
                  }
                  className="w-full sm:max-w-sm"
                />
                {isFetchingSearch && isLargeCatalog ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                ) : null}
              </div>
              <ListingResultsSummary
                entityLabelPlural="registros"
                total={listTotal}
                page={currentPage}
                limit={DEFAULT_PAGE_SIZE}
              />
            </div>

            <CatalogItemsTable
              embedded
              items={displayItems}
              isLoading={isLargeCatalog ? isLoadingSearch : isLoadingAllItems}
              showParentCode={showParentColumn}
              showDescription={!isLargeCatalog}
              renderRowActions={
                canMutate && typeCode
                  ? (item) => (
                      <CatalogItemRowActions
                        typeCode={typeCode}
                        item={item}
                        onEdit={handleEditItem}
                      />
                    )
                  : undefined
              }
            />

            <ListingPagination
              page={currentPage}
              totalPages={listTotalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </SettingsCard>

        {canCreate && typeCode ? (
          <CatalogItemFormSheet
            typeCode={typeCode}
            open={formOpen}
            onOpenChange={handleFormOpenChange}
            item={editingItem}
            showParentCode={showParentColumn}
          />
        ) : null}
      </div>
    </SettingsLayout>
  );
});

function CatalogDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

export default CatalogDetailPage;
