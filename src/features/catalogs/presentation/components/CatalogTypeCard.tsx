/**
 * CatalogTypeCard Component
 * Clean Architecture - Presentation Layer
 *
 * Tarjeta que muestra información de un tipo de catálogo con estadísticas.
 */

import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import {
  Database,
  Upload,
  Eye,
  ChevronRight,
  Clock,
  Package,
} from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import {
  type CatalogStatistics,
  CATALOG_SOURCE_LABELS,
  isSatCatalog,
  isSmallCatalog,
} from "../../domain";

// ============================================================================
// TYPES
// ============================================================================

export interface CatalogTypeCardProps {
  statistics: CatalogStatistics;
  onImport?: (typeCode: string) => void;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CatalogTypeCard({
  statistics,
  onImport,
  className,
}: CatalogTypeCardProps) {
  const isSat = isSatCatalog(statistics.typeCode);
  const isSmall = isSmallCatalog(statistics.typeCode);

  const sourceLabel =
    CATALOG_SOURCE_LABELS[statistics.source ?? "INTERNAL"] ?? statistics.source;

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString("es-MX");
  };

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "p-2 rounded-lg",
                isSat
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
              )}
            >
              <Database className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-medium">
                {statistics.typeName}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {statistics.typeCode}
              </p>
            </div>
          </div>
          <Badge variant={isSat ? "default" : "secondary"} className="text-xs">
            {sourceLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {formatNumber(statistics.itemCount)}
              </p>
              <p className="text-xs text-muted-foreground">Registros</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {statistics.currentVersion ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">Versión</p>
            </div>
          </div>
        </div>

        {/* Size indicator */}
        {!isSmall && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Catálogo grande — requiere búsqueda
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link to={`/configuracion/catalogos/${statistics.typeCode}`}>
              <Eye className="h-4 w-4 mr-1" />
              Ver
            </Link>
          </Button>

          {isSat && onImport && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onImport(statistics.typeCode)}
            >
              <Upload className="h-4 w-4 mr-1" />
              Importar
            </Button>
          )}

          <Button variant="ghost" size="icon" asChild>
            <Link to={`/configuracion/catalogos/${statistics.typeCode}`}>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default CatalogTypeCard;
