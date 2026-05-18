/**
 * CatalogsPage (Settings Integration)
 *
 * Página principal de gestión de catálogos, integrada en Settings.
 * Usa el SettingsLayout para mantener la navegación consistente.
 *
 * Ubicación: src/features/catalogs/presentation/pages/CatalogsPage.tsx
 */

import { memo, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Database,
  Upload,
  ChevronRight,
  Building2,
  FileText,
} from "lucide-react";

import { ListingSearchInput } from "@shared/ui/listing";
import { StatCard } from "@shared/ui/data-display";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { Skeleton } from "@shared/ui/skeleton";

import { usePermissions } from "@shared/permissions";
import {
  SettingsLayout,
  // SettingsCard,
} from "@features/settings/presentation/components/SettingsLayout";
import { useCatalogTypes, useCatalogStatistics } from "../../application/hooks";
import { CatalogImportWizard } from "../components/CatalogImportWizard";
import {
  isSatCatalog,
  isInternalCatalog,
  CATALOG_SOURCE_LABELS,
  type CatalogType,
  type CatalogStatistics,
} from "../../domain";

// ============================================================================
// TYPES
// ============================================================================

type TabValue = "all" | "sat" | "internal";

/**
 * Tipo combinado para mostrar en la UI
 */
interface CatalogTypeWithStats extends CatalogType {
  itemCount: number;
  currentVersion: string | null;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CatalogsPage = memo(function CatalogsPage() {
  const { data: types, isLoading: isLoadingTypes } = useCatalogTypes();
  const { data: statistics, isLoading: isLoadingStats } =
    useCatalogStatistics();
  const { hasPermission } = usePermissions();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [importWizardOpen, setImportWizardOpen] = useState(false);
  const [selectedCatalogType, setSelectedCatalogType] = useState<string | null>(
    null,
  );

  const canImport = hasPermission("catalogs", "import");
  const isLoading = isLoadingTypes || isLoadingStats;

  // Combinar types con statistics
  const catalogsWithStats = useMemo<CatalogTypeWithStats[]>(() => {
    if (!types) return [];

    const statsMap = new Map<string, CatalogStatistics>();
    statistics?.forEach((stat) => {
      statsMap.set(stat.typeCode, stat);
    });

    return types.map((type) => {
      const stat = statsMap.get(type.code);
      return {
        ...type,
        itemCount: stat?.itemCount ?? 0,
        currentVersion: stat?.currentVersion ?? null,
      };
    });
  }, [types, statistics]);

  // Filter catalogs based on search and tab
  const filteredCatalogs = useMemo(() => {
    let filtered = catalogsWithStats;

    // Filter by tab
    if (activeTab === "sat") {
      filtered = filtered.filter((t) => isSatCatalog(t.code));
    } else if (activeTab === "internal") {
      filtered = filtered.filter((t) => isInternalCatalog(t.code));
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.code.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [catalogsWithStats, activeTab, searchQuery]);

  const handleImportClick = useCallback((typeCode: string) => {
    setSelectedCatalogType(typeCode);
    setImportWizardOpen(true);
  }, []);

  const handleImportOpenChange = useCallback((open: boolean) => {
    setImportWizardOpen(open);
    if (!open) {
      setSelectedCatalogType(null);
    }
  }, []);

  // Calculate counts
  const satCount = catalogsWithStats.filter((t) => isSatCatalog(t.code)).length;
  const internalCount = catalogsWithStats.filter((t) =>
    isInternalCatalog(t.code),
  ).length;

  // Calculate totals
  const totalItems = statistics?.reduce((sum, s) => sum + s.itemCount, 0) ?? 0;

  return (
    <SettingsLayout sectionTitle="Catálogos">
      <div className="space-y-6">
        {/* Statistics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total catálogos"
            value={catalogsWithStats.length}
            icon={<Database className="h-5 w-5 text-primary" />}
            isLoading={isLoading}
          />
          <StatCard
            title="Total registros"
            value={totalItems}
            icon={<FileText className="h-5 w-5 text-primary" />}
            isLoading={isLoading}
          />
          <StatCard
            title="Catálogos SAT"
            value={satCount}
            icon={<Building2 className="h-5 w-5 text-primary" />}
            isLoading={isLoading}
          />
          <StatCard
            title="Catálogos internos"
            value={internalCount}
            icon={<Database className="h-5 w-5 text-primary" />}
            isLoading={isLoading}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <ListingSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Buscar catálogo..."
            className="w-full sm:flex-1"
          />
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabValue)}
          >
            <TabsList>
              <TabsTrigger value="all">
                Todos ({catalogsWithStats.length})
              </TabsTrigger>
              <TabsTrigger value="sat">SAT ({satCount})</TabsTrigger>
              <TabsTrigger value="internal">
                Internos ({internalCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Catalog List */}
        {isLoading ? (
          <CatalogListSkeleton />
        ) : filteredCatalogs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchQuery
              ? "No se encontraron catálogos con ese criterio"
              : "No hay catálogos disponibles"}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCatalogs.map((catalog) => (
              <CatalogCard
                key={catalog.code}
                catalog={catalog}
                canImport={canImport && isSatCatalog(catalog.code)}
                onImportClick={handleImportClick}
              />
            ))}
          </div>
        )}

        {/* Import Wizard */}
        {selectedCatalogType && (
          <CatalogImportWizard
            typeCode={selectedCatalogType}
            open={importWizardOpen}
            onOpenChange={handleImportOpenChange}
          />
        )}
      </div>
    </SettingsLayout>
  );
});

// ============================================================================
// CATALOG CARD
// ============================================================================

interface CatalogCardProps {
  catalog: CatalogTypeWithStats;
  canImport: boolean;
  onImportClick: (typeCode: string) => void;
}

const CatalogCard = memo(function CatalogCard({
  catalog,
  canImport,
  onImportClick,
}: CatalogCardProps) {
  const isSat = isSatCatalog(catalog.code);
  const sourceLabel = catalog.source
    ? (CATALOG_SOURCE_LABELS[catalog.source] ?? catalog.source)
    : "Interno";

  return (
    <div className="rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className="font-medium text-sm truncate">{catalog.name}</h3>
          <p className="text-xs text-muted-foreground font-mono">
            {catalog.code}
          </p>
        </div>
        <Badge variant={isSat ? "default" : "secondary"} className="shrink-0">
          {sourceLabel}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
        <span>{formatNumber(catalog.itemCount)} registros</span>
        {catalog.currentVersion && (
          <span className="font-mono text-xs">v{catalog.currentVersion}</span>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link to={`/settings/catalogs/${catalog.code}`}>
            Ver
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
        {canImport && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onImportClick(catalog.code)}
          >
            <Upload className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
});

// ============================================================================
// SKELETON
// ============================================================================

function CatalogListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-12" />
          </div>
          <Skeleton className="h-3 w-20 mb-4" />
          <div className="flex gap-2">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toLocaleString("es-MX");
}

export default CatalogsPage;
