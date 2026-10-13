/**
 * PadronCanonicalSection
 *
 * Demo viva del padrón canónico (listado + detalle) elevado en F2/F3:
 * ListingFilterPanel, ActiveFilterChips, EmptyState, EntityListCard (menú touch),
 * DetailAlertCard + action, StatCard, tabs con indicador.
 *
 * Canónico en producto: /vehicles · /vehicles/:id
 */

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  MoreVertical,
  Pencil,
  Route,
  Truck,
} from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { DetailAlertCard, DetailSection, StatCard } from "@shared/ui/data-display";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import { EmptyState } from "@shared/ui/feedback-states";
import { Label } from "@shared/ui/label";
import {
  ActiveFilterChips,
  EntityListCard,
  ListingFilterPanel,
  entityListCardMenuTriggerClassName,
  type ActiveFilterChip,
} from "@shared/ui/listing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";

type DemoStatus = "all" | "available" | "maintenance";
type DemoType = "all" | "tractor" | "trailer";

const DEMO_UNITS = [
  { id: "1", plate: "ABC-123-A", type: "tractor" as const, status: "available" as const },
  { id: "2", plate: "XYZ-987-B", type: "trailer" as const, status: "maintenance" as const },
] as const;

export function PadronCanonicalSection() {
  const [status, setStatus] = useState<DemoStatus>("all");
  const [type, setType] = useState<DemoType>("all");
  const [showEmpty, setShowEmpty] = useState(false);
  const [detailTab, setDetailTab] = useState("unit");

  const activeCount = (status !== "all" ? 1 : 0) + (type !== "all" ? 1 : 0);

  const chips = useMemo<ActiveFilterChip[]>(() => {
    const next: ActiveFilterChip[] = [];
    if (status !== "all") {
      next.push({
        id: "status",
        label: status === "available" ? "Estado: Disponible" : "Estado: Taller",
        onRemove: () => setStatus("all"),
      });
    }
    if (type !== "all") {
      next.push({
        id: "type",
        label: type === "tractor" ? "Tipo: Tractocamión" : "Tipo: Remolque",
        onRemove: () => setType("all"),
      });
    }
    return next;
  }, [status, type]);

  const filtered = showEmpty
    ? []
    : DEMO_UNITS.filter((unit) => {
        if (status !== "all" && unit.status !== status) return false;
        if (type !== "all" && unit.type !== type) return false;
        return true;
      });

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Padrón canónico — listado + detalle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Referencia viva de los primitivos F2 usados en{" "}
            <code className="font-mono text-xs">/vehicles</code>. Mutaciones de
            estado operativo solo en detalle (D1′).
          </p>
          <p>
            Importar desde{" "}
            <code className="font-mono text-xs">@shared/ui/listing</code> y{" "}
            <code className="font-mono text-xs">@shared/ui/data-display</code>.
          </p>
        </CardContent>
      </Card>

      {/* ── Listado ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Listado</CardTitle>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowEmpty((v) => !v)}
            >
              {showEmpty ? "Mostrar resultados" : "Simular empty"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <ListingFilterPanel
              triggerLabel="Filtros"
              activeCount={activeCount}
              contentClassName="sm:grid-cols-2"
            >
              <div className="space-y-1.5">
                <Label htmlFor="ds-padron-status">Estado</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as DemoStatus)}
                >
                  <SelectTrigger id="ds-padron-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="maintenance">Taller</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ds-padron-type">Tipo</Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType(v as DemoType)}
                >
                  <SelectTrigger id="ds-padron-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="tractor">Tractocamión</SelectItem>
                    <SelectItem value="trailer">Remolque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </ListingFilterPanel>
          </div>

          <ActiveFilterChips chips={chips} />

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Truck className="h-10 w-10" />}
              title="Sin unidades con estos filtros"
              description="Prueba quitar un recorte o pulsa «Mostrar resultados»."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.map((unit) => (
                <EntityListCard key={unit.id} onClick={() => undefined}>
                  <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-semibold font-mono">
                        {unit.plate}
                      </p>
                      <Badge variant="neutral" tone="soft">
                        {unit.type === "tractor" ? "Tractocamión" : "Remolque"}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={entityListCardMenuTriggerClassName}
                          aria-label={`Acciones de ${unit.plate}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">
                      {unit.status === "available" ? "Disponible" : "En taller"}
                    </p>
                  </CardContent>
                  <CardFooter className="text-xs text-muted-foreground">
                    Menú ⋯ usable sin hover (touch)
                  </CardFooter>
                </EntityListCard>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Detalle ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Detalle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <DetailAlertCard
            severity="warning"
            icon={<AlertTriangle className="h-5 w-5" />}
            title="Documentos próximos a vencer"
            items={[
              { label: "Seguro", text: "Vence en 12 días" },
              { label: "Permiso SCT", text: "Vence en 28 días" },
            ]}
            action={
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setDetailTab("documents")}
              >
                Ver documentos
              </Button>
            }
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard title="Odómetro" value="128,450 km" icon={<Truck />} />
            <StatCard
              title="Viajes (mes)"
              value="14"
              tone="info"
              icon={<Route />}
            />
            <StatCard
              title="Disponibilidad"
              value="92%"
              tone="success"
              icon={<CheckCircle2 />}
            />
          </div>

          <Tabs value={detailTab} onValueChange={setDetailTab}>
            <TabsList>
              <TabsTrigger value="unit">Unidad</TabsTrigger>
              <TabsTrigger value="documents">
                <span className="inline-flex items-center">
                  Documentos
                  <AlertTriangle className="ml-1.5 h-3.5 w-3.5 text-warning" />
                </span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="unit" className="space-y-6 pt-2">
              <DetailSection
                icon={<Truck className="h-4 w-4" />}
                title="Datos de la unidad"
                description="Una superficie por sección — no Card dentro de Card"
              >
                <Card>
                  <CardContent className="space-y-2 pt-6 text-sm">
                    <p>
                      <span className="text-muted-foreground">Placas: </span>
                      <span className="font-mono">ABC-123-A</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">VIN: </span>
                      <span className="font-mono">1HGBH41JXMN109186</span>
                    </p>
                  </CardContent>
                </Card>
              </DetailSection>
            </TabsContent>
            <TabsContent value="documents" className="pt-2">
              <p className="text-sm text-muted-foreground">
                Tab con indicador de atención (ícono warning). El CTA del banner
                lleva aquí en ≤1 clic.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
