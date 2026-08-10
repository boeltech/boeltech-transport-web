import { memo, useCallback, useMemo, useState } from "react";
import { Database, Upload } from "lucide-react";
import { PlatformPageShell } from "../layout/PlatformPageShell";
import { Button } from "@shared/ui/button";
import { AlertWithIcon } from "@shared/ui/alert";
import { Card, CardContent } from "@shared/ui/card";
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
import {
  useCatalogTypes,
  useCatalogStatistics,
  CatalogImportWizard,
  CATALOG_TYPE_LABELS,
  isSatCatalog,
  type CatalogType,
} from "@features/catalogs";
import { isPlatformOwner } from "../../domain/entities";
import { usePlatformAuth } from "../providers/PlatformAuthProvider";
import { platformCopy } from "../copy/platformCopy";
import {
  groupPlatformSatTypes,
  type PlatformSatGroupId,
} from "../utils/platformSatCatalogGroups";

function getCatalogDisplayName(type: {
  code: string;
  name: string;
}): string {
  return type.name || CATALOG_TYPE_LABELS[type.code] || type.code;
}

type CatalogRowMeta = {
  version: string | null;
  itemCount: number | null;
};

function CatalogRows({
  types,
  canImport,
  metaByCode,
  onImport,
  copy,
}: {
  types: CatalogType[];
  canImport: boolean;
  metaByCode: Map<string, CatalogRowMeta>;
  onImport: (typeCode: string) => void;
  copy: typeof platformCopy.catalogs;
}) {
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{copy.table.columns.catalog}</TableHead>
              <TableHead>{copy.table.columns.version}</TableHead>
              <TableHead className="text-right">
                {copy.table.columns.items}
              </TableHead>
              <TableHead className="text-right">
                {copy.table.columns.action}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {types.map((type) => {
              const meta = metaByCode.get(type.code);
              return (
                <TableRow key={type.code}>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-medium">
                        {getCatalogDisplayName(type)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {type.code}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {meta?.version ?? copy.table.versionEmpty}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {meta?.itemCount != null
                      ? meta.itemCount.toLocaleString("es-MX")
                      : copy.table.itemsEmpty}
                  </TableCell>
                  <TableCell className="text-right">
                    {canImport ? (
                      <Button
                        size="sm"
                        onClick={() => onImport(type.code)}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {copy.import}
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ul className="space-y-3 md:hidden">
        {types.map((type) => {
          const meta = metaByCode.get(type.code);
          return (
            <li key={type.code} className="rounded-lg border p-4">
              <div className="space-y-3">
                <div>
                  <p className="font-medium">{getCatalogDisplayName(type)}</p>
                  <p className="text-xs text-muted-foreground">{type.code}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {copy.table.columns.version}:{" "}
                    {meta?.version ?? copy.table.versionEmpty}
                    {" · "}
                    {copy.table.columns.items}:{" "}
                    {meta?.itemCount != null
                      ? meta.itemCount.toLocaleString("es-MX")
                      : copy.table.itemsEmpty}
                  </p>
                </div>
                {canImport ? (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => onImport(type.code)}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {copy.import}
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export const PlatformGlobalCatalogsPage = memo(
  function PlatformGlobalCatalogsPage() {
    const copy = platformCopy.catalogs;
    const { user } = usePlatformAuth();
    const canImport = isPlatformOwner(user?.platformRole);
    const { data: types, isLoading, isError } = useCatalogTypes({
      authScope: "platform",
    });
    const { data: statistics } = useCatalogStatistics({
      authScope: "platform",
    });
    const [search, setSearch] = useState("");
    const [importOpen, setImportOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<string | null>(null);

    const metaByCode = useMemo(() => {
      const map = new Map<string, CatalogRowMeta>();
      for (const stat of statistics ?? []) {
        map.set(stat.typeCode, {
          version: stat.currentVersion,
          itemCount: stat.itemCount,
        });
      }
      return map;
    }, [statistics]);

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

    const groups = useMemo(() => groupPlatformSatTypes(satTypes), [satTypes]);

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
          {isError ? (
            <AlertWithIcon variant="destructive" title={copy.error.title}>
              {copy.error.description}
            </AlertWithIcon>
          ) : null}

          {!canImport ? (
            <AlertWithIcon variant="info" title={copy.readOnlyTitle}>
              {copy.readOnlyHint}
            </AlertWithIcon>
          ) : null}

          <Card>
            <CardContent className="space-y-6 p-6">
              <ListingSearchInput
                value={search}
                onChange={setSearch}
                placeholder={copy.search.placeholder}
                className="w-full sm:w-72"
              />

              {isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : groups.length === 0 ? (
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
                groups.map(({ groupId, types: groupTypes }) => {
                  const groupCopy = copy.groups[groupId as PlatformSatGroupId];
                  return (
                    <section key={groupId} className="space-y-3">
                      <div>
                        <h2 className="text-base font-semibold tracking-tight">
                          {groupCopy.title}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {groupCopy.description}
                        </p>
                      </div>
                      <CatalogRows
                        types={groupTypes}
                        canImport={canImport}
                        metaByCode={metaByCode}
                        onImport={handleImportClick}
                        copy={copy}
                      />
                    </section>
                  );
                })
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
  },
);
