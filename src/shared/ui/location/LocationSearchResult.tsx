import { MapPin, Plus, Warehouse } from "lucide-react";

import { cn } from "@shared/lib/utils/cn";
import { Badge } from "@shared/ui/badge";

import { LOCATION_FIELD_COPY } from "./locationFieldCopy";
import type { LocationSearchResult } from "./LocationField.types";

export interface LocationSearchResultRowProps {
  result: LocationSearchResult;
  selected?: boolean;
  className?: string;
}

function SourceIcon({ source }: { source: LocationSearchResult["source"] }) {
  if (source === "create") return <Plus className="size-4 shrink-0" />;
  if (source === "mapbox") return <MapPin className="size-4 shrink-0" />;
  return <Warehouse className="size-4 shrink-0" />;
}

function sourceBadgeLabel(source: LocationSearchResult["source"]): string {
  if (source === "create") return LOCATION_FIELD_COPY.sourceCreate;
  if (source === "mapbox") return LOCATION_FIELD_COPY.sourceMapbox;
  return LOCATION_FIELD_COPY.sourceInternal;
}

export function LocationSearchResultRow({
  result,
  selected = false,
  className,
}: LocationSearchResultRowProps) {
  return (
    <div
      className={cn(
        "flex w-full items-start gap-2 text-left",
        selected && "opacity-100",
        className,
      )}
    >
      <SourceIcon source={result.source} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{result.label}</span>
          <Badge variant="neutral" tone="soft" className="shrink-0">
            {sourceBadgeLabel(result.source)}
          </Badge>
        </div>
        {result.description ? (
          <p className="truncate text-xs text-muted-foreground">
            {result.description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
