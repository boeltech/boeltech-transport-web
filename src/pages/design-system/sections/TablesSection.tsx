/**
 * TablesSection — EntityListTable (SoT §7 T1–T10 + share / summaryRow)
 *
 * Demo viva: kinds, density list/compact, sort + aria-sort, skeleton, empty=null,
 * filas de grupo, share + summaryRow.
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
  type EntityListShareValue,
  type EntityListSortState,
  type EntityListStackedValue,
} from "@shared/ui/table";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";

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

type GroupDemoRow = {
  id: string;
  code: string;
  clientId: string;
  departure: string;
  rate: number;
  collected: number;
  pending: number;
};

const GROUP_DEMO_CLIENTS: Record<
  string,
  { name: string; tripCount: number; pending: number }
> = {
  c1: { name: "Epicteto", tripCount: 1, pending: 250 },
  c2: { name: "ORGANICOS ÑAVEZ OSORIO", tripCount: 3, pending: 41_000 },
};

const GROUP_DEMO_ROWS: GroupDemoRow[] = [
  {
    id: "g1",
    code: "TRP-261002-0001",
    clientId: "c1",
    departure: "2026-10-02",
    rate: 28_000,
    collected: 27_750,
    pending: 250,
  },
  {
    id: "g2",
    code: "TRP-261108-0003",
    clientId: "c2",
    departure: "2026-11-13",
    rate: 32_500,
    collected: 17_500,
    pending: 15_000,
  },
  {
    id: "g3",
    code: "TRP-261110-0004",
    clientId: "c2",
    departure: "2026-11-15",
    rate: 26_000,
    collected: 0,
    pending: 26_000,
  },
];

const GROUP_DEMO_COLUMNS: EntityListColumnDef<GroupDemoRow>[] = [
  { id: "code", header: "Viaje", kind: "primary", accessor: (r) => r.code },
  { id: "departure", header: "Salida", kind: "date", accessor: (r) => r.departure },
  { id: "rate", header: "Tarifa", kind: "money", accessor: (r) => r.rate },
  {
    id: "collected",
    header: "Cobrado",
    kind: "stacked",
    stackedWeight: "normal",
    headerClassName: "text-right",
    className: "text-right",
    accessor: (r): EntityListStackedValue => ({
      primary: (
        <span className="font-mono tabular-nums">
          {formatMxCurrency(r.collected)}
        </span>
      ),
      secondary: r.collected > 0 ? "Último: Efectivo · Lote" : "Sin abonos",
    }),
  },
  {
    id: "pending",
    header: "Por cobrar",
    kind: "money",
    className: "font-semibold",
    accessor: (r) => r.pending,
  },
  {
    id: "actions",
    header: "",
    kind: "actions",
    className: "w-auto",
    headerClassName: "w-0",
    accessor: () => (
      <Button type="button" variant="ghost" size="sm">
        Abrir Costos
      </Button>
    ),
  },
];

function GroupedTableDemo() {
  return (
    <div id="tables-entity-list-groups" className="space-y-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Filas de grupo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <code className="font-mono text-xs">getGroupKey</code> +{" "}
            <code className="font-mono text-xs">renderGroupHeader</code>: un
            solo encabezado de columnas, una fila de sección por grupo con
            subtotal alineado bajo su columna y acción{" "}
            <code className="font-mono text-xs">outline sm</code>. El subtotal
            es el total del grupo que da la API; «k de n» cuando la página corta
            al grupo. Ancla: Cobros sin factura.
          </p>
        </CardContent>
      </Card>
      <EntityListTable
        columns={GROUP_DEMO_COLUMNS}
        rows={GROUP_DEMO_ROWS}
        getRowId={(r) => r.id}
        primaryTo={(r) => `/trips/${r.id}?tab=costs`}
        getGroupKey={(r) => r.clientId}
        renderGroupHeader={({ key, rows }) => {
          const client = GROUP_DEMO_CLIENTS[key]!;
          return {
            title: client.name,
            meta:
              rows.length < client.tripCount
                ? `${rows.length} de ${client.tripCount} viajes`
                : client.tripCount === 1
                  ? "1 viaje"
                  : `${client.tripCount} viajes`,
            selection: {
              checked: false,
              onCheckedChange: () => undefined,
              "aria-label": `Seleccionar viajes de ${client.name}`,
            },
            cells: {
              pending: client.pending,
              actions: (
                <Button type="button" variant="outline" size="sm">
                  Registrar cobro
                </Button>
              ),
            },
          };
        }}
      />
    </div>
  );
}

type ShareDemoRow = {
  id: string;
  client: string;
  share: EntityListShareValue;
  invoice: string;
};

const SHARE_DEMO_ROWS: ShareDemoRow[] = [
  {
    id: "s1",
    client: "Acme Logística",
    share: { amount: 18_000, percent: 60 },
    invoice: "Facturar porción",
  },
  {
    id: "s2",
    client: "Norte Industrial",
    share: { amount: 12_000, percent: 40 },
    invoice: "A-123",
  },
];

const SHARE_DEMO_COLUMNS: EntityListColumnDef<ShareDemoRow>[] = [
  { id: "client", header: "Cliente", kind: "text", accessor: (r) => r.client },
  {
    id: "share",
    header: "Parte del flete",
    kind: "share",
    accessor: (r) => r.share,
  },
  {
    id: "invoice",
    header: "Factura",
    kind: "meta",
    accessor: (r) => r.invoice,
  },
];

function ShareSummaryDemo() {
  return (
    <div id="tables-entity-list-share" className="space-y-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Share + summaryRow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Kind <code className="font-mono text-xs">share</code>: monto + % +
            barra delgada. Prop{" "}
            <code className="font-mono text-xs">summaryRow</code>: fila «Base de
            flete» en <code className="font-mono text-xs">tfoot</code> (no es{" "}
            <code className="font-mono text-xs">footer</code> ni grupo). Ancla:
            Reparto en Facturación del viaje.
          </p>
        </CardContent>
      </Card>
      <EntityListTable
        columns={SHARE_DEMO_COLUMNS}
        rows={SHARE_DEMO_ROWS}
        getRowId={(r) => r.id}
        density="compact"
        summaryRow={{
          label: "Base de flete",
          cells: {
            share: { amount: 30_000, percent: 100 },
          },
        }}
      />
    </div>
  );
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

      <GroupedTableDemo />

      <ShareSummaryDemo />

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
