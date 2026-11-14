/**
 * TablesSection — EntityListTable (SoT §7 T1–T10)
 *
 * Demo viva: kinds, density list/compact, sort + aria-sort, skeleton, empty=null.
 */

import { useMemo, useState } from "react";
import { CalendarCheck, MoreHorizontal, Truck } from "lucide-react";

import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { StatusBadge } from "@shared/components/StatusBadge";
import {
  createStatusConfig,
  type StatusConfig,
} from "@shared/config/status/types";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListSortState,
  type EntityListStackedValue,
} from "@shared/ui/table";

type DemoStatus = "available" | "inTrip";

const STATUS_CONFIG: Record<DemoStatus, StatusConfig> = {
  available: createStatusConfig("info", {
    label: "Reservado",
    icon: CalendarCheck,
    description: "Unidad reservada",
    tone: "soft",
  }),
  inTrip: createStatusConfig("info", {
    label: "En viaje",
    icon: Truck,
    description: "Unidad en viaje",
    tone: "solid",
  }),
};

type DemoRow = {
  id: string;
  unit: string;
  unitType: string;
  brandModel: string;
  year: string;
  plate: string;
  branch: string | null;
  km: number | null;
  amount: number | null;
  updatedAt: string;
  status: DemoStatus;
};

const MOCK_ROWS: DemoRow[] = [
  {
    id: "v1",
    unit: "U-104",
    unitType: "Tractocamión",
    brandModel: "Kenworth T680",
    year: "2022",
    plate: "ABC-12-34",
    branch: "Monterrey",
    km: 184_320,
    amount: 12_450.75,
    updatedAt: "2026-11-14",
    status: "inTrip",
  },
  {
    id: "v2",
    unit: "U-218",
    unitType: "Caja seca",
    brandModel: "Freightliner Cascadia",
    year: "2021",
    plate: "XYZ-98-76",
    branch: null,
    km: null,
    amount: -320.5,
    updatedAt: "2026-10-02T18:00:00.000Z",
    status: "available",
  },
];

function DemoActions({ label }: { label: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={`Acciones de ${label}`}
      className="h-8 w-8"
      data-no-row-nav=""
    >
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  );
}

function buildColumns(): EntityListColumnDef<DemoRow>[] {
  return [
    {
      id: "name",
      header: "Unidad",
      kind: "primary",
      accessor: (r) => r.unit,
      sortable: true,
      sortField: "unit_number",
    },
    {
      id: "unitStacked",
      header: "Tipo",
      kind: "stacked",
      accessor: (r): EntityListStackedValue => ({
        primary: r.unitType,
        secondary: r.year,
      }),
    },
    {
      id: "brand",
      header: "Marca / modelo",
      kind: "text",
      accessor: (r) => r.brandModel,
    },
    {
      id: "plate",
      header: "Placa",
      kind: "code",
      accessor: (r) => r.plate,
    },
    {
      id: "branch",
      header: "Sucursal",
      kind: "meta",
      accessor: (r) => r.branch,
    },
    {
      id: "km",
      header: "Kilometraje (km)",
      kind: "number",
      accessor: (r) => r.km,
      sortable: true,
      sortField: "mileage",
    },
    {
      id: "amount",
      header: "Monto (MXN)",
      kind: "money",
      accessor: (r) => r.amount,
    },
    {
      id: "updated",
      header: "Actualizado",
      kind: "date",
      accessor: (r) => r.updatedAt,
    },
    {
      id: "status",
      header: "Estado",
      kind: "status",
      accessor: (r) => (
        <StatusBadge
          status={r.status}
          config={STATUS_CONFIG}
          size="sm"
          showIcon
        />
      ),
    },
    {
      id: "actions",
      header: "",
      kind: "actions",
      accessor: (r) => <DemoActions label={r.unit} />,
    },
  ];
}

export function TablesSection() {
  const columns = useMemo(() => buildColumns(), []);
  const [density, setDensity] = useState<"list" | "compact">("list");
  const [sort, setSort] = useState<EntityListSortState | null>({
    field: "unit_number",
    direction: "asc",
  });
  const [showLoading, setShowLoading] = useState(false);

  // Demo intentionally exceeds 7 data cols to showcase kinds; real lists stay ≤7 + actions.
  const demoColumns = columns;

  return (
    <div id="tables-entity-list" className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-base">
            EntityListTable
            <Badge variant="info" tone="soft">
              SoT §7 · T1–T10
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Listado Operate canónico: card{" "}
            <code className="font-mono text-xs">rounded-xl</code>, density
            siempre en <code className="font-mono text-xs">Table</code>, kinds,
            «—» en vacíos, primary ={" "}
            <code className="font-mono text-xs">Link</code>, sort con{" "}
            <code className="font-mono text-xs">aria-sort</code> (URL = caller).
          </p>
          <p>
            Empty → <code className="font-mono text-xs">null</code> (el shell
            monta empty). Loading → skeleton por columns.{" "}
            <code className="font-mono text-xs">footer</code> slot para F3
            (resumen + paginación) sin card doble.
          </p>
          <p className="text-xs">
            Contrato:{" "}
            <code className="font-mono">src/shared/ui/table/README.md</code>
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={density === "list" ? "default" : "outline"}
          onClick={() => setDensity("list")}
        >
          Density list
        </Button>
        <Button
          size="sm"
          variant={density === "compact" ? "default" : "outline"}
          onClick={() => setDensity("compact")}
        >
          Density compact
        </Button>
        <Button
          size="sm"
          variant={showLoading ? "secondary" : "outline"}
          onClick={() => setShowLoading((v) => !v)}
        >
          {showLoading ? "Ocultar skeleton" : "Mostrar skeleton"}
        </Button>
        <Badge variant="neutral" tone="soft">
          sort: {sort ? `${sort.field} ${sort.direction}` : "none"}
        </Badge>
      </div>

      <EntityListTable
        columns={demoColumns}
        rows={MOCK_ROWS}
        getRowId={(r) => r.id}
        density={density}
        isLoading={showLoading}
        primaryTo={(r) => `/vehicles/${r.id}`}
        sort={sort}
        onSortChange={setSort}
        stickyHeader
        footer={
          <div className="flex items-center justify-between gap-4">
            <span>Mostrando 1–2 de 2 (demo footer · F3)</span>
            <span className="text-xs">Paginación → ListingPagination</span>
          </div>
        }
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Empty = null</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Con <code className="font-mono text-xs">rows=[]</code> y{" "}
            <code className="font-mono text-xs">isLoading=false</code>,{" "}
            <code className="font-mono text-xs">EntityListTable</code> no
            renderiza nada. El empty vive en{" "}
            <code className="font-mono text-xs">ListPageShell.emptyState</code>.
          </p>
          <EntityListTable
            columns={demoColumns.slice(0, 3)}
            rows={[]}
            getRowId={(r) => r.id}
            primaryTo={(r) => `/vehicles/${r.id}`}
          />
          <p className="text-xs italic">
            (Arriba no hay card: el componente devolvió null.)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
