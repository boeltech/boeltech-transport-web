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
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";

import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Skeleton } from "@shared/ui/skeleton";
import { Input } from "@shared/ui/input";

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

  // Para catálogos grandes: usar búsqueda paginada
  const {
    data: searchResult,
    isLoading: isLoadingSearch,
    isFetching: isFetchingSearch,
  } = useCatalogSearch(typeCode ?? "", {
    query: debouncedSearch || " ", // Espacio para cargar página inicial
    limit: DEFAULT_PAGE_SIZE,
    offset: (currentPage - 1) * DEFAULT_PAGE_SIZE,
    includeInactive: true,
  });


  // ══════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ══════════════════════════════════════════════════════════════════════════

  // Encontrar el tipo de catálogo
  const catalogType = useMemo(
    () => types?.find((t) => t.code === typeCode),
    [types, typeCode],
  );

  // Encontrar estadísticas del catálogo
  const catalogStats = useMemo(
    () => statistics?.find((s) => s.typeCode === typeCode),
    [statistics, typeCode],
  );

  // Determinar si realmente es un catálogo grande (por estadísticas o conocido)
  const isLargeCatalog = useMemo(() => {
    if (isKnownLargeCatalog) return true;
    const itemCount = catalogStats?.itemCount ?? allItems?.length ?? 0;
    return itemCount > LARGE_CATALOG_THRESHOLD;
  }, [isKnownLargeCatalog, catalogStats?.itemCount, allItems?.length]);

  // Items a mostrar (depende de si es grande o pequeño)
  const displayItems: CatalogItem[] = useMemo(() => {
    if (isLargeCatalog) {
      return searchResult?.items ?? [];
    }
    return allItems ?? [];
  }, [isLargeCatalog, searchResult?.items, allItems]);

  // Total de items (para paginación)
  const totalItems = useMemo(() => {
    if (isLargeCatalog) {
      return searchResult?.total ?? 0;
    }
    return allItems?.length ?? 0;
  }, [isLargeCatalog, searchResult?.total, allItems?.length]);

  const totalPages = Math.ceil(totalItems / DEFAULT_PAGE_SIZE);

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
                <Badge
                  variant="outline"
                  className="text-amber-600 border-amber-300"
                >
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
            label="Registros"
            value={catalogStats?.itemCount ?? totalItems}
            icon={FileText}
            isLoading={isLoading}
          />
          <StatCard label="Fuente" value={sourceLabel} icon={Database} />
          <StatCard
            label="Tipo"
            value={showParentColumn ? "Jerárquico" : "Plano"}
            icon={Layers}
          />
          <StatCard
            label="Versión"
            value={catalogStats?.currentVersion ?? "—"}
            icon={FileText}
            isMono
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
          description={`${totalItems.toLocaleString("es-MX")} registros en este catálogo`}
        >
          <div className="space-y-4">
            {/* Search input */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={
                    isLargeCatalog
                      ? "Buscar en el servidor..."
                      : "Buscar por código o nombre..."
                  }
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
              {isFetchingSearch && isLargeCatalog && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <p className="text-sm text-muted-foreground">
                {isLargeCatalog
                  ? `Mostrando ${displayItems.length} de ${totalItems.toLocaleString("es-MX")}`
                  : `${displayItems.length} registros`}
              </p>
            </div>

            {/* Table */}
            {isLargeCatalog ? (
              <LargeCatalogTable
                items={displayItems}
                isLoading={isLoadingSearch}
                showParentCode={showParentColumn}
              />
            ) : (
              <CatalogItemsTable
                items={displayItems}
                isLoading={isLoadingAllItems}
                showParentCode={showParentColumn}
              />
            )}

            {/* Server-side pagination (only for large catalogs) */}
            {isLargeCatalog && totalPages > 1 && (
              <ServerPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={DEFAULT_PAGE_SIZE}
                onPageChange={handlePageChange}
                isLoading={isFetchingSearch}
              />
            )}
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
// LARGE CATALOG TABLE (simplified, no client-side filtering)
// ============================================================================

interface LargeCatalogTableProps {
  items: CatalogItem[];
  isLoading: boolean;
  showParentCode: boolean;
}

const LargeCatalogTable = memo(function LargeCatalogTable({
  items,
  isLoading,
  showParentCode,
}: LargeCatalogTableProps) {
  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 text-sm font-medium">Código</th>
              <th className="text-left p-3 text-sm font-medium">Nombre</th>
              {showParentCode && (
                <th className="text-left p-3 text-sm font-medium">Padre</th>
              )}
              <th className="text-center p-3 text-sm font-medium w-24">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }).map((_, i) => (
              <tr key={i} className="border-t">
                <td className="p-3">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="p-3">
                  <Skeleton className="h-4 w-48" />
                </td>
                {showParentCode && (
                  <td className="p-3">
                    <Skeleton className="h-4 w-16" />
                  </td>
                )}
                <td className="p-3 text-center">
                  <Skeleton className="h-5 w-16 mx-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        No se encontraron registros
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3 text-sm font-medium">Código</th>
            <th className="text-left p-3 text-sm font-medium">Nombre</th>
            {showParentCode && (
              <th className="text-left p-3 text-sm font-medium">Padre</th>
            )}
            <th className="text-center p-3 text-sm font-medium w-24">Estado</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="border-t hover:bg-muted/30 transition-colors"
            >
              <td className="p-3 font-mono text-sm">{item.code}</td>
              <td className="p-3">{item.name}</td>
              {showParentCode && (
                <td className="p-3 font-mono text-sm text-muted-foreground">
                  {item.parentCode || "—"}
                </td>
              )}
              <td className="p-3 text-center">
                {item.isActive ? (
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-200 bg-green-50"
                  >
                    Activo
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-red-600 border-red-200 bg-red-50"
                  >
                    Inactivo
                  </Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

// ============================================================================
// SERVER PAGINATION
// ============================================================================

interface ServerPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

const ServerPagination = memo(function ServerPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  isLoading,
}: ServerPaginationProps) {
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Mostrando {startIndex.toLocaleString("es-MX")} a{" "}
        {endIndex.toLocaleString("es-MX")} de{" "}
        {totalItems.toLocaleString("es-MX")}
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || isLoading}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="px-3 text-sm">
          Página {currentPage} de {totalPages.toLocaleString("es-MX")}
        </span>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || isLoading}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

// ============================================================================
// STAT CARD
// ============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  isLoading?: boolean;
  isMono?: boolean;
}

const StatCard = memo(function StatCard({
  label,
  value,
  icon: Icon,
  isLoading,
  isMono,
}: StatCardProps) {
  const formattedValue =
    typeof value === "number" ? value.toLocaleString("es-MX") : value;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          {isLoading ? (
            <Skeleton className="h-5 w-16 mt-1" />
          ) : (
            <p
              className={`font-medium truncate ${isMono ? "font-mono text-sm" : ""}`}
            >
              {formattedValue}
            </p>
          )}
        </div>
      </div>
    </div>
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
