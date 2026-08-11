/**
 * CatalogDetailPage (Settings Integration)
 *
 * Consulta de los valores de un catálogo. Solo lectura para el tenant: la
 * política de mutación vive en el dominio (`isCatalogItemMutable`).
 */

import { memo, useState, useCallback, useMemo } from "react";
import { useDebounce } from "@shared/hooks/use-debounce";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, Database, Loader2 } from "lucide-react";

import { Button } from "@shared/ui/button";
import { Skeleton } from "@shared/ui/skeleton";
import { NotFoundState } from "@shared/ui/feedback-states";
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
import { getCatalogPurpose } from "../copy/catalogDirectory";
import {
  resolveCatalogPublisher,
  resolveCatalogSourceName,
} from "../utils/catalogLabels";
import {
  isGlobalCatalog,
  isCatalogReadOnly,
  isCatalogItemMutable,
  isHierarchicalCatalog,
  type CatalogItem,
} from "../../domain";

const copy = catalogsCopy;

const LARGE_CATALOG_THRESHOLD = 1000;

/** Catálogos que siempre paginan contra el servidor, sin esperar a las stats. */
const KNOWN_LARGE_CATALOGS = [
  "sat_municipio",
  "sat_localidad",
  "sat_colonia",
  "sat_codigo_postal",
  "sat_clave_prod_serv",
  "sat_clave_prod_serv_cp",
  "sat_clave_unidad",
  "sat_material_peligroso",
];

const DEFAULT_PAGE_SIZE = 50;

export const CatalogDetailPage = memo(function CatalogDetailPage() {
  const { typeCode } = useParams<{ typeCode: string }>();
  const { hasPermission } = usePermissions();

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

  const listTotalPages = Math.max(1, Math.ceil(listTotal / DEFAULT_PAGE_SIZE));

  const displayItems: CatalogItem[] = useMemo(() => {
    if (isLargeCatalog) return searchResult?.items ?? [];

    const start = (currentPage - 1) * DEFAULT_PAGE_SIZE;
    return clientFilteredItems.slice(start, start + DEFAULT_PAGE_SIZE);
  }, [isLargeCatalog, searchResult?.items, clientFilteredItems, currentPage]);

  const catalogTotalCount = catalogStats?.itemCount ?? listTotal;

  const isHierarchical = typeCode ? isHierarchicalCatalog(typeCode) : false;

  const hasParentCodes = useMemo(
    () => displayItems.some((item) => item.parentCode !== null),
    [displayItems],
  );

  const showParentColumn = isHierarchical || hasParentCodes;

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

  if (isLoadingTypes) {
    return (
      <SettingsLayout sectionTitle={copy.detail.loadingSectionTitle}>
        <CatalogDetailSkeleton />
      </SettingsLayout>
    );
  }

  if (!catalogType) {
    return (
      <SettingsLayout sectionTitle={copy.detail.notFoundSectionTitle}>
        <NotFoundState
          icon={<Database />}
          title={copy.detail.notFoundTitle}
          description={copy.detail.notFoundDescription}
          backHref="/settings/catalogs"
          backLabel={copy.detail.back}
        />
      </SettingsLayout>
    );
  }

  const purpose =
    getCatalogPurpose(catalogType.code) ??
    catalogType.description ??
    copy.detail.defaultDescription;

  const summarySegments = [
    copy.valuesCount(catalogTotalCount),
    resolveCatalogPublisher(catalogType),
    catalogStats?.currentVersion
      ? copy.detail.summaryVersion(catalogStats.currentVersion)
      : null,
  ].filter(Boolean);

  return (
    <SettingsLayout
      sectionTitle={catalogType.name}
      title={catalogType.name}
      description={purpose}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/settings/catalogs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {copy.detail.back}
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            {summarySegments.join(" · ")}
          </p>
        </div>

        {isReadOnly ? (
          <CatalogGlobalReadOnlyBanner
            variant="detail"
            scope={isGlobal ? "global" : "internal"}
            sourceLabel={resolveCatalogSourceName(catalogType)}
          />
        ) : null}

        <SettingsCard
          title={copy.detail.recordsSection}
          actions={
            canCreate ? (
              <Button onClick={handleAddRecord}>
                <Plus className="mr-2 h-4 w-4" />
                {copy.detail.addRecord}
              </Button>
            ) : undefined
          }
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 items-center gap-3">
                <ListingSearchInput
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder={copy.detail.searchPlaceholder}
                  className="w-full sm:max-w-sm"
                />
                {isFetchingSearch && isLargeCatalog ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                ) : null}
              </div>
              <ListingResultsSummary
                entityLabelPlural={copy.detail.resultsLabel}
                total={listTotal}
                page={currentPage}
                limit={DEFAULT_PAGE_SIZE}
              />
            </div>

            <CatalogItemsTable
              embedded
              items={displayItems}
              isLoading={isLargeCatalog ? isLoadingSearch : isLoadingAllItems}
              isFiltered={debouncedSearch.trim().length > 0}
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
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-20" />
      <Skeleton className="h-64" />
    </div>
  );
}

export default CatalogDetailPage;
