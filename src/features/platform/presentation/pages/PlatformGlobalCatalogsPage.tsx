import { memo, useCallback, useMemo, useState } from "react";
import { Database, FileUp, Shield, Upload } from "lucide-react";
import { PlatformPageShell } from "../layout/PlatformPageShell";
import { StatCard } from "@shared/ui/data-display";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { AlertWithIcon } from "@shared/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { EmptyState } from "@shared/ui/feedback-states";
import { ListingSearchInput } from "@shared/ui/listing";
import { Skeleton } from "@shared/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { useCatalogTypes } from "@features/catalogs/application/hooks";
import { CatalogImportWizard } from "@features/catalogs/presentation/components/CatalogImportWizard";
import {
  CATALOG_SOURCE_LABELS,
  CATALOG_TYPE_LABELS,
  isSatCatalog,
} from "@features/catalogs/domain";
import { isPlatformOwner } from "../../domain/entities";
import { usePlatformAuth } from "../providers/PlatformAuthProvider";
import { platformCopy } from "../copy/platformCopy";

function getCatalogDisplayName(type: {
  code: string;
  name: string;
}): string {
  return type.name || CATALOG_TYPE_LABELS[type.code] || type.code;
}

export const PlatformGlobalCatalogsPage = memo(function PlatformGlobalCatalogsPage() {
  const copy = platformCopy.catalogs;
  const { user } = usePlatformAuth();
  const canImport = isPlatformOwner(user?.platformRole);
  const { data: types, isLoading, isError } = useCatalogTypes();
  const [search, setSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const allSatTypes = useMemo(
    () => (types ?? []).filter((type) => isSatCatalog(type.code)),
    [types],
  );

  const satTypes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return allSatTypes;

    return allSatTypes.filter((type) => {
      const label = getCatalogDisplayName(type).toLowerCase();
      return label.includes(query) || type.code.toLowerCase().includes(query);
    });
  }, [allSatTypes, search]);

  const handleImportOpenChange = useCallback((open: boolean) => {
    setImportOpen(open);
    if (!open) {
      setSelectedType(null);
    }
  }, []);

  const handleImportClick = useCallback((typeCode: string) => {
    setSelectedType(typeCode);
    setImportOpen(true);
  }, []);

  return (
    <>
      <PlatformPageShell title={copy.title} description={copy.description}>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{copy.hero.badge}</Badge>
              <Badge variant="outline">{copy.hero.secondaryBadge}</Badge>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">
                {copy.hero.title}
              </h2>
              <p className="max-w-3xl text-sm text-muted-foreground">
                {copy.hero.description}
              </p>
            </div>
            <ol className="grid gap-3 sm:grid-cols-3">
              {copy.hero.steps.map((step, index) => (
                <li
                  key={step.title}
                  className="rounded-lg border bg-background/80 p-3"
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    {copy.hero.stepPrefix(index + 1)}
                  </p>
                  <p className="mt-1 text-sm font-medium">{step.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {isError ? (
          <AlertWithIcon variant="destructive" title={copy.error.title}>
            {copy.error.description}
          </AlertWithIcon>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-xl" />
            ))
          ) : (
            <>
              <StatCard
                title={copy.metrics.satCatalogs}
                value={allSatTypes.length}
                description={copy.metrics.satCatalogsHint}
                icon={<Database className="h-5 w-5" />}
              />
              <StatCard
                title={copy.metrics.visibleResults}
                value={satTypes.length}
                description={copy.metrics.visibleResultsHint}
                icon={<FileUp className="h-5 w-5" />}
                tone="info"
              />
              <StatCard
                title={copy.metrics.importAccess}
                value={
                  canImport
                    ? copy.metrics.importEnabled
                    : copy.metrics.importDisabled
                }
                description={
                  canImport
                    ? copy.metrics.importEnabledHint
                    : copy.metrics.importDisabledHint
                }
                icon={<Shield className="h-5 w-5" />}
                tone={canImport ? "success" : "neutral"}
              />
            </>
          )}
        </div>

        {!canImport ? (
          <AlertWithIcon variant="info" title={copy.readOnlyTitle}>
            {copy.readOnlyHint}
          </AlertWithIcon>
        ) : null}

        <Card>
          <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <CardTitle className="text-base">{copy.table.title}</CardTitle>
              <CardDescription>{copy.table.description}</CardDescription>
            </div>
            <ListingSearchInput
              value={search}
              onChange={setSearch}
              placeholder={copy.search.placeholder}
              className="w-full sm:w-72"
            />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : satTypes.length === 0 ? (
              <EmptyState
                icon={<Database className="h-10 w-10" />}
                title={
                  search.trim() ? copy.empty.searchTitle : copy.empty.title
                }
                description={
                  search.trim()
                    ? copy.empty.searchDescription
                    : copy.empty.description
                }
                size="sm"
              />
            ) : (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{copy.table.columns.catalog}</TableHead>
                        <TableHead>{copy.table.columns.source}</TableHead>
                        <TableHead className="text-right">
                          {copy.table.columns.action}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {satTypes.map((type) => (
                        <TableRow key={type.code}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {getCatalogDisplayName(type)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {type.code}
                              </p>
                              {type.description ? (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {type.description}
                                </p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {CATALOG_SOURCE_LABELS[type.source ?? "sat"] ??
                                type.source}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {canImport ? (
                              <Button
                                size="sm"
                                onClick={() => handleImportClick(type.code)}
                              >
                                <Upload className="mr-2 h-4 w-4" />
                                {copy.import}
                              </Button>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <ul className="space-y-3 md:hidden">
                  {satTypes.map((type) => (
                    <li
                      key={type.code}
                      className="rounded-lg border p-4"
                    >
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium">{getCatalogDisplayName(type)}</p>
                          <p className="text-xs text-muted-foreground">{type.code}</p>
                        </div>
                        <Badge variant="secondary">
                          {CATALOG_SOURCE_LABELS[type.source ?? "sat"] ?? type.source}
                        </Badge>
                        {canImport ? (
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => handleImportClick(type.code)}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            {copy.import}
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </PlatformPageShell>

      {selectedType ? (
        <CatalogImportWizard
          typeCode={selectedType}
          open={importOpen}
          onOpenChange={handleImportOpenChange}
          authScope="platform"
        />
      ) : null}
    </>
  );
});
