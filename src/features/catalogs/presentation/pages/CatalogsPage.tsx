/**
 * CatalogsPage (Settings Integration)
 *
 * Lista de catálogos tenant: regulatorios e internos en solo lectura.
 */

import { memo, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Database, ChevronRight, Building2, FileText } from "lucide-react";

import { ListingSearchInput } from "@shared/ui/listing";
import { StatCard } from "@shared/ui/data-display";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { Skeleton } from "@shared/ui/skeleton";

import { SettingsLayout } from "@features/settings/presentation/components/SettingsLayout";
import { useCatalogTypes, useCatalogStatistics } from "../../application/hooks";
import { CatalogGlobalReadOnlyBanner } from "../components/CatalogGlobalReadOnlyBanner";
import { catalogsCopy } from "../copy/catalogsCopy";
import {
  isGlobalCatalog,
  isInternalCatalogType,
  isCatalogItemMutable,
  CATALOG_SOURCE_LABELS,
  type CatalogType,
  type CatalogStatistics,
} from "../../domain";

type TabValue = "internal" | "global" | "all";

interface CatalogTypeWithStats extends CatalogType {
  itemCount: number;
  currentVersion: string | null;
}

export const CatalogsPage = memo(function CatalogsPage() {
  const { data: types, isLoading: isLoadingTypes } = useCatalogTypes();
  const { data: statistics, isLoading: isLoadingStats } =
    useCatalogStatistics();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabValue>("internal");

  const isLoading = isLoadingTypes || isLoadingStats;
  const copy = catalogsCopy;

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

  const filteredCatalogs = useMemo(() => {
    let filtered = catalogsWithStats;

    if (activeTab === "global") {
      filtered = filtered.filter((t) => isGlobalCatalog(t));
    } else if (activeTab === "internal") {
      filtered = filtered.filter((t) => isInternalCatalogType(t));
    }

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

  const globalCount = catalogsWithStats.filter((t) =>
    isGlobalCatalog(t),
  ).length;
  const internalCount = catalogsWithStats.filter((t) =>
    isInternalCatalogType(t),
  ).length;
  const totalItems =
    statistics?.reduce((sum, s) => sum + s.itemCount, 0) ?? 0;

  const showGlobalBanner = activeTab === "global" || activeTab === "all";
  const showInternalBanner = activeTab === "internal";

  return (
    <SettingsLayout sectionTitle={copy.page.sectionTitle}>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={copy.metrics.totalCatalogs}
            value={catalogsWithStats.length}
            icon={<Database className="h-5 w-5 text-primary" />}
            isLoading={isLoading}
          />
          <StatCard
            title={copy.metrics.totalRecords}
            value={totalItems}
            icon={<FileText className="h-5 w-5 text-primary" />}
            isLoading={isLoading}
          />
          <StatCard
            title={copy.metrics.regulatory}
            value={globalCount}
            icon={<Building2 className="h-5 w-5 text-primary" />}
            isLoading={isLoading}
          />
          <StatCard
            title={copy.metrics.internal}
            value={internalCount}
            icon={<Database className="h-5 w-5 text-primary" />}
            isLoading={isLoading}
          />
        </div>

        {showInternalBanner ? (
          <CatalogGlobalReadOnlyBanner variant="list" scope="internal" />
        ) : null}

        {showGlobalBanner ? (
          <CatalogGlobalReadOnlyBanner variant="list" scope="global" />
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row">
          <ListingSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={copy.page.searchPlaceholder}
            className="w-full sm:flex-1"
          />
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabValue)}
          >
            <TabsList>
              <TabsTrigger value="internal">
                {copy.tabs.internal} ({internalCount})
              </TabsTrigger>
              <TabsTrigger value="global">
                {copy.tabs.global} ({globalCount})
              </TabsTrigger>
              <TabsTrigger value="all">
                {copy.tabs.all} ({catalogsWithStats.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <CatalogListSkeleton />
        ) : filteredCatalogs.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            {searchQuery ? copy.page.emptySearch : copy.page.emptyAll}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCatalogs.map((catalog) => (
              <CatalogCard key={catalog.code} catalog={catalog} />
            ))}
          </div>
        )}
      </div>
    </SettingsLayout>
  );
});

interface CatalogCardProps {
  catalog: CatalogTypeWithStats;
}

const CatalogCard = memo(function CatalogCard({ catalog }: CatalogCardProps) {
  const copy = catalogsCopy;
  const isGlobal = isGlobalCatalog(catalog);
  const isReadOnly = !isCatalogItemMutable(catalog);
  const sourceLabel = catalog.source
    ? (CATALOG_SOURCE_LABELS[catalog.source] ?? catalog.source)
    : copy.badges.internal;

  return (
    <div className="rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium">{catalog.name}</h3>
          <p className="font-mono text-xs text-muted-foreground">
            {catalog.code}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge variant={isGlobal ? "default" : "secondary"}>
            {isGlobal ? copy.badges.regulatory : copy.badges.internal}
          </Badge>
          {isReadOnly ? (
            <Badge variant="outline" className="text-xs">
              {copy.badges.readOnly}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {copy.card.records(formatNumber(catalog.itemCount))}
        </span>
        {catalog.currentVersion ? (
          <span className="font-mono text-xs">v{catalog.currentVersion}</span>
        ) : null}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link to={`/settings/catalogs/${catalog.code}`}>
            {copy.card.view}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {!isGlobal ? (
        <p className="mt-2 text-xs text-muted-foreground">{sourceLabel}</p>
      ) : null}
    </div>
  );
});

function CatalogListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4">
          <div className="mb-3 flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-12" />
          </div>
          <Skeleton className="mb-4 h-3 w-20" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  );
}

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
