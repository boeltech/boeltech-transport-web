/**
 * CatalogDetailPage (Settings Integration)
 * Clean Architecture - Presentation Layer
 *
 * Página de detalle de un catálogo específico.
 * Usa el SettingsLayout para navegación consistente.
 *
 * ACTUALIZADO: Soporte para catálogos grandes usando useCatalogSearch
 * con paginación del lado del servidor.
 *
 * Ubicación: src/features/catalogs/presentation/pages/CatalogDetailPage.tsx
 */

import { memo, useState, useCallback, useMemo } from "react";
import { useDebounce } from "@shared/hooks/use-debounce";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
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
import { CatalogImportWizard } from "../components/CatalogImportWizard";
import {
  isSatCatalog,
  isHierarchicalCatalog,
  CATALOG_SOURCE_LABELS,
  type CatalogItem,
} from "../../domain";

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Umbral para considerar un catálogo como "grande".
 * Los catálogos con más items que este umbral usarán búsqueda server-side.
 */
const LARGE_CATALOG_THRESHOLD = 1000;

/**
 * Catálogos conocidos como grandes que siempre usarán búsqueda server-side.
 * Esto evita hacer un fetch inicial para determinar el tamaño.
 */
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CatalogDetailPage = memo(function CatalogDetailPage() {
  const { typeCode } = useParams<{ typeCode: string }>();
  const { hasPermission } = usePermissions();

  // ══════════════════════════════════════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════════════════════════════════════

  const [importWizardOpen, setImportWizardOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);

  // ══════════════════════════════════════════════════════════════════════════
  // DERIVED STATE
  // ══════════════════════════════════════════════════════════════════════════

  // Determinar si es un catálogo grande conocido
  const isKnownLargeCatalog = typeCode
    ? KNOWN_LARGE_CATALOGS.includes(typeCode)
    : false;

  // ══════════════════════════════════════════════════════════════════════════
  // DATA FETCHING
  // ══════════════════════════════════════════════════════════════════════════

  const { data: types, isLoading: isLoadingTypes } = useCatalogTypes();
  const { data: statistics } = useCatalogStatistics();

  // Para catálogos pequeños: cargar todos los items
  const { data: allItems, isLoading: isLoadingAllItems } = useCatalogItems(
    typeCode ?? "",
    undefined,
    {
      enabled: !!typeCode && !isKnownLargeCatalog,
    },
  );

  // ══════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ══════════════════════════════════════════════════════════════════════════

  const catalogType = useMemo(
    () => types?.find((t) => t.code === typeCode),
    [types, typeCode],
  );

  const catalogStats = useMemo(
    () => statistics?.find((s) => s.typeCode === typeCode),
    [statistics, typeCode],
  );

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

  const isSat = typeCode ? isSatCatalog(typeCode) : false;
  const canImport = hasPermission("catalogs", "import") && isSat;
  const isHierarchical = typeCode ? isHierarchicalCatalog(typeCode) : false;

  // También detectar jerarquía por datos
  const hasParentCodes = useMemo(
    () => displayItems.some((item) => item.parentCode !== null) ?? false,
    [displayItems],
  );

  const showParentColumn = isHierarchical || hasParentCodes;

  const isLoading =
    isLoadingTypes || (isLargeCatalog ? isLoadingSearch : isLoadingAllItems);

  // ══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

  const handleImportOpenChange = useCallback((open: boolean) => {
    setImportWizardOpen(open);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // DERIVED LABELS
  // ══════════════════════════════════════════════════════════════════════════

  const sourceLabel = catalogType?.source
    ? (CATALOG_SOURCE_LABELS[catalogType.source] ?? catalogType.source)
    : "Interno";

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: Loading State
  // ══════════════════════════════════════════════════════════════════════════

  if (isLoadingTypes) {
    return (
      <SettingsLayout sectionTitle="Cargando...">
        <CatalogDetailSkeleton />
      </SettingsLayout>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: Not Found
  // ══════════════════════════════════════════════════════════════════════════

  if (!catalogType) {
    return (
      <SettingsLayout sectionTitle="No encontrado">
        <div className="text-center py-12">
          <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Catálogo no encontrado</h2>
          <p className="text-sm text-muted-foreground mb-4">
            El catálogo "{typeCode}" no existe o no está disponible.
          </p>
          <Button asChild>
            <Link to="/settings/catalogs">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Catálogos
            </Link>
          </Button>
        </div>
      </SettingsLayout>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: Main Content
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <SettingsLayout sectionTitle={catalogType.name}>
      <div className="space-y-6">
        {/* Back button */}
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/settings/catalogs">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Catálogos
            </Link>
          </Button>
        </div>

        {/* Header info */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-semibold">{catalogType.name}</h2>
              <Badge variant={isSat ? "default" : "secondary"}>
                {sourceLabel}
              </Badge>
              {showParentColumn && (
                <Badge variant="outline">
                  <Layers className="h-3 w-3 mr-1" />
                  Jerárquico
                </Badge>
              )}
              {isLargeCatalog && (
                <Badge variant="warning" tone="soft">
                  <Database className="h-3 w-3 mr-1" />
                  Grande
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground font-mono">
              {catalogType.code}
            </p>
            {catalogType.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {catalogType.description}
              </p>
            )}
          </div>

          {canImport && (
            <Button onClick={() => setImportWizardOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
          )}
        </div>

        {/* Stats */}
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

        {/* Large catalog info */}
        {isLargeCatalog && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Este catálogo tiene más de{" "}
              {LARGE_CATALOG_THRESHOLD.toLocaleString()} registros. La búsqueda
              se realiza en el servidor. Escribe para filtrar los resultados.
            </AlertDescription>
          </Alert>
        )}

        {/* Items section with search and pagination */}
        <SettingsCard
          title="Registros"
          description={`${catalogTotalCount.toLocaleString("es-MX")} registros en este catálogo`}
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
            />

            <ListingPagination
              page={currentPage}
              totalPages={listTotalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </SettingsCard>

        {/* Import Wizard */}
        {typeCode && (
          <CatalogImportWizard
            typeCode={typeCode}
            open={importWizardOpen}
            onOpenChange={handleImportOpenChange}
          />
        )}
      </div>
    </SettingsLayout>
  );
});

// ============================================================================
// SKELETON
// ============================================================================

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
