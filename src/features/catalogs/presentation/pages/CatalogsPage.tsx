/**
 * CatalogsPage (Settings Integration)
 *
 * Directorio de valores de referencia: catálogos agrupados por tema, en solo
 * lectura. La búsqueda enruta al catálogo correcto por nombre o por ejemplos
 * de su contenido.
 */

import { memo, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Database } from "lucide-react";

import { ListingSearchInput } from "@shared/ui/listing";
import { EmptyState } from "@shared/ui/feedback-states";
import { Skeleton } from "@shared/ui/skeleton";

import { SettingsLayout } from "@features/settings/presentation/components/SettingsLayout";
import { useCatalogTypes, useCatalogStatistics } from "../../application/hooks";
import { CatalogGlobalReadOnlyBanner } from "../components/CatalogGlobalReadOnlyBanner";
import { catalogsCopy } from "../copy/catalogsCopy";
import {
  CATALOG_THEMES,
  catalogThemeCopy,
  getCatalogExamples,
  getCatalogTheme,
  type CatalogTheme,
} from "../copy/catalogDirectory";
import { resolveCatalogPublisher } from "../utils/catalogLabels";
import type { CatalogStatistics, CatalogType } from "../../domain";

const copy = catalogsCopy;

interface CatalogTypeWithStats extends CatalogType {
  itemCount: number;
}

interface CatalogThemeGroup {
  theme: CatalogTheme;
  catalogs: CatalogTypeWithStats[];
}

export const CatalogsPage = memo(function CatalogsPage() {
  const { data: types, isLoading: isLoadingTypes } = useCatalogTypes();
  const { data: statistics, isLoading: isLoadingStats } =
    useCatalogStatistics();

  const [searchQuery, setSearchQuery] = useState("");

  const isLoading = isLoadingTypes || isLoadingStats;

  const catalogsWithStats = useMemo<CatalogTypeWithStats[]>(() => {
    if (!types) return [];

    const statsMap = new Map<string, CatalogStatistics>();
    statistics?.forEach((stat) => {
      statsMap.set(stat.typeCode, stat);
    });

    return types.map((type) => ({
      ...type,
      itemCount: statsMap.get(type.code)?.itemCount ?? 0,
    }));
  }, [types, statistics]);

  const filteredCatalogs = useMemo(() => {
    const term = normalizeForSearch(searchQuery);
    if (!term) return catalogsWithStats;

    return catalogsWithStats.filter((catalog) =>
      buildSearchHaystack(catalog).includes(term),
    );
  }, [catalogsWithStats, searchQuery]);

  const groups = useMemo<CatalogThemeGroup[]>(() => {
    const buckets = new Map<CatalogTheme, CatalogTypeWithStats[]>();

    for (const catalog of filteredCatalogs) {
      const theme = getCatalogTheme(catalog.code);
      const bucket = buckets.get(theme);
      if (bucket) bucket.push(catalog);
      else buckets.set(theme, [catalog]);
    }

    return CATALOG_THEMES.map((theme) => ({
      theme,
      catalogs: (buckets.get(theme) ?? []).sort((a, b) =>
        a.name.localeCompare(b.name, "es"),
      ),
    })).filter((group) => group.catalogs.length > 0);
  }, [filteredCatalogs]);

  return (
    <SettingsLayout
      sectionTitle={copy.page.sectionTitle}
      title={copy.page.title}
      description={copy.page.description}
    >
      <div className="space-y-6">
        <ListingSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={copy.page.searchPlaceholder}
          className="w-full sm:max-w-md"
        />

        <CatalogGlobalReadOnlyBanner variant="list" />

        {isLoading ? (
          <CatalogListSkeleton />
        ) : groups.length === 0 ? (
          <EmptyState
            icon={<Database />}
            title={
              searchQuery ? copy.page.emptySearchTitle : copy.page.emptyAllTitle
            }
            description={
              searchQuery
                ? copy.page.emptySearchDescription(searchQuery.trim())
                : copy.page.emptyAllDescription
            }
          />
        ) : (
          groups.map((group) => (
            <section key={group.theme} className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold">
                  {catalogThemeCopy[group.theme].title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {catalogThemeCopy[group.theme].description}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.catalogs.map((catalog) => (
                  <CatalogCard key={catalog.code} catalog={catalog} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </SettingsLayout>
  );
});

// ============================================================================
// CARD
// ============================================================================

interface CatalogCardProps {
  catalog: CatalogTypeWithStats;
}

const CatalogCard = memo(function CatalogCard({ catalog }: CatalogCardProps) {
  const examples = getCatalogExamples(catalog.code);

  return (
    <Link
      to={`/settings/catalogs/${catalog.code}`}
      className="group flex flex-col rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium">{catalog.name}</h3>
        <ChevronRight
          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </div>

      {examples.length > 0 ? (
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {copy.card.examplesPrefix} {examples.join(", ")}
        </p>
      ) : null}

      <p className="mt-3 text-xs text-muted-foreground">
        {copy.valuesCount(catalog.itemCount)} · {resolveCatalogPublisher(catalog)}
      </p>
    </Link>
  );
});

// ============================================================================
// HELPERS
// ============================================================================

/** Minúsculas sin acentos, para que "codigo" encuentre "código". */
function normalizeForSearch(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Texto contra el que se busca: nombre del catálogo, ejemplos de su contenido
 * y el código técnico (no visible, pero útil al reportar una incidencia).
 */
function buildSearchHaystack(catalog: CatalogType): string {
  return normalizeForSearch(
    [catalog.name, catalog.code, ...getCatalogExamples(catalog.code)].join(" "),
  );
}

function CatalogListSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 2 }).map((_, section) => (
        <div key={section} className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, card) => (
              <div key={card} className="space-y-3 rounded-lg border p-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default CatalogsPage;
