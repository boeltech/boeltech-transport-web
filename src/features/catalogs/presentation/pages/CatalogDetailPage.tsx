/**
 * CatalogDetailPage (Settings Integration)
 *
 * Página de detalle de un catálogo específico.
 * Usa el SettingsLayout para navegación consistente.
 *
 * Ubicación: src/features/catalogs/presentation/pages/CatalogDetailPage.tsx
 */

import { memo, useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  Database,
  FileText,
  AlertTriangle,
  Layers,
} from "lucide-react";

import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Skeleton } from "@shared/ui/skeleton";

import { usePermissions } from "@shared/permissions";
import {
  SettingsLayout,
  SettingsCard,
} from "@features/settings/presentation/components/SettingsLayout";
import {
  useCatalogTypes,
  useCatalogItems,
  useCatalogStatistics,
} from "../../application/hooks";
import { CatalogItemsTable } from "../components/CatalogItemsTable";
import { CatalogImportWizard } from "../components/CatalogImportWizard";
import {
  isSatCatalog,
  isHierarchicalCatalog,
  CATALOG_SOURCE_LABELS,
} from "../../domain";

// ============================================================================
// CONSTANTS
// ============================================================================

const LARGE_CATALOG_THRESHOLD = 5000;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CatalogDetailPage = memo(function CatalogDetailPage() {
  const { typeCode } = useParams<{ typeCode: string }>();
  const { hasPermission } = usePermissions();

  const { data: types, isLoading: isLoadingTypes } = useCatalogTypes();
  const { data: statistics } = useCatalogStatistics();
  const { data: items, isLoading: isLoadingItems } = useCatalogItems(
    typeCode ?? "",
    undefined,
    { enabled: !!typeCode },
  );

  const [importWizardOpen, setImportWizardOpen] = useState(false);

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

  const isSat = typeCode ? isSatCatalog(typeCode) : false;
  const canImport = hasPermission("catalogs", "import") && isSat;
  const isLargeCatalog = (items?.length ?? 0) > LARGE_CATALOG_THRESHOLD;
  const isHierarchical = typeCode ? isHierarchicalCatalog(typeCode) : false;

  // También detectar jerarquía por datos
  const hasParentCodes = useMemo(
    () => items?.some((item) => item.parentCode !== null) ?? false,
    [items],
  );

  const showParentColumn = isHierarchical || hasParentCodes;

  const handleImportOpenChange = useCallback((open: boolean) => {
    setImportWizardOpen(open);
  }, []);

  // Obtener label de fuente
  const sourceLabel = catalogType?.source
    ? (CATALOG_SOURCE_LABELS[catalogType.source] ?? catalogType.source)
    : "Interno";

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
            value={catalogStats?.itemCount ?? items?.length ?? 0}
            icon={FileText}
            isLoading={isLoadingItems}
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

        {/* Large catalog warning */}
        {isLargeCatalog && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Este catálogo tiene más de{" "}
              {LARGE_CATALOG_THRESHOLD.toLocaleString()} registros. Usa el
              buscador para filtrar los resultados.
            </AlertDescription>
          </Alert>
        )}

        {/* Items table */}
        <SettingsCard
          title="Registros"
          description={`${items?.length ?? 0} registros en este catálogo`}
        >
          <CatalogItemsTable
            items={items ?? []}
            isLoading={isLoadingItems}
            showParentCode={showParentColumn}
          />
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
