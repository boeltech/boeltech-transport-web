/**
 * NavigationSection — migas, tabs de sección (count/signal) y control segmentado.
 * Canon NL1–NL6 (pedido 2026-11-19-ds-navegacion-local).
 */

import type { ReactNode } from "react";
import { Breadcrumbs } from "@shared/ui/breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import {
  RouteTabsNav,
  TabCount,
  TabSignalDot,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@shared/ui/tabs";

export function NavigationSection() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Breadcrumbs — migas (NL3)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            12 px muted, chevron, máx. 3 eslabones. Códigos en mono sin truncar;
            nombres truncan a 40 ch con tooltip.
          </p>
          <DemoBlock label="2 eslabones">
            <Breadcrumbs
              crumbs={[
                { label: "Vehículos", to: "/vehicles" },
                { label: "ECO-42", mono: true },
              ]}
            />
          </DemoBlock>
          <DemoBlock label="3 eslabones (contexto viaje → factura)">
            <Breadcrumbs
              crumbs={[
                { label: "Viajes", to: "/trips" },
                { label: "TRP-261118-0001", to: "/trips/trip-1", mono: true },
                { label: "F-1211", mono: true },
              ]}
            />
          </DemoBlock>
          <DemoBlock label="Truncado de nombre largo">
            <Breadcrumbs
              crumbs={[
                { label: "Clientes", to: "/clients" },
                {
                  label:
                    "Escuela Kemper Urgate de Educación Superior del Altiplano Norte",
                },
              ]}
            />
          </DemoBlock>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tabs de sección — count y signal (NL1 / NL6)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Un solo componente segmentado. Pastilla mono 11 px; punto 6 px con{" "}
            <code className="font-mono text-xs">aria-label</code>. Sin íconos
            (NL5).
          </p>
          <DemoBlock label="RouteTabsNav (por ruta)">
            <RouteTabsNav
              aria-label="Demo secciones"
              items={[
                { id: "datos", to: "/design-system", end: true, label: "Datos" },
                {
                  id: "docs",
                  to: "/design-system/docs",
                  label: "Documentos",
                  count: 3,
                  signal: "attention",
                },
                {
                  id: "gps",
                  to: "/design-system/gps",
                  label: "GPS",
                  signal: "live",
                  signalLabel: "Señal en vivo",
                },
                {
                  id: "blocked",
                  to: "/design-system/blocked",
                  label: "Fiscal",
                  disabled: true,
                  title: "Completa el RFC para habilitar",
                  signal: "blocked",
                },
              ]}
            />
          </DemoBlock>
          <DemoBlock label="Tabs in-page + primitivos TabCount / TabSignalDot">
            <Tabs defaultValue="summary">
              <TabsList>
                <TabsTrigger value="summary" className="gap-2">
                  Resumen
                </TabsTrigger>
                <TabsTrigger value="cargo" className="gap-2">
                  Cargas
                  <TabCount count={4} />
                  <TabSignalDot signal="attention" />
                </TabsTrigger>
                <TabsTrigger value="billing" className="gap-2" disabled title="Sin CFDI aún">
                  Facturación
                  <TabSignalDot signal="blocked" label="Bloqueado" />
                </TabsTrigger>
              </TabsList>
              <TabsContent value="summary" className="text-sm text-muted-foreground">
                Panel de ejemplo — DetailPageShell / HubPageShell ya cablean count/signal.
              </TabsContent>
              <TabsContent value="cargo" className="text-sm text-muted-foreground">
                Contador y punto de atención en el trigger.
              </TabsContent>
            </Tabs>
          </DemoBlock>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Control segmentado (no es tab de sección)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Toolbar h-32 (Tabla/Tarjetas, tema, periodo). Misma familia visual
            soft, pero <strong>no navega</strong> secciones de ficha.
          </p>
          <div className="flex flex-wrap items-end gap-6">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Vista del listado — no-tab-de-sección
              </p>
              <div
                className="inline-flex h-8 items-center gap-0.5 rounded-md border border-border bg-muted p-0.5"
                role="group"
                aria-label="Vista del listado (demo)"
              >
                <span className="inline-flex h-6 items-center rounded px-2.5 text-xs font-medium bg-background text-foreground shadow-sm">
                  Tabla
                </span>
                <span className="inline-flex h-6 items-center rounded px-2.5 text-xs font-medium text-muted-foreground">
                  Tarjetas
                </span>
              </div>
            </div>
            <DemoBlock label="Al lado de tabs de sección (contraste)">
              <div className="flex flex-wrap items-center gap-4">
                <RouteTabsNav
                  aria-label="Demo contraste"
                  items={[
                    { id: "a", to: "/design-system", end: true, label: "Datos" },
                    { id: "b", to: "/design-system/b", label: "Historial", count: 2 },
                  ]}
                />
                <div
                  className="inline-flex h-8 items-center gap-0.5 rounded-md border border-border bg-muted p-0.5"
                  role="group"
                  aria-label="Densidad (demo)"
                >
                  <span className="inline-flex h-6 items-center rounded px-2.5 text-xs font-medium bg-background text-foreground shadow-sm">
                    Tabla
                  </span>
                  <span className="inline-flex h-6 items-center rounded px-2.5 text-xs font-medium text-muted-foreground">
                    Tarjetas
                  </span>
                </div>
              </div>
            </DemoBlock>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DemoBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}
